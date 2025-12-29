export interface SetTarget {
    reps: number;
    weight: number; // in kg
    rpe?: number; // Rate of Perceived Exertion (optional)
}

export interface ExerciseDefinition {
    id: string;
    name: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: string;
    description: string;
}

export interface Exercise {
    exerciseId: string; // Internal identifier for the exercise type
    name: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: string;
    targetSets: number;
    minimumRepetitions: number;
    maximumRepetitions: number;
    restTimeSeconds: number; // Renamed from restTimeSec
    targetRpe: number;
    notes: string;
    lastSessionWeight?: number;
}

export interface Routine {
    version: string; // e.g., "1.1.0"
    id: string;
    name: string;
    category: string;
    difficulty: string;
    estimatedDurationMinutes: number;
    description: string;
    exercises: Exercise[];
    tags: string[];
    lastPerformed?: number; // Timestamp
}