export interface ExerciseLog {
    id: string; // Unique ID
    exerciseId: string;
    timestamp: number;
    weight: number; // kg
    reps: number;
    oneRepMax: number; // Calculated
    duration?: number; // Time in seconds to complete the set
}

export interface ExercisePerformanceData {
    logs: ExerciseLog[];
}
