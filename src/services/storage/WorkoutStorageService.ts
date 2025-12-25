import { type Routine, type Exercise } from '../../types/workout';

const STORAGE_KEY = 'workout-tracker-v1';

export class WorkoutStorageService {
    private static instance: WorkoutStorageService;

    private constructor() {}

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

            // Optional: We could validate each routine here as well
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
     * Parses a JSON string and validates it matches the Routine interface.
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

        // Required fields for Routine
        if (typeof obj.id !== 'string' || obj.id.trim() === '') {
            throw new Error('Invalid routine: missing or invalid "id".');
        }
        if (typeof obj.name !== 'string' || obj.name.trim() === '') {
            throw new Error('Invalid routine: missing or invalid "name".');
        }
        if (!Array.isArray(obj.exercises)) {
            throw new Error('Invalid routine: "exercises" must be an array.');
        }

        // Validate each exercise in the routine
        const exercises: Exercise[] = obj.exercises.map((ex: any, index: number) => {
            if (!ex || typeof ex !== 'object') {
                throw new Error(`Invalid exercise at index ${index}: not an object.`);
            }
            if (typeof ex.id !== 'string' || ex.id.trim() === '') {
                throw new Error(`Invalid exercise at index ${index}: missing or invalid "id".`);
            }
            if (typeof ex.name !== 'string' || ex.name.trim() === '') {
                throw new Error(`Invalid exercise at index ${index}: missing or invalid "name".`);
            }
            if (typeof ex.targetSets !== 'number') {
                throw new Error(`Invalid exercise at index ${index}: "targetSets" must be a number.`);
            }
            if (typeof ex.restTimeSec !== 'number') {
                throw new Error(`Invalid exercise at index ${index}: "restTimeSec" must be a number.`);
            }
            
            return {
                id: ex.id,
                name: ex.name,
                targetSets: ex.targetSets,
                restTimeSec: ex.restTimeSec,
                lastSessionWeight: typeof ex.lastSessionWeight === 'number' ? ex.lastSessionWeight : undefined
            };
        });

        const routine: Routine = {
            id: obj.id,
            name: obj.name,
            exercises,
            description: typeof obj.description === 'string' ? obj.description : undefined,
            lastPerformed: typeof obj.lastPerformed === 'number' ? obj.lastPerformed : undefined
        };

        return routine;
    }
}

export const workoutStorageService = WorkoutStorageService.getInstance();
