export interface SetTarget {
    reps: number;
    weight: number; // in kg
    rir?: number; // Reps in Reserve (optional)
}

export interface SecondaryMuscle {
    muscle: string;
    impact: 'High' | 'Low';
}

export interface ExerciseDefinition {
    id: string;
    name: string;
    aliases?: string[];
    exerciseType?: string; // e.g. "Strength"
    mechanics?: string; // e.g. "Compound"
    forceType?: string; // e.g. "Pull"
    experienceLevel?: string; // e.g. "Advanced"
    targetMuscles: {
        primary: string[];
        secondary: string[]; // Simple string array now, lost 'impact' granularity in pure JSON but can infer
    };
    equipmentList: string[]; // renamed from equipment string
    instructions?: {
        setup?: string;
        execution?: string[];
        tips?: string[];
    };
    media?: {
        thumbnailUrl?: string;
        videoUrl?: string;
    };
    metadata?: {
        estimatedCaloriesBurnedPerMinute?: number;
        isUnilateral?: boolean;
    };
    description?: string; // Kept for backward compat or just ease, though instructions effectively replace it.
}

// The configuration of an exercise within a specific routine
export interface RoutineExercise {
    exerciseId: string; // Links to ExerciseDefinition
    targetSets: number;
    minimumRepetitions: number;
    maximumRepetitions: number;
    restTimeSeconds: number;
    targetRir: number;
    notes: string;
    lastSessionWeight?: number;
}

// A fully populated exercise object for use in the UI (Runtime)
export type HydratedExercise = RoutineExercise & ExerciseDefinition;

export interface Routine {
    id: string;
    name: string;
    category: string;
    difficulty: string;
    estimatedDurationMinutes: number;
    description: string;
    exercises: RoutineExercise[];
    tags: string[];
    lastPerformed?: number;
}

export interface HydratedRoutine extends Omit<Routine, 'exercises'> {
    exercises: HydratedExercise[];
}