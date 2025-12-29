export interface ExerciseLog {
    id: string; // Unique ID
    exerciseId: string;
    timestamp: number;
    weight: number; // kg
    reps: number;
    oneRepMax: number; // Calculated
}

export interface ExercisePerformanceData {
    logs: ExerciseLog[];
}
