import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import type { ActiveRestTimer } from '../../types/session';
import { usePrecisionTimer } from '../../hooks/usePrecisionTimer';

interface RestTimerBarProps {
    timer: ActiveRestTimer;
    onDismiss: () => void;
    onComplete: () => void;
}

const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

export const RestTimerBar: React.FC<RestTimerBarProps> = ({
    timer,
    onDismiss,
    onComplete,
}) => {
    const precisionTimer = usePrecisionTimer(timer.targetSeconds, onComplete);

    // Auto-start when mounted
    React.useEffect(() => {
        precisionTimer.start();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const progressPercent = precisionTimer.progress * 100;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        >
            <div
                className="w-full max-w-md pointer-events-auto animate-slide-up"
                style={{
                    background: 'var(--color-surface-elevated)',
                    borderTop: '1px solid var(--color-border-active)',
                }}
            >
                {/* Progress bar track */}
                <div className="h-0.5 w-full" style={{ background: 'var(--color-surface-base)' }}>
                    <div
                        className="h-full transition-all duration-100 ease-linear"
                        style={{
                            width: `${progressPercent}%`,
                            background: 'linear-gradient(90deg, var(--color-accent-primary), #8b5cf6)',
                        }}
                    />
                </div>

                {/* Content */}
                <div className="flex items-center gap-3 px-4 py-3">
                    {/* Exercise label */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                            Rest Timer
                        </p>
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {timer.exerciseName}
                        </p>
                    </div>

                    {/* Timer controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => precisionTimer.adjustTime(-10)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
                            style={{
                                background: 'var(--color-surface-card)',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            <Minus size={14} />
                        </button>

                        <span
                            className="text-xl font-black font-mono tabular-nums min-w-[60px] text-center"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {formatTime(precisionTimer.timeLeft)}
                        </span>

                        <button
                            onClick={() => precisionTimer.adjustTime(10)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
                            style={{
                                background: 'var(--color-surface-card)',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={onDismiss}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
                        style={{
                            background: 'var(--color-surface-card)',
                            color: 'var(--color-text-muted)',
                        }}
                        title="Skip rest"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
