export interface ExerciseLog {
    id: string; // Unique ID
    exerciseId: string;
    timestamp: number;
    weight: number; // kg
    reps: number;
    rpe?: number; // Rate of Perceived Exertion (1-10)
    oneRepMax: number; // Calculated
    duration?: number; // Time in seconds to complete the set
}

export interface ExercisePerformanceData {
    logs: ExerciseLog[];
}
