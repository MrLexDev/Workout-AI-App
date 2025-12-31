export interface ExerciseLog {
    id: string; // Unique ID
    exerciseId: string;
    timestamp: number;
    weight: number; // kg
    reps: number;
    rir?: number; // Reps in Reserve (0-5+)
    oneRepMax: number; // Calculated
    duration?: number; // Time in seconds to complete the set
}

export interface ExercisePerformanceData {
    logs: ExerciseLog[];
}
