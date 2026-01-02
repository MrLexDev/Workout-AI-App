import type { UserData } from '../../types/user';

const STORAGE_KEY = 'user-data-v1';

export class UserStorageService {
    private static instance: UserStorageService;

    private constructor() { }

    public static getInstance(): UserStorageService {
        if (!UserStorageService.instance) {
            UserStorageService.instance = new UserStorageService();
        }
        return UserStorageService.instance;
    }

    public saveUserData(data: UserData): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving user data to localStorage:', error);
        }
    }

    public loadUserData(): UserData {
        const defaultData: UserData = {
            height: null,
            weightHistory: [],
            autoSavePreference: false,
            weightUnit: 'kg',
            gender: null,
            birthDate: null,
            availableEquipment: [],
            objective: null,
            specialConsiderations: null,
            equipmentSelectionMode: 'home_gym'
        };

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return defaultData;

        try {
            const parsed = JSON.parse(stored);
            // Basic validation could be added here similar to WorkoutStorageService
            return {
                height: typeof parsed.height === 'number' ? parsed.height : null,
                weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : [],
                autoSavePreference: typeof parsed.autoSavePreference === 'boolean' ? parsed.autoSavePreference : false,
                weightUnit: parsed.weightUnit === 'lb' ? 'lb' : 'kg',
                gender: ['male', 'female', 'other'].includes(parsed.gender) ? parsed.gender : null,
                birthDate: typeof parsed.birthDate === 'string' ? parsed.birthDate : null,
                availableEquipment: Array.isArray(parsed.availableEquipment) ? parsed.availableEquipment : [],
                objective: typeof parsed.objective === 'string' ? parsed.objective : null,
                specialConsiderations: typeof parsed.specialConsiderations === 'string' ? parsed.specialConsiderations : null,
                equipmentSelectionMode: parsed.equipmentSelectionMode === 'full_gym' ? 'full_gym' : 'home_gym'
            };
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            return defaultData;
        }
    }
}

export const userStorageService = UserStorageService.getInstance();
