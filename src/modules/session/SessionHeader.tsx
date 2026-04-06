import React from 'react';
import { ArrowLeft, Square } from 'lucide-react';
import { useStopwatch } from '../../hooks/useStopwatch';

interface SessionHeaderProps {
    routineName: string;
    stopwatch: ReturnType<typeof useStopwatch>;
    onRequestEnd: () => void;
}

const formatElapsed = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export const SessionHeader: React.FC<SessionHeaderProps> = ({
    routineName,
    stopwatch,
    onRequestEnd,
}) => {
    return (
        <header
            className="flex-none flex items-center gap-3 px-4 py-3 border-b"
            style={{
                background: 'var(--color-surface-card)',
                borderColor: 'var(--color-border-subtle)',
            }}
        >
            {/* Back / End button */}
            <button
                onClick={onRequestEnd}
                className="p-2 rounded-xl transition-all active:scale-95"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="End workout"
            >
                <ArrowLeft size={20} />
            </button>

            {/* Routine Name */}
            <div className="flex-1 min-w-0">
                <h1
                    className="text-base font-bold truncate text-tight"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    {routineName}
                </h1>
            </div>

            {/* Session Elapsed Time */}
            <div className="flex items-center gap-2">
                <span
                    className="text-sm font-mono font-semibold tabular-nums"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    {formatElapsed(stopwatch.elapsedTime)}
                </span>

                <button
                    onClick={onRequestEnd}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                    style={{
                        background: 'var(--color-danger-muted)',
                        color: 'var(--color-danger)',
                    }}
                >
                    <Square size={12} fill="currentColor" />
                    End
                </button>
            </div>
        </header>
    );
};
