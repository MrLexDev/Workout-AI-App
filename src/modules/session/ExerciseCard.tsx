import React from 'react';
import { ChevronDown, Info } from 'lucide-react';
import type { ExerciseSessionState, SetEntryData } from '../../types/session';
import type { HydratedExercise } from '../../types/workout';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
    exercise: HydratedExercise;
    sessionState: ExerciseSessionState;
    unitLabel: string;
    isTimerActiveForExercise: boolean;
    onToggleExpand: () => void;
    onUpdateSet: (setIndex: number, updated: Partial<SetEntryData>) => void;
    onCompleteSet: (setIndex: number) => void;
    onStartRestTimer: (exerciseId: string, exerciseName: string, restSeconds: number) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
    exercise,
    sessionState,
    unitLabel,
    isTimerActiveForExercise,
    onToggleExpand,
    onUpdateSet,
    onCompleteSet,
    onStartRestTimer,
}) => {
    const completedCount = sessionState.sets.filter(s => s.isCompleted).length;
    const totalSets = sessionState.sets.length;
    const allCompleted = completedCount >= totalSets;
    const hasPartialProgress = completedCount > 0 && !allCompleted;
    const repRange = `${exercise.minimumRepetitions}-${exercise.maximumRepetitions}`;

    // Determine card accent
    const getAccentBorderColor = (): string => {
        if (allCompleted) return 'var(--color-success)';
        if (hasPartialProgress) return 'var(--color-accent-primary)';
        return 'transparent';
    };

    return (
        <div
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
                background: allCompleted
                    ? 'var(--color-success-muted)'
                    : 'var(--color-surface-card)',
                border: '1px solid',
                borderColor: allCompleted
                    ? 'var(--color-border-success)'
                    : 'var(--color-border-subtle)',
                borderLeftWidth: '3px',
                borderLeftColor: getAccentBorderColor(),
            }}
        >
            {/* Card Header — always visible, tap to expand/collapse */}
            <button
                onClick={onToggleExpand}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:opacity-80"
            >
                {/* Exercise info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-sm font-bold truncate"
                            style={{
                                color: allCompleted
                                    ? 'var(--color-success)'
                                    : 'var(--color-text-primary)',
                            }}
                        >
                            {exercise.name}
                        </span>
                        {allCompleted && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                    background: 'var(--color-success)',
                                    color: '#fff',
                                }}
                            >
                                Done
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span
                            className="text-[10px] font-mono"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            {totalSets} × {repRange}
                        </span>
                        <span
                            className="w-0.5 h-0.5 rounded-full"
                            style={{ background: 'var(--color-text-disabled)' }}
                        />
                        <span
                            className="text-[10px] font-mono"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            RIR {exercise.targetRir}
                        </span>
                        {exercise.equipmentList[0] && (
                            <>
                                <span
                                    className="w-0.5 h-0.5 rounded-full"
                                    style={{ background: 'var(--color-text-disabled)' }}
                                />
                                <span
                                    className="text-[10px]"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {exercise.equipmentList[0]}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Set progress indicator */}
                <div className="flex items-center gap-2 flex-none">
                    <span
                        className="text-xs font-bold tabular-nums"
                        style={{
                            color: allCompleted
                                ? 'var(--color-success)'
                                : hasPartialProgress
                                    ? 'var(--color-accent-primary)'
                                    : 'var(--color-text-muted)',
                        }}
                    >
                        {completedCount}/{totalSets}
                    </span>

                    <ChevronDown
                        size={16}
                        className="transition-transform duration-300"
                        style={{
                            color: 'var(--color-text-muted)',
                            transform: sessionState.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    />
                </div>
            </button>

            {/* Expanded content — set rows */}
            <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                    maxHeight: sessionState.isExpanded ? `${totalSets * 72 + 80}px` : '0px',
                    opacity: sessionState.isExpanded ? 1 : 0,
                }}
            >
                <div className="px-3 pb-3 flex flex-col gap-1.5">
                    {/* Exercise notes */}
                    {exercise.notes && (
                        <div
                            className="flex items-start gap-2 px-3 py-2 rounded-lg mb-1"
                            style={{ background: 'rgba(59, 130, 246, 0.06)' }}
                        >
                            <Info size={12} className="mt-0.5 flex-none" style={{ color: 'var(--color-info)' }} />
                            <span
                                className="text-[11px] italic leading-relaxed"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {exercise.notes}
                            </span>
                        </div>
                    )}

                    {/* Set rows */}
                    {sessionState.sets.map((setData) => (
                        <SetRow
                            key={setData.setIndex}
                            setData={setData}
                            exerciseTargetRir={exercise.targetRir}
                            repRange={repRange}
                            unitLabel={unitLabel}
                            onUpdateSet={(updated) => onUpdateSet(setData.setIndex, updated)}
                            onCompleteSet={() => onCompleteSet(setData.setIndex)}
                            onStartRestTimer={() =>
                                onStartRestTimer(
                                    exercise.exerciseId,
                                    exercise.name,
                                    exercise.restTimeSeconds,
                                )
                            }
                            isTimerActiveForExercise={isTimerActiveForExercise}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
