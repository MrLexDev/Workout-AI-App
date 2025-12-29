import type { HydratedRoutine } from './workout';
import type { ExerciseLog } from './performance';

export interface SessionRestData {
    exerciseId: string;
    targetSeconds: number;
    actualSeconds: number; // calculated as (target - remaining) or tracked duration
    timestamp: number;
}

export interface WorkoutSession {
    id: string; // UUID
    routineId: string;
    routineSnapshot: HydratedRoutine; // Save the routine AS IT WAS at that moment
    startTime: number;
    endTime: number;
    durationSeconds: number;
    logs: ExerciseLog[]; // The logs specific to this session
    restData: SessionRestData[];
}
