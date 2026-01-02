import { type ExerciseDefinition } from '../../types/workout';

const STORAGE_KEY = 'custom-exercises-v1';

export class ExerciseStorageService {
    private static instance: ExerciseStorageService;

    private constructor() { }

    public static getInstance(): ExerciseStorageService {
        if (!ExerciseStorageService.instance) {
            ExerciseStorageService.instance = new ExerciseStorageService();
        }
        return ExerciseStorageService.instance;
    }

    /**
     * Saves the array of custom exercises to localStorage.
     */
    public saveCustomExercises(exercises: ExerciseDefinition[]): void {
        try {
            const data = JSON.stringify(exercises);
            localStorage.setItem(STORAGE_KEY, data);
        } catch (error) {
            console.error('Error saving custom exercises to localStorage:', error);
            throw new Error('Could not save custom exercises to storage.');
        }
    }

    /**
     * Loads the array of custom exercises from localStorage.
     * Returns an empty array if no data is found or if parsing fails.
     */
    public loadCustomExercises(): ExerciseDefinition[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return [];
        }

        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
                console.error('Data in localStorage is not an array.');
                return [];
            }

            return parsed.map((item: any) => {
                try {
                    return this.validateAndParseExercise(item);
                } catch (e) {
                    console.warn('Skipping invalid custom exercise in storage:', e);
                    return null;
                }
            }).filter((e): e is ExerciseDefinition => e !== null);
        } catch (error) {
            console.error('Error parsing custom exercises from localStorage:', error);
            return [];
        }
    }

    /**
     * Validates a single exercise object.
     */
    public validateAndParseExercise(obj: any): ExerciseDefinition {
        if (!obj || typeof obj !== 'object') {
            throw new Error('Invalid exercise: data is not an object.');
        }

        if (typeof obj.id !== 'string' || obj.id.trim() === '') throw new Error('Invalid exercise: missing or invalid "id".');
        if (typeof obj.name !== 'string' || obj.name.trim() === '') throw new Error('Invalid exercise: missing or invalid "name".');

        // Handle targetMuscles (new) vs primaryMuscles (old)
        let targetMuscles = obj.targetMuscles;
        if (!targetMuscles) {
            // Migration from old structure
            if (Array.isArray(obj.primaryMuscles)) {
                targetMuscles = {
                    primary: obj.primaryMuscles,
                    secondary: []
                };

                if (Array.isArray(obj.secondaryMuscles)) {
                    // Map legacy secondary objects {muscle, impact} to string[]
                    targetMuscles.secondary = obj.secondaryMuscles.map((item: any) => {
                        if (typeof item === 'string') return item;
                        return item.muscle;
                    });
                }
            } else {
                throw new Error('Invalid exercise: missing "targetMuscles".');
            }
        }

        // Validate targetMuscles structure
        if (!targetMuscles.primary || !Array.isArray(targetMuscles.primary)) {
            // Fallback or error? Let's be strict for new data
            if (!obj.primaryMuscles) throw new Error('Invalid exercise: missing primary muscles.');
        }

        // Handle equipmentList (new) vs equipment (old)
        let equipmentList = obj.equipmentList;
        if (!Array.isArray(equipmentList)) {
            if (typeof obj.equipment === 'string') {
                equipmentList = obj.equipment.split(',').map((s: string) => s.trim());
            } else {
                equipmentList = []; // Default to empty or required?
            }
        }

        return {
            id: obj.id,
            name: obj.name,
            aliases: Array.isArray(obj.aliases) ? obj.aliases : [],
            exerciseType: obj.exerciseType,
            mechanics: obj.mechanics,
            forceType: obj.forceType,
            experienceLevel: obj.experienceLevel,
            targetMuscles: targetMuscles,
            equipmentList: equipmentList,
            instructions: obj.instructions,
            media: obj.media,
            metadata: obj.metadata,
            description: obj.description || (obj.instructions && obj.instructions.setup ? obj.instructions.setup : '')
        };
    }

    /**
     * Parsing a list of exercises from a raw JSON string (e.g. from user paste).
     */
    public parseImportJson(jsonString: string): ExerciseDefinition[] {
        let parsed: any;
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            throw new Error('Invalid JSON syntax.');
        }

        if (!Array.isArray(parsed)) {
            throw new Error('Imported data must be an array of exercises.');
        }

        return parsed.map((item, idx) => {
            try {
                return this.validateAndParseExercise(item);
            } catch (error: any) {
                throw new Error(`Item ${idx + 1} is invalid: ${error.message}`);
            }
        });
    }
    /**
     * Saves the list of hidden exercise IDs.
     */
    public saveHiddenExercises(hiddenIds: string[]): void {
        try {
            const data = JSON.stringify(hiddenIds);
            localStorage.setItem('hidden-exercises-v1', data);
        } catch (error) {
            console.error('Error saving hidden exercises:', error);
        }
    }

    /**
     * Loads the list of hidden exercise IDs.
     */
    public loadHiddenExercises(): string[] {
        const data = localStorage.getItem('hidden-exercises-v1');
        if (!data) return [];
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error loading hidden exercises:', error);
            return [];
        }
    }
}

export const exerciseStorageService = ExerciseStorageService.getInstance();
