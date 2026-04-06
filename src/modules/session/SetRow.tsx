import React, { useState, useEffect } from 'react';
import { Check, Timer } from 'lucide-react';
import type { SetEntryData } from '../../types/session';

interface SetRowProps {
    setData: SetEntryData;
    exerciseTargetRir: number;
    repRange: string;
    unitLabel: string;
    onUpdateSet: (updated: Partial<SetEntryData>) => void;
    onCompleteSet: () => void;
    onStartRestTimer: () => void;
    isTimerActiveForExercise: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({
    setData,
    exerciseTargetRir,
    repRange,
    unitLabel,
    onUpdateSet,
    onCompleteSet,
    onStartRestTimer,
    isTimerActiveForExercise,
}) => {
    const [justCompleted, setJustCompleted] = useState(false);

    // Brief green pulse animation on completion
    useEffect(() => {
        if (justCompleted) {
            const timeout = setTimeout(() => setJustCompleted(false), 600);
            return () => clearTimeout(timeout);
        }
    }, [justCompleted]);

    const handleComplete = () => {
        onCompleteSet();
        setJustCompleted(true);
    };

    const handleRirAdjust = (delta: number) => {
        const newRir = Math.max(0, Math.min(5, setData.rir + delta));
        onUpdateSet({ rir: newRir });
    };

    if (setData.isCompleted) {
        return (
            <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${justCompleted ? 'animate-pulse-green' : ''}`}
                style={{
                    background: 'var(--color-success-muted)',
                    border: '1px solid var(--color-border-success)',
                }}
            >
                {/* Set badge */}
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-none"
                    style={{ background: 'var(--color-success)', color: '#fff' }}
                >
                    {setData.setIndex + 1}
                </div>

                {/* Logged values */}
                <div className="flex-1 flex items-center gap-4 text-sm">
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {setData.weight} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{unitLabel}</span>
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {setData.reps} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>reps</span>
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        RIR {setData.rir}
                    </span>
                </div>

                {/* Completed indicator */}
                <Check size={16} style={{ color: 'var(--color-success)' }} />
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
            style={{
                background: 'var(--color-surface-card)',
                border: '1px solid var(--color-border-subtle)',
            }}
        >
            {/* Set number badge */}
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-none"
                style={{
                    background: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-secondary)',
                }}
            >
                {setData.setIndex + 1}
            </div>

            {/* Weight input */}
            <div className="flex flex-col items-center min-w-[56px]">
                <input
                    type="number"
                    inputMode="decimal"
                    value={setData.weight || ''}
                    onChange={(e) => onUpdateSet({ weight: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-14 h-8 text-center text-sm font-bold rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    style={{
                        background: 'var(--color-surface-input)',
                        color: 'var(--color-text-primary)',
                    }}
                />
                <span className="text-[9px] font-bold uppercase mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {unitLabel}
                </span>
            </div>

            {/* Reps input */}
            <div className="flex flex-col items-center min-w-[48px]">
                <input
                    type="number"
                    inputMode="numeric"
                    value={setData.reps || ''}
                    onChange={(e) => onUpdateSet({ reps: Number(e.target.value) || 0 })}
                    placeholder={repRange}
                    className="w-12 h-8 text-center text-sm font-bold rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    style={{
                        background: 'var(--color-surface-input)',
                        color: 'var(--color-text-primary)',
                    }}
                />
                <span className="text-[9px] font-bold uppercase mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Reps
                </span>
            </div>

            {/* RIR stepper */}
            <div className="flex flex-col items-center min-w-[64px]">
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => handleRirAdjust(-1)}
                        disabled={setData.rir <= 0}
                        className="w-6 h-8 rounded-l-lg text-xs font-bold flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                        style={{
                            background: 'var(--color-surface-input)',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        −
                    </button>
                    <div
                        className="w-7 h-8 flex items-center justify-center text-sm font-bold"
                        style={{
                            background: 'var(--color-surface-input)',
                            color: setData.rir <= exerciseTargetRir
                                ? 'var(--color-warning)'
                                : 'var(--color-text-primary)',
                        }}
                    >
                        {setData.rir}
                    </div>
                    <button
                        onClick={() => handleRirAdjust(1)}
                        disabled={setData.rir >= 5}
                        className="w-6 h-8 rounded-r-lg text-xs font-bold flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                        style={{
                            background: 'var(--color-surface-input)',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        +
                    </button>
                </div>
                <span className="text-[9px] font-bold uppercase mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    RIR
                </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 ml-auto flex-none">
                {/* Rest timer trigger */}
                <button
                    onClick={onStartRestTimer}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
                    style={{
                        background: isTimerActiveForExercise
                            ? 'var(--color-border-active)'
                            : 'var(--color-surface-elevated)',
                        color: isTimerActiveForExercise
                            ? 'var(--color-accent-primary)'
                            : 'var(--color-text-muted)',
                    }}
                    title="Start rest timer"
                >
                    <Timer size={14} />
                </button>

                {/* Complete set */}
                <button
                    onClick={handleComplete}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
                    style={{
                        background: 'var(--color-accent-primary)',
                        color: '#fff',
                    }}
                    title="Complete set"
                >
                    <Check size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};
