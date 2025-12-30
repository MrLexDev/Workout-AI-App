import { type WorkoutSession } from '../types/history';
import { type ExerciseDefinition, type HydratedRoutine } from '../types/workout';



interface MuscleScore {
    [muscle: string]: number;
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
            exercise.primaryMuscles.forEach(m => {
                addScore(m, setValue * 1.0);
            });

            // Secondary Muscles
            exercise.secondaryMuscles.forEach(sm => {
                let impact = 0.25; // Default Low
                if (typeof sm === 'string') {
                    // Legacy string support (should be migrated, but safe to have)
                    impact = 0.25;
                } else {
                    if (sm.impact === 'High') impact = 0.5;
                    else impact = 0.25;

                    addScore(sm.muscle, setValue * impact);
                    return; // Continued below is for string case if I didn't return, but here I return
                }

                // Fallback for string case if sm was string
                if (typeof sm === 'string') {
                    addScore(sm, setValue * impact);
                }
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
        ex.primaryMuscles.forEach((m: string) => addScore(m, sets * 1.0));

        // Secondary
        ex.secondaryMuscles.forEach((sm: any) => {
            const impact = sm.impact === 'High' ? 0.5 : 0.25;
            addScore(sm.muscle, sets * impact);
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
