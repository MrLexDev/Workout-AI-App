export interface SetEntryData {
    setIndex: number;
    weight: number;
    reps: number;
    rir: number;
    isCompleted: boolean;
    completedAt?: number;
    durationSeconds?: number;
}

export interface ExerciseSessionState {
    exerciseId: string;
    exerciseIndex: number;
    sets: SetEntryData[];
    isExpanded: boolean;
}

export interface ActiveRestTimer {
    id: number;
    exerciseId: string;
    exerciseName: string;
    targetSeconds: number;
}
