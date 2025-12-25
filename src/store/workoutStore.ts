import { create } from 'zustand';
import { type Routine } from '../types/workout';

interface WorkoutState {
    routines: Routine[];
    activeRoutineId: string | null;

    // Actions
    selectRoutine: (id: string) => void;
    getRoutineById: (id: string) => Routine | undefined;
}
////////////////////////////////////
// Mock Data to verify UI rendering
const MOCK_ROUTINES: Routine[] = [
    {
        id: 'push-a',
        name: 'Push Day A (Hypertrophy)',
        description: 'Focus on chest volume and triceps isolation',
        exercises: [
            { id: 'bp-flat', name: 'Barbell Bench Press', targetSets: 4, restTimeSec: 180 },
            { id: 'ohp', name: 'Overhead Press', targetSets: 3, restTimeSec: 120 },
            { id: 'inc-db', name: 'Incline DB Press', targetSets: 3, restTimeSec: 90 },
        ]
    },
    {
        id: 'pull-a',
        name: 'Pull Day A (Strength)',
        description: 'Heavy deadlifts and weighted pullups',
        exercises: [
            { id: 'dl', name: 'Deadlift', targetSets: 3, restTimeSec: 300 },
            { id: 'pullup', name: 'Weighted Pullups', targetSets: 4, restTimeSec: 180 },
        ]
    }
];

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    routines: MOCK_ROUTINES,
    activeRoutineId: null,

    selectRoutine: (id) => set({ activeRoutineId: id }),

    getRoutineById: (id) => get().routines.find((r) => r.id === id),
}));