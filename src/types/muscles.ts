export const MUSCLE_STRUCTURE = {
    Chest: ['Chest', 'Upper Chest', 'Lower Chest'],
    Back: ['Lats', 'Rhomboids', 'Traps', 'Lower Back', 'Upper Back'],
    Shoulders: ['Front Delts', 'Side Delts', 'Rear Delts', 'Rotator Cuff'],
    Legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors'],
    Arms: ['Biceps', 'Triceps', 'Forearms'],
    Core: ['Abs', 'Obliques', 'Hip Flexors'],
    Cardio: ['Cardiovascular System']
} as const;

export type MuscleGroup = keyof typeof MUSCLE_STRUCTURE;
export type Muscle = typeof MUSCLE_STRUCTURE[MuscleGroup][number];
export const ALL_MUSCLES: Muscle[] = Object.values(MUSCLE_STRUCTURE).flat();