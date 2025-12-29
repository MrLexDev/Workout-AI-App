import { create } from 'zustand';
import type { UserData, WeightEntry } from '../types/user';
import { userStorageService } from '../services/storage/UserStorageService';

interface UserState extends UserData {
    // Actions
    setHeight: (height: number) => void;
    addWeightEntry: (weight: number, date: string) => void;
    deleteWeightEntry: (id: string) => void;
}

// Initial load
const initialData = userStorageService.loadUserData();

export const useUserStore = create<UserState>((set) => ({
    height: initialData.height,
    weightHistory: initialData.weightHistory,

    setHeight: (height: number) => {
        set((state) => {
            const newData = { ...state, height };
            // Persist (excluding function properties is handled by JSON.stringify implicitly, 
            // but we need to construct the data object carefully or just save the relevant parts)
            userStorageService.saveUserData({
                height: newData.height,
                weightHistory: newData.weightHistory
            });
            return { height };
        });
    },

    addWeightEntry: (weight: number, date: string) => {
        set((state) => {
            const newEntry: WeightEntry = {
                id: crypto.randomUUID(),
                date,
                weight
            };
            // Sort by date descending (newest first)
            const newHistory = [...state.weightHistory, newEntry].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const newData = { ...state, weightHistory: newHistory };
            userStorageService.saveUserData({
                height: newData.height,
                weightHistory: newData.weightHistory
            });
            return { weightHistory: newHistory };
        });
    },

    deleteWeightEntry: (id: string) => {
        set((state) => {
            const newHistory = state.weightHistory.filter(entry => entry.id !== id);
            const newData = { ...state, weightHistory: newHistory };
            userStorageService.saveUserData({
                height: newData.height,
                weightHistory: newData.weightHistory
            });
            return { weightHistory: newHistory };
        });
    }
}));
