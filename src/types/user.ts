export interface WeightEntry {
    id: string; // Unique ID for list rendering stability
    date: string; // ISO Date string YYYY-MM-DD or ISO timestamp
    weight: number; // in kg
}

export interface UserData {
    height: number | null; // in cm, null if not set
    weightHistory: WeightEntry[];
}
