export interface SetTarget {
    reps: number;
    weight: number; // in kg
    rpe?: number; // Rate of Perceived Exertion (optional)
}

export interface Exercise {
    id: string;
    name: string;
    targetSets: number;
    restTimeSec: number;
    lastSessionWeight?: number;
}

export interface Routine {
    id: string;
    name: string;
    description?: string;
    exercises: Exercise[];
    lastPerformed?: number; // Timestamp
}