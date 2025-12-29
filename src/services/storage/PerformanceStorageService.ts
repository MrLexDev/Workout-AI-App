import type { ExercisePerformanceData } from '../../types/performance';

const STORAGE_KEY = 'exercise-performance-v1';

export class PerformanceStorageService {
    private static instance: PerformanceStorageService;

    private constructor() { }

    public static getInstance(): PerformanceStorageService {
        if (!PerformanceStorageService.instance) {
            PerformanceStorageService.instance = new PerformanceStorageService();
        }
        return PerformanceStorageService.instance;
    }

    public saveLogs(data: ExercisePerformanceData): void {
        try {
            const json = JSON.stringify(data);
            localStorage.setItem(STORAGE_KEY, json);
        } catch (error) {
            console.error('Error saving performance logs:', error);
        }
    }

    public loadLogs(): ExercisePerformanceData {
        const defaultData: ExercisePerformanceData = { logs: [] };
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return defaultData;

        try {
            const parsed = JSON.parse(stored);
            if (!parsed || !Array.isArray(parsed.logs)) {
                return defaultData;
            }
            return parsed as ExercisePerformanceData;
        } catch (error) {
            console.error('Error parsing performance logs:', error);
            return defaultData;
        }
    }
}

export const performanceStorageService = PerformanceStorageService.getInstance();
