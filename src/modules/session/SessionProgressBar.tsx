import React from 'react';

interface SessionProgressBarProps {
    completedSets: number;
    totalSets: number;
}

export const SessionProgressBar: React.FC<SessionProgressBarProps> = ({
    completedSets,
    totalSets,
}) => {
    const percentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    const isComplete = completedSets >= totalSets;

    return (
        <div
            className="flex-none px-4 py-2 flex items-center gap-3"
            style={{ background: 'var(--color-surface-base)' }}
        >
            {/* Progress Track */}
            <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--color-surface-elevated)' }}
            >
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${percentage}%`,
                        background: isComplete
                            ? 'var(--color-success)'
                            : `linear-gradient(90deg, var(--color-accent-primary), #8b5cf6)`,
                    }}
                />
            </div>

            {/* Set Counter */}
            <span
                className="text-xs font-bold tabular-nums whitespace-nowrap"
                style={{
                    color: isComplete
                        ? 'var(--color-success)'
                        : 'var(--color-text-secondary)',
                }}
            >
                {completedSets} / {totalSets}
            </span>
        </div>
    );
};
