import type { WorkoutSession } from '../../types/history';

const STORAGE_KEY = 'workout_tracker_history_sessions';

export const workoutHistoryStorageService = {
    loadSessions: (): WorkoutSession[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load workout history sessions', e);
            return [];
        }
    },

    saveSessions: (sessions: WorkoutSession[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        } catch (e) {
            console.error('Failed to save workout history sessions', e);
        }
    }
};
