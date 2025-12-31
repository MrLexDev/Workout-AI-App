import { type Routine, type RoutineExercise } from '../../types/workout';

const STORAGE_KEY = 'workout-tracker-v1';

export class WorkoutStorageService {
    private static instance: WorkoutStorageService;

    private constructor() { }

    public static getInstance(): WorkoutStorageService {
        if (!WorkoutStorageService.instance) {
            WorkoutStorageService.instance = new WorkoutStorageService();
        }
        return WorkoutStorageService.instance;
    }

    /**
     * Saves the array of routines to localStorage.
     */
    public saveRoutines(routines: Routine[]): void {
        try {
            const data = JSON.stringify(routines);
            localStorage.setItem(STORAGE_KEY, data);
        } catch (error) {
            console.error('Error saving routines to localStorage:', error);
            throw new Error('Could not save routines to storage.');
        }
    }

    /**
     * Loads the array of routines from localStorage.
     * Returns an empty array if no data is found or if parsing fails.
     */
    public loadRoutines(): Routine[] {
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
                    return this.validateAndParseRoutine(JSON.stringify(item));
                } catch (e) {
                    console.warn('Skipping invalid routine in storage:', e);
                    return null;
                }
            }).filter((r): r is Routine => r !== null);
        } catch (error) {
            console.error('Error parsing routines from localStorage:', error);
            return [];
        }
    }

    /**
     * Parses a JSON string and validates it matches the Routine interface v1.1.0.
     * Throws a descriptive error if invalid.
     */
    public validateAndParseRoutine(jsonString: string): Routine {
        let obj: any;
        try {
            obj = JSON.parse(jsonString);
        } catch (error) {
            throw new Error('Invalid JSON format.');
        }

        if (!obj || typeof obj !== 'object') {
            throw new Error('Invalid routine: data is not an object.');
        }

        // Required fields for Routine v1.1.0
        if (typeof obj.version !== 'string') throw new Error('Invalid routine: missing or invalid "version".');
        if (typeof obj.id !== 'string' || obj.id.trim() === '') throw new Error('Invalid routine: missing or invalid "id".');
        if (typeof obj.name !== 'string' || obj.name.trim() === '') throw new Error('Invalid routine: missing or invalid "name".');
        if (typeof obj.category !== 'string') throw new Error('Invalid routine: missing or invalid "category".');
        if (typeof obj.difficulty !== 'string') throw new Error('Invalid routine: missing or invalid "difficulty".');
        if (typeof obj.estimatedDurationMinutes !== 'number') throw new Error('Invalid routine: missing or invalid "estimatedDurationMinutes".');
        if (typeof obj.description !== 'string') throw new Error('Invalid routine: missing or invalid "description".');
        if (!Array.isArray(obj.exercises)) throw new Error('Invalid routine: "exercises" must be an array.');
        if (!Array.isArray(obj.tags)) throw new Error('Invalid routine: "tags" must be an array.');

        // Validate each exercise in the routine
        const exercises: RoutineExercise[] = obj.exercises.map((ex: any, index: number) => {
            if (!ex || typeof ex !== 'object') {
                throw new Error(`Invalid exercise at index ${index}: not an object.`);
            }
            if (typeof ex.exerciseId !== 'string' || ex.exerciseId.trim() === '') {
                throw new Error(`Invalid exercise at index ${index}: missing or invalid "exerciseId".`);
            }
            // Removed validation for name, muscles, equipment as they are now resolved dynamically

            if (typeof ex.targetSets !== 'number') {
                throw new Error(`Invalid exercise at index ${index}: "targetSets" must be a number.`);
            }
            if (typeof ex.minimumRepetitions !== 'number') {
                throw new Error(`Invalid exercise at index ${index}: "minimumRepetitions" must be a number.`);
            }
            if (typeof ex.maximumRepetitions !== 'number') {
                throw new Error(`Invalid exercise at index ${index}: "maximumRepetitions" must be a number.`);
            }

            // Handle rename from restTimeSec to restTimeSeconds if importing old format
            const restTime = typeof ex.restTimeSeconds === 'number' ? ex.restTimeSeconds : ex.restTimeSec;
            if (typeof restTime !== 'number') {
                throw new Error(`Invalid exercise at index ${index}: missing or invalid "restTimeSeconds".`);
            }

            const targetRir = typeof ex.targetRir === 'number' ? ex.targetRir : (typeof ex.targetRpe === 'number' ? (10 - ex.targetRpe) : undefined);
            if (typeof targetRir !== 'number') {
                throw new Error(`Invalid exercise at index ${index}: missing or invalid "targetRir".`);
            }
            if (typeof ex.notes !== 'string') {
                throw new Error(`Invalid exercise at index ${index}: "notes" must be a string.`);
            }

            return {
                exerciseId: ex.exerciseId,
                targetSets: ex.targetSets,
                minimumRepetitions: ex.minimumRepetitions,
                maximumRepetitions: ex.maximumRepetitions,
                restTimeSeconds: restTime,
                targetRir,
                notes: ex.notes,
                lastSessionWeight: typeof ex.lastSessionWeight === 'number' ? ex.lastSessionWeight : undefined
            };
        });

        const routine: Routine = {
            version: obj.version,
            id: obj.id,
            name: obj.name,
            category: obj.category,
            difficulty: obj.difficulty,
            estimatedDurationMinutes: obj.estimatedDurationMinutes,
            description: obj.description,
            exercises,
            tags: obj.tags,
            lastPerformed: typeof obj.lastPerformed === 'number' ? obj.lastPerformed : undefined
        };

        return routine;
    }
}

export const workoutStorageService = WorkoutStorageService.getInstance();
