import { create } from 'zustand';
import { type Routine } from '../types/workout';
import { workoutStorageService } from '../services/storage/WorkoutStorageService';
import initialRoutinesData from '../data/initialRoutines.json';

interface WorkoutState {
    routines: Routine[];
    activeRoutineId: string | null;

    // Active Session State
    isSessionActive: boolean;
    activeRoutine: Routine | null;
    sessionState: 'IDLE' | 'WORK' | 'REST' | 'COMPLETED';
    currentExerciseIndex: number;
    setsRemaining: number;

    // Actions
    selectRoutine: (id: string) => void;
    getRoutineById: (id: string) => Routine | undefined;

    // Optional: Action to reload from storage or reset
    refreshRoutines: () => void;

    startSession: () => void;
    endSession: () => void;

    // Session Flow Actions
    completeSet: () => void;
    startWork: () => void;

    // Data Management
    updateRoutine: (routine: Routine) => void;
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

    selectRoutine: (id) => set((state) => ({
        activeRoutineId: id,
        activeRoutine: state.routines.find(r => r.id === id) || null
    })),

    getRoutineById: (id) => get().routines.find((r) => r.id === id),

    refreshRoutines: () => {
        set({ routines: workoutStorageService.loadRoutines() });
    },

    startSession: () => {
        const state = get();
        if (!state.activeRoutine) return;

        // Initialize session
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
            // Exercise Done -> Move to next exercise
            const nextIndex = state.currentExerciseIndex + 1;
            const nextExercise = state.activeRoutine.exercises[nextIndex];

            if (nextExercise) {
                // Next Exercise Setup
                set({
                    currentExerciseIndex: nextIndex,
                    setsRemaining: nextExercise.targetSets,
                    sessionState: 'WORK' // Automatically start working on next exercise? Or maybe setup? Let's do WORK for fluidity.
                });
            } else {
                // Workout Completed
                set({
                    setsRemaining: 0,
                    sessionState: 'COMPLETED'
                });
            }
        }
    },

    startWork: () => {
        set({ sessionState: 'WORK' });
    },

    updateRoutine: (updatedRoutine: Routine) => {
        const state = get();
        const newRoutines = state.routines.map(r => r.id === updatedRoutine.id ? updatedRoutine : r);

        // Save to storage
        try {
            workoutStorageService.saveRoutines(newRoutines);
            set({ routines: newRoutines });
        } catch (e) {
            console.error("Failed to save updated routine", e);
        }
    }
}));