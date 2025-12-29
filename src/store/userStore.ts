import { create } from 'zustand';
import type { UserData, WeightEntry } from '../types/user';
import { userStorageService } from '../services/storage/UserStorageService';

interface UserState extends UserData {
    // Actions
    setHeight: (height: number) => void;
    addWeightEntry: (weight: number, date: string) => void;
    deleteWeightEntry: (id: string) => void;
    setAutoSavePreference: (value: boolean) => void;
}

// Initial load
const initialData = userStorageService.loadUserData();

export const useUserStore = create<UserState>((set) => ({
    height: initialData.height,
    weightHistory: initialData.weightHistory,
    autoSavePreference: initialData.autoSavePreference,

    setHeight: (height: number) => {
        set((state) => {
            const newData = { ...state, height };
            // Persist (excluding function properties is handled by JSON.stringify implicitly, 
            // but we need to construct the data object carefully or just save the relevant parts)
            userStorageService.saveUserData({
                height: newData.height,
                weightHistory: newData.weightHistory,
                autoSavePreference: state.autoSavePreference
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
                weightHistory: newData.weightHistory,
                autoSavePreference: state.autoSavePreference
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
                weightHistory: newData.weightHistory,
                autoSavePreference: state.autoSavePreference
            });
            return { weightHistory: newHistory };
        });
    },

    setAutoSavePreference: (value: boolean) => {
        set((state) => {
            const newData = { ...state, autoSavePreference: value };
            userStorageService.saveUserData({
                height: newData.height,
                weightHistory: newData.weightHistory,
                autoSavePreference: newData.autoSavePreference
            });
            return { autoSavePreference: value };
        });
    }
}));
