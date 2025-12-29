import { create } from 'zustand';
import { type Routine, type HydratedRoutine } from '../types/workout';
import { workoutStorageService } from '../services/storage/WorkoutStorageService';
import initialRoutinesData from '../data/initialRoutines.json';
import { hydrateRoutine } from '../utils/routineHelpers';

interface WorkoutState {
    routines: Routine[];
    activeRoutineId: string | null;

    // Active Session State
    isSessionActive: boolean;
    activeRoutine: HydratedRoutine | null;
    sessionState: 'IDLE' | 'WORK' | 'REST' | 'COMPLETED';
    currentExerciseIndex: number;
    setsRemaining: number;

    // Actions
    selectRoutine: (id: string) => void;
    getRoutineById: (id: string) => Routine | undefined;

    refreshRoutines: () => void;

    startSession: () => void;
    endSession: () => void;

    // Session Flow Actions
    completeSet: () => void;
    startWork: () => void;

    // Data Management
    updateRoutine: (routine: Routine) => void;
    createRoutine: (routine: Routine) => void;
    deleteRoutine: (id: string) => void;
}

// Initial load logic
const loadInitialRoutines = (): Routine[] => {
    const stored = workoutStorageService.loadRoutines();
    if (stored.length > 0) {
        return stored;
    }

    // If no stored data, use the initial JSON and save it
    // Cast strict JSON import to Routine[]
    const defaults = initialRoutinesData as unknown as Routine[];
    workoutStorageService.saveRoutines(defaults);
    return defaults;
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    routines: loadInitialRoutines(),
    activeRoutineId: null,

    // Active Session State
    isSessionActive: false,
    activeRoutine: null,
    sessionState: 'IDLE',
    currentExerciseIndex: 0,
    setsRemaining: 0,

    selectRoutine: (id) => {
        const routine = get().routines.find(r => r.id === id);
        set({
            activeRoutineId: id,
            activeRoutine: routine ? hydrateRoutine(routine) : null
        });
    },

    getRoutineById: (id) => get().routines.find((r) => r.id === id),

    refreshRoutines: () => {
        set({ routines: workoutStorageService.loadRoutines() });
    },

    startSession: () => {
        const state = get();
        if (!state.activeRoutine) return;

        // Initialize session
        // Note: activeRoutine is already hydrated, so exercises have full info
        const firstExercise = state.activeRoutine.exercises[0];
        set({
            isSessionActive: true,
            sessionState: 'WORK', // Start directly in Work mode
            currentExerciseIndex: 0,
            setsRemaining: firstExercise ? firstExercise.targetSets : 0
        });
    },

    endSession: () => set({
        isSessionActive: false,
        sessionState: 'IDLE',
        currentExerciseIndex: 0,
        setsRemaining: 0
    }),

    completeSet: () => {
        const state = get();
        if (!state.isSessionActive || !state.activeRoutine) return;

        const currentSets = state.setsRemaining - 1;

        if (currentSets > 0) {
            // More sets in this exercise -> Go to REST
            set({
                setsRemaining: currentSets,
                sessionState: 'REST'
            });
        } else {
            // LAST SET of the current exercise Finished
            // Check if there are more exercises
            const nextIndex = state.currentExerciseIndex + 1;
            const hasNextExercise = state.activeRoutine && nextIndex < state.activeRoutine.exercises.length;

            if (hasNextExercise) {
                set({
                    setsRemaining: 0,
                    sessionState: 'REST'
                });
            } else {
                // No more exercises and last set finished -> Session COMPLETED
                set({
                    sessionState: 'COMPLETED'
                });
            }
        }
    },

    startWork: () => {
        const state = get();
        if (!state.isSessionActive || !state.activeRoutine) return;

        // If we were resting AFTER the last set (setsRemaining === 0)
        // we need to ADVANCE to the next exercise
        if (state.setsRemaining === 0) {
            const nextIndex = state.currentExerciseIndex + 1;
            const nextExercise = state.activeRoutine.exercises[nextIndex];

            if (nextExercise) {
                set({
                    currentExerciseIndex: nextIndex,
                    setsRemaining: nextExercise.targetSets,
                    sessionState: 'WORK'
                });
            } else {
                set({
                    sessionState: 'COMPLETED'
                });
            }
        } else {
            // Normal transition from rest to work within same exercise
            set({ sessionState: 'WORK' });
        }
    },

    updateRoutine: (updatedRoutine: Routine) => {
        const state = get();
        const newRoutines = state.routines.map(r => r.id === updatedRoutine.id ? updatedRoutine : r);

        try {
            workoutStorageService.saveRoutines(newRoutines);
            set((prev) => {
                // If the updated routine is currently active, we need to re-hydrate it
                const newActiveRoutine = prev.activeRoutine && prev.activeRoutine.id === updatedRoutine.id
                    ? hydrateRoutine(updatedRoutine)
                    : prev.activeRoutine;

                return {
                    routines: newRoutines,
                    activeRoutine: newActiveRoutine
                };
            });
        } catch (e) {
            console.error("Failed to save updated routine", e);
        }
    },

    createRoutine: (routine: Routine) => {
        const state = get();
        // Check for duplicates? For now just add.
        const newRoutines = [...state.routines, routine];
        try {
            workoutStorageService.saveRoutines(newRoutines);
            set({ routines: newRoutines });
        } catch (e) {
            console.error("Failed to save new routine", e);
        }
    },

    deleteRoutine: (id: string) => {
        const state = get();
        const newRoutines = state.routines.filter(r => r.id !== id);
        try {
            workoutStorageService.saveRoutines(newRoutines);
            set((prev) => ({
                routines: newRoutines,
                // If deleting active routine, clear it? Maybe not strictly necessary if session is inactive.
                activeRoutine: prev.activeRoutine?.id === id ? null : prev.activeRoutine,
                activeRoutineId: prev.activeRoutineId === id ? null : prev.activeRoutineId
            }));
        } catch (e) {
            console.error("Failed to delete routine", e);
        }
    }
}));