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

    // Actions
    selectRoutine: (id: string) => void;
    getRoutineById: (id: string) => Routine | undefined;

    refreshRoutines: () => void;

    startSession: () => void;
    endSession: () => void;

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
        set({ isSessionActive: true });
    },

    endSession: () => set({
        isSessionActive: false,
    }),

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