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
        if (!Array.isArray(obj.primaryMuscles)) throw new Error('Invalid exercise: "primaryMuscles" must be an array.');

        let secondaryMuscles = obj.secondaryMuscles;
        if (!Array.isArray(secondaryMuscles)) throw new Error('Invalid exercise: "secondaryMuscles" must be an array.');

        // Migration: Convert string[] to SecondaryMuscle[]
        if (secondaryMuscles.length > 0 && typeof secondaryMuscles[0] === 'string') {
            secondaryMuscles = secondaryMuscles.map((m: string) => ({ muscle: m, impact: 'Low' }));
        }

        // Equipment and description are technically optional in some loose definitions, but strict in our type
        // If your type strictly requires them, check them. 
        // Based on types/workout.ts: all fields are required.
        if (typeof obj.equipment !== 'string') throw new Error('Invalid exercise: missing or invalid "equipment".');
        if (typeof obj.description !== 'string') throw new Error('Invalid exercise: missing or invalid "description".');

        return {
            id: obj.id,
            name: obj.name,
            primaryMuscles: obj.primaryMuscles,
            secondaryMuscles: secondaryMuscles,
            equipment: obj.equipment,
            description: obj.description
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
