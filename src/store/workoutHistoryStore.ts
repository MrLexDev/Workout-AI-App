import { create } from 'zustand';
import type { WorkoutSession } from '../types/history';
import { workoutHistoryStorageService } from '../services/storage/WorkoutHistoryStorageService';

interface WorkoutHistoryState {
    sessions: WorkoutSession[];

    // Actions
    saveSession: (session: WorkoutSession) => void;
    deleteSession: (id: string) => void;
    getSessionsByRoutine: (routineId: string) => WorkoutSession[];
}

// Initial load
const initialSessions = workoutHistoryStorageService.loadSessions();

export const useWorkoutHistoryStore = create<WorkoutHistoryState>((set, get) => ({
    sessions: initialSessions,

    saveSession: (session: WorkoutSession) => {
        set((state) => {
            const newSessions = [...state.sessions, session];
            workoutHistoryStorageService.saveSessions(newSessions);
            return { sessions: newSessions };
        });
    },

    deleteSession: (id: string) => {
        set((state) => {
            const newSessions = state.sessions.filter(s => s.id !== id);
            workoutHistoryStorageService.saveSessions(newSessions);
            return { sessions: newSessions };
        });
    },

    getSessionsByRoutine: (routineId: string) => {
        return get().sessions
            .filter(s => s.routineId === routineId)
            .sort((a, b) => b.startTime - a.startTime); // Newer first
    }
}));
