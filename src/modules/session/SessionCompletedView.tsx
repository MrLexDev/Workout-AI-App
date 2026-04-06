import React from 'react';
import { Check, Trophy } from 'lucide-react';

interface SessionCompletedViewProps {
    totalSets: number;
    completedSets: number;
    durationSeconds: number;
    onReturnToDashboard: () => void;
}

const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m ${secs}s`;
};

export const SessionCompletedView: React.FC<SessionCompletedViewProps> = ({
    totalSets,
    completedSets,
    durationSeconds,
    onReturnToDashboard,
}) => {
    const allCompleted = completedSets >= totalSets;

    return (
        <div
            className="flex flex-col items-center justify-center h-full px-6"
            style={{ background: 'var(--color-surface-base)' }}
        >
            <div
                className="w-full max-w-sm p-8 rounded-2xl text-center animate-fade-in-scale"
                style={{
                    background: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border-subtle)',
                }}
            >
                {/* Icon */}
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{
                        background: allCompleted ? 'var(--color-success-muted)' : 'rgba(59, 130, 246, 0.12)',
                        color: allCompleted ? 'var(--color-success)' : 'var(--color-accent-primary)',
                    }}
                >
                    {allCompleted ? <Trophy size={32} /> : <Check size={32} />}
                </div>

                <h2
                    className="text-2xl font-black text-tight mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    {allCompleted ? 'Workout Complete!' : 'Session Ended'}
                </h2>
                <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                    {allCompleted
                        ? 'You crushed every set. Great work!'
                        : 'Your progress has been saved.'}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-center gap-8 mb-8">
                    <div className="flex flex-col items-center">
                        <span
                            className="text-2xl font-black"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {completedSets}/{totalSets}
                        </span>
                        <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Sets
                        </span>
                    </div>
                    <div
                        className="w-px h-8"
                        style={{ background: 'var(--color-border-subtle)' }}
                    />
                    <div className="flex flex-col items-center">
                        <span
                            className="text-2xl font-black"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {formatDuration(durationSeconds)}
                        </span>
                        <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Duration
                        </span>
                    </div>
                </div>

                <button
                    onClick={onReturnToDashboard}
                    className="w-full font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
                    style={{
                        background: 'var(--color-accent-primary)',
                        color: '#fff',
                    }}
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
};
