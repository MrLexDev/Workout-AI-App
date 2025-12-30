import { create } from 'zustand';
import type { ExerciseLog } from '../types/performance';
import { performanceStorageService } from '../services/storage/PerformanceStorageService';

interface PerformanceState {
    logs: ExerciseLog[];

    // Actions
    addLog: (exerciseId: string, weight: number, reps: number, id?: string, duration?: number, rpe?: number) => void;
    deleteLogs: (ids: string[]) => void;
    getLogsByExercise: (exerciseId: string) => ExerciseLog[];
    getPersonalRecord: (exerciseId: string) => number; // Max weight lifted
}

// Initial load
const initialData = performanceStorageService.loadLogs();

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
    logs: initialData.logs,

    addLog: (exerciseId: string, weight: number, reps: number, id?: string, duration?: number, rpe?: number) => {
        set((state) => {
            // Epley Formula for 1RM
            // 1RM = Weight * (1 + Reps/30)
            const oneRepMax = weight * (1 + reps / 30);

            const newLog: ExerciseLog = {
                id: id || crypto.randomUUID(),
                exerciseId,
                timestamp: Date.now(),
                weight,
                reps,
                oneRepMax,
                duration,
                rpe
            };

            const newLogs = [...state.logs, newLog];

            // Persist
            performanceStorageService.saveLogs({ logs: newLogs });

            return { logs: newLogs };
        });
    },

    deleteLogs: (ids: string[]) => {
        set((state) => {
            const newLogs = state.logs.filter(log => !ids.includes(log.id));
            performanceStorageService.saveLogs({ logs: newLogs });
            return { logs: newLogs };
        });
    },

    getLogsByExercise: (exerciseId) => {
        return get().logs
            .filter(log => log.exerciseId === exerciseId)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    getPersonalRecord: (exerciseId) => {
        const exerciseLogs = get().logs.filter(log => log.exerciseId === exerciseId);
        if (exerciseLogs.length === 0) return 0;
        return Math.max(...exerciseLogs.map(log => log.weight));
    }
}));
