export interface SetTarget {
    reps: number;
    weight: number; // in kg
    rpe?: number; // Rate of Perceived Exertion (optional)
}

export interface SecondaryMuscle {
    muscle: string;
    impact: 'High' | 'Low';
}

export interface ExerciseDefinition {
    id: string; // matches exerciseId in RoutineExercise
    name: string;
    primaryMuscles: string[];
    secondaryMuscles: SecondaryMuscle[];
    equipment: string;
    description: string;
}

// The configuration of an exercise within a specific routine
export interface RoutineExercise {
    exerciseId: string; // Links to ExerciseDefinition
    targetSets: number;
    minimumRepetitions: number;
    maximumRepetitions: number;
    restTimeSeconds: number;
    targetRpe: number;
    notes: string;
    lastSessionWeight?: number;
}

// A fully populated exercise object for use in the UI (Runtime)
export type HydratedExercise = RoutineExercise & ExerciseDefinition;

export interface Routine {
    version: string;
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