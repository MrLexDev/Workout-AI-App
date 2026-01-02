import { type WorkoutSession } from '../types/history';
import { type ExerciseDefinition, type HydratedRoutine } from '../types/workout';



interface MuscleScore {
    [muscle: string]: number;
}

export interface VolumeDataPoint {
    date: string; // ISO Date "YYYY-MM-DD" representing the start of the week/month
    volume: number;
    effectiveReps: number;
}

export interface MuscleVolumeStats {
    [muscle: string]: VolumeDataPoint[];
}

export const calculateMuscleVolume = (
    sessions: WorkoutSession[],
    allExercises: ExerciseDefinition[],
    timeRange: '7d' | '30d' | 'all' = '7d'
): MuscleScore => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // 1. Filter sessions by time range
    const filteredSessions = sessions.filter(session => {
        if (timeRange === 'all') return true;

        const daysAgo = (now - session.startTime) / oneDayMs;
        if (timeRange === '7d') return daysAgo <= 7;
        if (timeRange === '30d') return daysAgo <= 30;
        return true;
    });

    const scores: MuscleScore = {};

    // Helper to add score
    const addScore = (muscle: string, amount: number) => {
        const m = muscle.trim(); // Normalize
        if (!scores[m]) scores[m] = 0;
        scores[m] += amount;
    };

    // 2. Iterate through sessions and logs
    filteredSessions.forEach(session => {
        session.logs.forEach(log => {
            // Find exercise definition
            // We use the one from the session snapshot if possible to respect history, 
            // OR the latest one from allExercises if we want updated categorizations. 
            // Usually, for "Distribution", using the latest definition is better so new categories apply to old logs.
            const exercise = allExercises.find(e => e.id === log.exerciseId);

            if (!exercise) return;

            // A "set" is one log entry in this data model (based on ActiveSessionView structure where each log is a set)
            // Weight * Reps is volume, but user asked for "Effective Sets".
            // "A set counts as 1.0 for primary..."
            const setValue = 1.0;

            // Primary Muscles
            exercise.targetMuscles.primary.forEach(m => {
                addScore(m, setValue * 1.0);
            });

            // Secondary Muscles
            exercise.targetMuscles.secondary.forEach(sm => {
                // We lost impact data, so assume Low (0.25) or standard
                const impact = 0.25;
                addScore(sm, setValue * impact);
            });
        });
    });

    return scores;
};

export const calculateRoutineMuscleVolume = (
    routine: HydratedRoutine
): MuscleScore => {
    const scores: MuscleScore = {};

    const addScore = (muscle: string, amount: number) => {
        const m = muscle.trim();
        if (!scores[m]) scores[m] = 0;
        scores[m] += amount;
    };

    routine.exercises.forEach((ex: any) => {
        const sets = ex.targetSets;

        // Primary
        ex.targetMuscles.primary.forEach((m: string) => addScore(m, sets * 1.0));

        // Secondary
        ex.targetMuscles.secondary.forEach((m: string) => {
            // Assume impact low/std since we lost granularity, or check if object
            // For now, consistent with other places:
            addScore(m, sets * 0.25);
        });
    });

    return scores;
};

export const MUSCLE_GROUPS: Record<string, string[]> = {
    'Chest': ['Chest', 'Upper Chest', 'Lower Chest'],
    'Back': ['Back', 'Upper Back', 'Lats', 'Lower Back', 'Traps', 'Rhomboids'],
    'Shoulders': ['Shoulders', 'Front Delts', 'Side Delts', 'Rear Delts', 'Rotator Cuff'],
    'Legs': ['Legs', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors'],
    'Arms': ['Arms', 'Biceps', 'Triceps', 'Forearms'],
    'Core': ['Core', 'Abs', 'Obliques', 'Hip Flexors']
};

export const groupMuscleScores = (scores: MuscleScore): Record<string, number> => {
    const grouped: Record<string, number> = {
        'Chest': 0,
        'Back': 0,
        'Shoulders': 0,
        'Legs': 0,
        'Arms': 0,
        'Core': 0
    };

    Object.entries(scores).forEach(([muscle, score]) => {
        for (const [group, members] of Object.entries(MUSCLE_GROUPS)) {
            if (members.includes(muscle) || group === muscle) {
                grouped[group] += score;
                break;
            }
        }
        // If not found in specific groups, you might want a 'Other' or just ignore
        // For now, if we have "Cardiovascular System" it will be ignored on the radar which is fine
    });

    return grouped;
};

// --- NEW ---

export const getWeekStartDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
};

export const getMonthStartDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
}

export const calculateVolumeStats = (
    sessions: WorkoutSession[],
    allExercises: ExerciseDefinition[],
    granularity: 'weekly' | 'monthly' = 'weekly'
): MuscleVolumeStats => {
    const stats: MuscleVolumeStats = {};
    const getDateKey = granularity === 'weekly' ? getWeekStartDate : getMonthStartDate;

    // Sort sessions old to new
    const sortedSessions = [...sessions].sort((a, b) => a.startTime - b.startTime);

    // Initialize groupings if needed, or build dynamically
    // We'll iterate and build.

    sortedSessions.forEach(session => {
        const dateKey = getDateKey(session.startTime);

        session.logs.forEach(log => {
            const exercise = allExercises.find(e => e.id === log.exerciseId);
            if (!exercise) return;

            const weight = log.weight || 0;
            const reps = log.reps || 0;
            // 1. Calculate Volume
            const volume = weight * reps;

            // 2. Calculate Effective Reps
            // Rule: Min(Reps, 5) if RIR is low (close to failure).
            // If RIR is high, scale down. E.g. RIR 4 -> 1 effective rep?
            // Simple model: 
            // If RIR <= 2: 5, 4, 3 effective reps...
            // Or use the formula: Effective Reps = max(0, min(reps, 5 - RIR))
            // "Effective reps are the last 5 reps before failure."
            // If RIR is 0, reps are 10. Failure was at 10. Last 5 were effective.
            // If RIR is 2, reps were 10. Failure would be at 12. Reps 8-12 were the "effective zone". 
            // The set essentially stopped 2 reps short.
            // So we got 3 effective reps (5 - RIR).
            // Effective = 5 - RIR.
            // Let's clamp between 0 and 5.
            // And also clamp by actual reps performed (cant have 5 effective reps if you only did 3 reps).

            let effectiveReps = 0;
            if (log.rir !== undefined) {
                effectiveReps = Math.max(0, Math.min(reps, 5 - log.rir));
            } else {
                // Assume moderate intensity if no RIR? Or 0?
                effectiveReps = 0;
            }

            // Distribute to muscles
            const distribute = (muscle: string, ratio: number) => {
                // Use specific muscle name, but Title Case it just in case
                const mName = muscle.trim();

                if (!stats[mName]) stats[mName] = [];

                // Find or create data point for this date
                let dp = stats[mName].find(d => d.date === dateKey);
                if (!dp) {
                    dp = { date: dateKey, volume: 0, effectiveReps: 0 };
                    stats[mName].push(dp);
                    // Keep sorted by date
                    stats[mName].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                }

                dp.volume += volume * ratio;
                dp.effectiveReps += effectiveReps * ratio;
            };

            // Primary
            exercise.targetMuscles.primary.forEach(m => distribute(m, 1.0));

            // Secondary
            exercise.targetMuscles.secondary.forEach(m => {
                distribute(m, 0.25);
            });
        });
    });

    return stats;
};
