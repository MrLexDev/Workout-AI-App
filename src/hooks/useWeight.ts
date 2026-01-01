import { useUserStore } from '../store/userStore';
import { useCallback } from 'react';

const KG_TO_LB = 2.20462;

export const useWeight = () => {
    const { weightUnit } = useUserStore();

    const displayWeight = useCallback((kgValue: number) => {
        if (weightUnit === 'kg') return kgValue;
        return Number((kgValue * KG_TO_LB).toFixed(1));
    }, [weightUnit]);

    const toKg = useCallback((displayValue: number) => {
        if (weightUnit === 'kg') return displayValue;
        return Number((displayValue / KG_TO_LB).toFixed(2)); // Store with 2 decimal precision
    }, [weightUnit]);

    return {
        unitLabel: weightUnit === 'kg' ? 'kg' : 'lb',
        displayWeight,
        toKg,
        weightUnit
    };
};
