import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useWorkoutStore } from '../../store/workoutStore';
import { usePerformanceStore } from '../../store/performanceStore';
import { useWorkoutHistoryStore } from '../../store/workoutHistoryStore';
import { useStopwatch } from '../../hooks/useStopwatch';
import { useNativeBack } from '../../hooks/useNativeBack';
import { useWeight } from '../../hooks/useWeight';
import type { ExerciseSessionState, SetEntryData, ActiveRestTimer } from '../../types/session';
import type { SessionRestData, WorkoutSession } from '../../types/history';
import type { HydratedRoutine } from '../../types/workout';

import { SessionHeader } from './SessionHeader';
import { SessionProgressBar } from './SessionProgressBar';
import { ExerciseCard } from './ExerciseCard';
import { RestTimerBar } from './RestTimerBar';
import { ExitConfirmationModal } from './ExitConfirmationModal';
import { SessionCompletedView } from './SessionCompletedView';
import { ExerciseLibrary } from '../exercises/ExerciseLibrary';
import { Plus, X } from 'lucide-react';
import type { ExerciseDefinition, HydratedExercise } from '../../types/workout';

export const ActiveSessionView: React.FC = () => {
    const { activeRoutine, endSession } = useWorkoutStore();
    const { addLog, getLogsByExercise, deleteLogs, logs: allLogs } = usePerformanceStore();
    const { saveSession } = useWorkoutHistoryStore();
    const { displayWeight, toKg, unitLabel } = useWeight();

    // ── Session-level state ──
    const stopwatch = useStopwatch();
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [activeRestTimer, setActiveRestTimer] = useState<ActiveRestTimer | null>(null);

    // ── Session history tracking refs ──
    const startTimeRef = useRef<number>(Date.now());
    const routineSnapshotRef = useRef<HydratedRoutine | null>(null);
    const restDataRef = useRef<SessionRestData[]>([]);
    const sessionLogIds = useRef<string[]>([]);
    const restStartTimeRef = useRef<number | null>(null);

    const [sessionExercises, setSessionExercises] = useState<HydratedExercise[]>([]);
    const [showAddExercise, setShowAddExercise] = useState(false);

    // ── Exercise session state (the core list-based data) ──
    const [exerciseStates, setExerciseStates] = useState<ExerciseSessionState[]>(() => {
        if (!activeRoutine) return [];
        return activeRoutine.exercises.map((exercise, exerciseIndex) => {
            const logs = getLogsByExercise(exercise.exerciseId);
            const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
            const prefillWeight = lastLog ? displayWeight(lastLog.weight) : 0;
            const prefillRir = lastLog?.rir !== undefined ? lastLog.rir : 2;

            return {
                exerciseId: exercise.exerciseId,
                exerciseIndex,
                isExpanded: exerciseIndex === 0, // First exercise starts expanded
                sets: Array.from({ length: exercise.targetSets }, (_, setIndex) => ({
                    setIndex,
                    weight: prefillWeight,
                    reps: exercise.maximumRepetitions,
                    rir: prefillRir,
                    isCompleted: false,
                })),
            };
        });
    });

    // Start stopwatch and capture snapshot on mount
    useEffect(() => {
        stopwatch.start();
        if (activeRoutine && !routineSnapshotRef.current) {
            const snapshot = JSON.parse(JSON.stringify(activeRoutine));
            routineSnapshotRef.current = snapshot;
            setSessionExercises(snapshot.exercises);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Disable body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = showExitConfirmation ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showExitConfirmation]);

    // ── Back handler ──
    useNativeBack(() => {
        if (showAddExercise) {
            setShowAddExercise(false);
            return true;
        }
        if (showExitConfirmation) {
            setShowExitConfirmation(false);
            return true;
        }
        if (activeRoutine) {
            setShowExitConfirmation(true);
            return true;
        }
        return false;
    }, [showExitConfirmation, showAddExercise, activeRoutine], 30);

    // ── Derived totals ──
    const { completedSets, totalSets } = useMemo(() => {
        let completed = 0;
        let total = 0;
        for (const exerciseState of exerciseStates) {
            for (const set of exerciseState.sets) {
                total++;
                if (set.isCompleted) completed++;
            }
        }
        return { completedSets: completed, totalSets: total };
    }, [exerciseStates]);

    // ── Scroll container ref for auto-scroll ──
    const exerciseRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const setExerciseRef = useCallback((exerciseId: string, element: HTMLDivElement | null) => {
        if (element) {
            exerciseRefs.current.set(exerciseId, element);
        } else {
            exerciseRefs.current.delete(exerciseId);
        }
    }, []);

    // ── Handlers ──

    const handleToggleExpand = useCallback((exerciseIndex: number) => {
        setExerciseStates(prev =>
            prev.map((state, i) =>
                i === exerciseIndex
                    ? { ...state, isExpanded: !state.isExpanded }
                    : state
            )
        );
    }, []);

    const handleUpdateSet = useCallback((exerciseIndex: number, setIndex: number, updated: Partial<SetEntryData>) => {
        setExerciseStates(prev =>
            prev.map((state, i) => {
                if (i !== exerciseIndex) return state;
                return {
                    ...state,
                    sets: state.sets.map((set, si) =>
                        si === setIndex ? { ...set, ...updated } : set
                    ),
                };
            })
        );
    }, []);

    const handleCompleteSet = useCallback((exerciseIndex: number, setIndex: number) => {
        setExerciseStates(prev => {
            const newStates = prev.map((state, i) => {
                if (i !== exerciseIndex) return state;
                return {
                    ...state,
                    sets: state.sets.map((set, si) => {
                        if (si !== setIndex) return set;
                        return { ...set, isCompleted: true, completedAt: Date.now() };
                    }),
                };
            });
            return newStates;
        });

        // Log the performance data
        if (sessionExercises.length > 0) {
            const exercise = sessionExercises[exerciseIndex];
            const exerciseState = exerciseStates[exerciseIndex];
            const setData = exerciseState.sets[setIndex];

            const logId = crypto.randomUUID();
            sessionLogIds.current.push(logId);
            addLog(
                exercise.exerciseId,
                toKg(setData.weight),
                setData.reps,
                logId,
                undefined,
                setData.rir,
            );
        }
    }, [sessionExercises, exerciseStates, addLog, toKg]);

    const handleStartRestTimer = useCallback((exerciseId: string, exerciseName: string, restSeconds: number) => {
        const now = Date.now();
        restStartTimeRef.current = now;
        setActiveRestTimer({
            id: now,
            exerciseId,
            exerciseName,
            targetSeconds: restSeconds,
        });
    }, []);

    const handleRestTimerComplete = useCallback(() => {
        if (activeRestTimer && restStartTimeRef.current) {
            const actualRestSeconds = (Date.now() - restStartTimeRef.current) / 1000;
            restDataRef.current.push({
                exerciseId: activeRestTimer.exerciseId,
                targetSeconds: activeRestTimer.targetSeconds,
                actualSeconds: actualRestSeconds,
                timestamp: Date.now(),
            });
            restStartTimeRef.current = null;
        }

        // Auto-expand the exercise the timer was for and scroll to it
        if (activeRestTimer) {
            const targetId = activeRestTimer.exerciseId;
            setExerciseStates(prev =>
                prev.map(state =>
                    state.exerciseId === targetId
                        ? { ...state, isExpanded: true }
                        : state
                )
            );

            // Scroll to the exercise card after a brief delay for the expand animation
            requestAnimationFrame(() => {
                const element = exerciseRefs.current.get(targetId);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        setActiveRestTimer(null);
    }, [activeRestTimer]);

    const handleDismissRestTimer = useCallback(() => {
        if (activeRestTimer && restStartTimeRef.current) {
            const actualRestSeconds = (Date.now() - restStartTimeRef.current) / 1000;
            restDataRef.current.push({
                exerciseId: activeRestTimer.exerciseId,
                targetSeconds: activeRestTimer.targetSeconds,
                actualSeconds: actualRestSeconds,
                timestamp: Date.now(),
            });
            restStartTimeRef.current = null;
        }
        setActiveRestTimer(null);
    }, [activeRestTimer]);

    const handleEndAndSave = useCallback(() => {
        if (routineSnapshotRef.current && activeRoutine) {
            const endTime = Date.now();
            const sessionLogs = allLogs.filter(log => sessionLogIds.current.includes(log.id));

            const workoutSession: WorkoutSession = {
                id: crypto.randomUUID(),
                routineId: activeRoutine.id,
                routineSnapshot: routineSnapshotRef.current,
                startTime: startTimeRef.current,
                endTime,
                durationSeconds: Math.floor((endTime - startTimeRef.current) / 1000),
                logs: sessionLogs,
                restData: restDataRef.current,
            };

            saveSession(workoutSession);
        }
        setShowExitConfirmation(false);
        setShowCompleted(true);
    }, [activeRoutine, allLogs, saveSession]);

    const handleDiscard = useCallback(() => {
        if (sessionLogIds.current.length > 0) {
            deleteLogs(sessionLogIds.current);
        }
        endSession();
    }, [deleteLogs, endSession]);

    const handleReturnToDashboard = useCallback(() => {
        endSession();
    }, [endSession]);

    const handleAddExercise = useCallback((exerciseDef: ExerciseDefinition) => {
        const newExercise: HydratedExercise = {
            ...exerciseDef,
            exerciseId: exerciseDef.id,
            targetSets: 3,
            minimumRepetitions: 8,
            maximumRepetitions: 10,
            restTimeSeconds: 90,
            targetRir: 2,
            notes: '',
        };

        const exerciseIndex = sessionExercises.length;
        const prefillWeight = 0;
        const prefillRir = 2;

        const newState: ExerciseSessionState = {
            exerciseId: newExercise.exerciseId,
            exerciseIndex,
            isExpanded: true,
            sets: Array.from({ length: newExercise.targetSets }, (_, setIndex) => ({
                setIndex,
                weight: prefillWeight,
                reps: newExercise.maximumRepetitions,
                rir: prefillRir,
                isCompleted: false,
            })),
        };

        setSessionExercises(prev => [...prev, newExercise]);
        setExerciseStates(prev => [...prev, newState]);
        if (routineSnapshotRef.current) {
            routineSnapshotRef.current.exercises.push(newExercise);
        }
        setShowAddExercise(false);
        
        // Auto-scroll to newly added exercise after a short delay
        setTimeout(() => {
            const element = exerciseRefs.current.get(newExercise.exerciseId);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }, [sessionExercises.length]);

    // ── Render ──

    if (!activeRoutine) return null;

    if (showCompleted) {
        return (
            <SessionCompletedView
                totalSets={totalSets}
                completedSets={completedSets}
                durationSeconds={Math.floor((Date.now() - startTimeRef.current) / 1000)}
                onReturnToDashboard={handleReturnToDashboard}
            />
        );
    }

    return (
        <div
            className="flex flex-col h-full"
            style={{ background: 'var(--color-surface-base)' }}
        >
            {/* Header */}
            <SessionHeader
                routineName={activeRoutine.name}
                stopwatch={stopwatch}
                onRequestEnd={() => setShowExitConfirmation(true)}
            />

            {/* Progress */}
            <SessionProgressBar
                completedSets={completedSets}
                totalSets={totalSets}
            />

            {/* Exercise List */}
            <div
                className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide"
                style={{ paddingBottom: activeRestTimer ? '88px' : '16px' }}
            >
                <div className="px-3 pt-2 flex flex-col gap-2">
                    {sessionExercises.map((exercise, exerciseIndex) => {
                        const exerciseState = exerciseStates[exerciseIndex];
                        if (!exerciseState) return null;

                        return (
                            <div
                                key={exercise.exerciseId + exerciseIndex}
                                ref={(el) => setExerciseRef(exercise.exerciseId, el)}
                            >
                                <ExerciseCard
                                    exercise={exercise}
                                    sessionState={exerciseState}
                                    unitLabel={unitLabel}
                                    isTimerActiveForExercise={activeRestTimer?.exerciseId === exercise.exerciseId}
                                    onToggleExpand={() => handleToggleExpand(exerciseIndex)}
                                    onUpdateSet={(setIndex, updated) =>
                                        handleUpdateSet(exerciseIndex, setIndex, updated)
                                    }
                                    onCompleteSet={(setIndex) =>
                                        handleCompleteSet(exerciseIndex, setIndex)
                                    }
                                    onStartRestTimer={handleStartRestTimer}
                                />
                            </div>
                        );
                    })}

                    <div className="mt-4 mb-2 flex justify-center">
                        <button
                            onClick={() => setShowAddExercise(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-colors font-bold text-sm"
                        >
                            <Plus size={18} />
                            Add Exercise
                        </button>
                    </div>
                </div>
            </div>

            {/* Rest Timer Bar */}
            {activeRestTimer && (
                <RestTimerBar
                    key={activeRestTimer.id}
                    timer={activeRestTimer}
                    onDismiss={handleDismissRestTimer}
                    onComplete={handleRestTimerComplete}
                />
            )}

            {/* Exit Confirmation Modal */}
            {showExitConfirmation && (
                <ExitConfirmationModal
                    onSaveAndEnd={handleEndAndSave}
                    onDiscard={handleDiscard}
                    onResume={() => setShowExitConfirmation(false)}
                />
            )}

            {/* Add Exercise Modal */}
            {showAddExercise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">Add Exercise</h3>
                            <button
                                onClick={() => setShowAddExercise(false)}
                                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            <ExerciseLibrary
                                isSelectionMode={true}
                                onSelectExercise={handleAddExercise}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
