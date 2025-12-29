import { type Routine, type HydratedRoutine, type HydratedExercise, type ExerciseDefinition } from '../types/workout';
import exerciseData from '../data/exercises.json';
import { exerciseStorageService } from '../services/storage/ExerciseStorageService';

export const getAllExercisesMap = (): Map<string, ExerciseDefinition> => {
    const map = new Map<string, ExerciseDefinition>();
    (exerciseData as ExerciseDefinition[]).forEach(ex => map.set(ex.id, ex));
    exerciseStorageService.loadCustomExercises().forEach(ex => map.set(ex.id, ex));
    return map;
};

export const hydrateRoutine = (routine: Routine): HydratedRoutine => {
    const exerciseMap = getAllExercisesMap();

    const hydratedExercises: HydratedExercise[] = routine.exercises.map(rx => {
        const def = exerciseMap.get(rx.exerciseId);

        const fallback: ExerciseDefinition = {
            id: rx.exerciseId,
            name: "Unknown Exercise",
            primaryMuscles: [],
            secondaryMuscles: [],
            equipment: "Unknown",
            description: "Exercise definition not found."
        };

        return {
            ...rx,
            ...(def || fallback)
        };
    });

    return {
        ...routine,
        exercises: hydratedExercises
    };
};
