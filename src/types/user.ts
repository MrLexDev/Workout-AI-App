export interface WeightEntry {
    id: string; // Unique ID for list rendering stability
    date: string; // ISO Date string YYYY-MM-DD or ISO timestamp
    weight: number; // in kg
}

export type WeightUnit = 'kg' | 'lb';

export interface UserData {
    height: number | null; // in cm, null if not set
    weightHistory: WeightEntry[];
    autoSavePreference: boolean;
    weightUnit: WeightUnit;
    gender: 'male' | 'female' | 'other' | null;
    birthDate: string | null; // ISO Date string YYYY-MM-DD
    availableEquipment: string[];
    objective: string | null;
    specialConsiderations: string | null;
    equipmentSelectionMode: 'full_gym' | 'home_gym';
}
