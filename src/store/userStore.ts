import { create } from 'zustand';
import type { UserData, WeightEntry, WeightUnit } from '../types/user';
import { userStorageService } from '../services/storage/UserStorageService';

interface UserState extends UserData {
    // Actions
    setHeight: (height: number) => void;
    addWeightEntry: (weight: number, date: string) => void;
    deleteWeightEntry: (id: string) => void;
    setAutoSavePreference: (value: boolean) => void;
    setWeightUnit: (unit: WeightUnit) => void;
    setGender: (gender: 'male' | 'female' | 'other' | null) => void;
    setBirthDate: (date: string | null) => void;
    setAvailableEquipment: (equipment: string[]) => void;
    setObjective: (objective: string | null) => void;
    setSpecialConsiderations: (considerations: string | null) => void;
    setEquipmentSelectionMode: (mode: 'full_gym' | 'home_gym') => void;
}

// Initial load
const initialData = userStorageService.loadUserData();

export const useUserStore = create<UserState>((set) => ({
    height: initialData.height,
    weightHistory: initialData.weightHistory,
    autoSavePreference: initialData.autoSavePreference,
    weightUnit: initialData.weightUnit || 'kg',
    gender: initialData.gender,
    birthDate: initialData.birthDate,
    availableEquipment: initialData.availableEquipment,
    objective: initialData.objective,
    specialConsiderations: initialData.specialConsiderations,
    equipmentSelectionMode: initialData.equipmentSelectionMode,

    setHeight: (height: number) => {
        set((state) => {
            const newData = { ...state, height };
            // Persist (excluding function properties is handled by JSON.stringify implicitly, 
            // but we need to construct the data object carefully or just save the relevant parts)
            userStorageService.saveUserData({
                height: newData.height,
                weightHistory: newData.weightHistory,
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
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
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
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
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
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
                autoSavePreference: newData.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
            });
            return { autoSavePreference: value };
        });
    },

    setWeightUnit: (unit: WeightUnit) => {
        set((state) => {
            const newData = { ...state, weightUnit: unit };
            userStorageService.saveUserData({
                height: newData.height,
                weightHistory: newData.weightHistory,
                autoSavePreference: state.autoSavePreference,
                weightUnit: newData.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
            });
            return { weightUnit: unit };
        });
    },

    setGender: (gender) => {
        set((state) => {
            const newData = { ...state, gender };
            userStorageService.saveUserData({
                height: state.height,
                weightHistory: state.weightHistory,
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: newData.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
            });
            return { gender };
        });
    },

    setBirthDate: (birthDate) => {
        set((state) => {
            const newData = { ...state, birthDate };
            userStorageService.saveUserData({
                height: state.height,
                weightHistory: state.weightHistory,
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: newData.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
            });
            return { birthDate };
        });
    },

    setAvailableEquipment: (equipment) => {
        set((state) => {
            const newData = { ...state, availableEquipment: equipment };
            userStorageService.saveUserData({
                height: state.height,
                weightHistory: state.weightHistory,
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: newData.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
            });
            return { availableEquipment: equipment };
        });
    },

    setObjective: (objective) => {
        set((state) => {
            const newData = { ...state, objective };
            userStorageService.saveUserData({
                height: state.height,
                weightHistory: state.weightHistory,
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: newData.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
            });
            return { objective };
        });
    },

    setSpecialConsiderations: (specialConsiderations) => {
        set((state) => {
            const newData = { ...state, specialConsiderations };
            userStorageService.saveUserData({
                height: state.height,
                weightHistory: state.weightHistory,
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: newData.specialConsiderations,
                equipmentSelectionMode: state.equipmentSelectionMode
            });
            return { specialConsiderations };
        });
    },

    setEquipmentSelectionMode: (mode) => {
        set((state) => {
            const newData = { ...state, equipmentSelectionMode: mode };
            userStorageService.saveUserData({
                height: state.height,
                weightHistory: state.weightHistory,
                autoSavePreference: state.autoSavePreference,
                weightUnit: state.weightUnit,
                gender: state.gender,
                birthDate: state.birthDate,
                availableEquipment: state.availableEquipment,
                objective: state.objective,
                specialConsiderations: state.specialConsiderations,
                equipmentSelectionMode: newData.equipmentSelectionMode
            });
            return { equipmentSelectionMode: mode };
        });
    }
}));
