import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useWorkoutStore } from '../../store/workoutStore';
import { usePerformanceStore } from '../../store/performanceStore';
import { useUserStore } from '../../store/userStore';
import { useWorkoutHistoryStore } from '../../store/workoutHistoryStore';
import type { SessionRestData, WorkoutSession } from '../../types/history';
import type { HydratedRoutine } from '../../types/workout';
import { usePrecisionTimer } from '../../hooks/usePrecisionTimer';
import { useStopwatch } from '../../hooks/useStopwatch';
import { CircularTimer } from '../../components/timer/CircularTimer';
import { WheelPicker } from '../../components/inputs/WheelPicker';
import { RotateCcw, ArrowLeft, Check, Info, Target, Zap, Plus, Minus, Save, History, AlertTriangle } from 'lucide-react';
import { Toggle } from '../../components/inputs/Toggle';
import { useNativeBack } from '../../hooks/useNativeBack';

export const ActiveSessionView: React.FC = () => {
    const {
        activeRoutine,
        endSession,
        sessionState,
        currentExerciseIndex,
        setsRemaining,
        completeSet,
        skipSet,
        startWork
    } = useWorkoutStore();

    const { addLog, getLogsByExercise, deleteLogs, logs: allLogs } = usePerformanceStore();
    const { saveSession } = useWorkoutHistoryStore();

    // Derived active exercise
    const currentExercise = activeRoutine?.exercises[currentExerciseIndex];

    // ----- STOPWATCH (WORK MODE) -----
    const stopwatch = useStopwatch();

    // ----- TIMER (REST MODE) -----
    const [restTarget, setRestTarget] = useState(60);

    // ----- LOGGING STATE -----
    const [logWeight, setLogWeight] = useState(0);
    const [logReps, setLogReps] = useState(0);
    const [logRir, setLogRir] = useState(2); // Default RIR 2
    const [isSetLogged, setIsSetLogged] = useState(false);

    const { autoSavePreference, setAutoSavePreference } = useUserStore();

    // Track previous session state to handle transitions only
    const prevSessionState = useRef<string | null>(null);

    // Track logs created in this session for potential discard
    const sessionLogIds = useRef<string[]>([]);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);

    // ----- SESSION HISTORY TRACKING -----
    const startTimeRef = useRef<number>(Date.now());
    const restDataRef = useRef<SessionRestData[]>([]);
    const routineSnapshotRef = useRef<HydratedRoutine | null>(null);
    const lastSetDurationRef = useRef<number>(0);
    const restStartTimeRef = useRef<number | null>(null);

    // Capture routine snapshot on mount/start
    useEffect(() => {
        if (activeRoutine && !routineSnapshotRef.current) {
            // Create a deep copy of the routine to store as snapshot
            routineSnapshotRef.current = JSON.parse(JSON.stringify(activeRoutine));
        }
    }, [activeRoutine]);

    // Timer logic with rest tracking

    // Refactor to break circular dep:
    // Define handleTimerComplete separate from manual skip.

    // Actually, I can use a Ref to access the current remaining time from the hook if I exported it?
    // Or I just use the state `restTimer.timeLeft` which is available in render scope.
    // CAUTION: `restTimer` variable is result of hook call.

    // Let's define the ON COMPLETE callback first for the hook.
    // When timer completes naturally: actualRest = targetSeconds.

    // Let's define the ON COMPLETE callback first for the hook.
    // When timer completes naturally: actualRest = targetSeconds.

    // Disable scrolling when confirmation modal is open
    useEffect(() => {
        if (showExitConfirmation) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showExitConfirmation]);

    // Back Handler
    useNativeBack(() => {
        if (showExitConfirmation) {
            setShowExitConfirmation(false);
            return true;
        }
        if (activeRoutine) {
            setShowExitConfirmation(true);
            return true;
        }
        return false;
    }, [showExitConfirmation, activeRoutine], 30); // Highest Priority

    const handleConfirmLog = useCallback(() => {
        if (currentExercise) {
            const newLogId = crypto.randomUUID();
            sessionLogIds.current.push(newLogId);
            addLog(
                currentExercise.exerciseId,
                logWeight,
                logReps,
                newLogId,
                lastSetDurationRef.current, // Pass captured duration
                logRir
            );
            setIsSetLogged(true);
        }
    }, [currentExercise, logWeight, logReps, addLog, logRir]);

    // Timer logic with rest tracking
    const onTimerComplete = useCallback(() => {
        if (autoSavePreference && !isSetLogged) {
            handleConfirmLog();
        }
        // Rest tracking is handled in useEffect now
        startWork();
    }, [autoSavePreference, isSetLogged, startWork, handleConfirmLog]);

    const restTimer = usePrecisionTimer(restTarget, onTimerComplete);

    // Now handle MANUAL SKIP
    const handleSkipRest = () => {
        if (autoSavePreference && !isSetLogged) {
            handleConfirmLog();
        }
        // Rest tracking is handled in useEffect now
        startWork();
    };

    // Effect: Sync rest target ahead of time to prevent race condition in usePrecisionTimer
    useEffect(() => {
        if (currentExercise) {
            setRestTarget(currentExercise.restTimeSeconds);
        }
    }, [currentExercise?.exerciseId, currentExercise?.restTimeSeconds]);

    // Helper to package and save the session
    const handleEndAndSave = () => {
        if (routineSnapshotRef.current && activeRoutine) {
            const endTime = Date.now();
            // Filter logs to only include those created in this session
            const sessionLogs = allLogs.filter(log => sessionLogIds.current.includes(log.id));

            const workoutSession: WorkoutSession = {
                id: crypto.randomUUID(),
                routineId: activeRoutine.id,
                routineSnapshot: routineSnapshotRef.current,
                startTime: startTimeRef.current,
                endTime: endTime,
                durationSeconds: Math.floor((endTime - startTimeRef.current) / 1000),
                logs: sessionLogs,
                restData: restDataRef.current
            };

            saveSession(workoutSession);
        }
        endSession();
    };

    // Effect: Sync state changes & Pre-fill logs
    useEffect(() => {
        if (!currentExercise) return;

        // Only execute transition logic if sessionState has changed
        if (prevSessionState.current !== sessionState) {
            if (sessionState === 'WORK') {
                // Leaving REST -> WORK (or Idle -> Work)
                if (prevSessionState.current === 'REST') {
                    // Calculate ACTUAL REST time based on timestamps
                    if (restStartTimeRef.current) {
                        const actualRestSeconds = (Date.now() - restStartTimeRef.current) / 1000;
                        restDataRef.current.push({
                            exerciseId: currentExercise.exerciseId,
                            targetSeconds: restTarget,
                            actualSeconds: actualRestSeconds,
                            timestamp: Date.now()
                        });
                        restStartTimeRef.current = null;
                    }
                }

                stopwatch.start();
                restTimer.reset();
            } else if (sessionState === 'REST') {
                // Leaving WORK -> REST
                // Capture work duration
                lastSetDurationRef.current = stopwatch.elapsedTime;

                // Start Rest Tracking
                restStartTimeRef.current = Date.now();

                // Use restTimeSeconds from v1.1.0 schema
                setRestTarget(currentExercise.restTimeSeconds);
                stopwatch.reset();
                restTimer.start();

                // Pre-fill logs from history
                const logs = getLogsByExercise(currentExercise.exerciseId);
                const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

                setLogWeight(lastLog ? lastLog.weight : 0);
                setLogReps(currentExercise.maximumRepetitions); // Default to max reps target
                setLogRir(lastLog && lastLog.rir !== undefined ? lastLog.rir : 2); // Pre-fill RIR or default to 2
                setIsSetLogged(false);

            } else if (sessionState === 'IDLE' || sessionState === 'COMPLETED') {
                stopwatch.reset();
                restTimer.reset();
            }

            prevSessionState.current = sessionState;
        }
    }, [sessionState, currentExercise, stopwatch, restTimer, getLogsByExercise, restTarget]);



    const handleDiscardSession = () => {
        if (sessionLogIds.current.length > 0) {
            deleteLogs(sessionLogIds.current);
        }
        endSession();
    };

    if (!activeRoutine || !currentExercise || sessionState === 'COMPLETED') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-950">
                <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 text-center animate-in fade-in zoom-in duration-300">
                    <Check size={48} className="mx-auto mb-4 text-green-500" />
                    <h2 className="text-xl font-bold text-white mb-2">Workout Finished!</h2>
                    <p className="text-sm text-slate-400 mb-6">Great session! Your progress has been saved.</p>
                    <button
                        onClick={handleEndAndSave}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isResting = sessionState === 'REST';

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Header (Fixed) */}
            <header className="flex-none flex items-center gap-4 mb-4 px-4 pt-4">
                <button
                    onClick={() => setShowExitConfirmation(true)}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="overflow-hidden flex-1">
                    <h1 className="text-xl font-bold text-white leading-tight truncate">
                        {setsRemaining === 0 ? "Resting" : currentExercise.name}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                            {setsRemaining === 0
                                ? "Next: " + (activeRoutine.exercises[currentExerciseIndex + 1]?.name || "Finish")
                                : `Set ${currentExercise.targetSets - setsRemaining + 1} of ${currentExercise.targetSets}`
                            }
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[10px] text-slate-500 font-mono">
                            {activeRoutine.name}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Center Display */}
            <section className="flex-none flex flex-col items-center justify-start py-6 relative">

                {/* WORK MODE Visualizer */}
                {!isResting && (
                    <div className="flex flex-col items-center gap-8">
                        {/* Timer */}
                        <CircularTimer
                            progress={stopwatch.progress}
                            offset={stopwatch.offset}
                            timeLeft={stopwatch.elapsedTime}
                            variant="green"
                            size={280}
                        >
                            {/* Inner Content Matching Work Timer Style */}
                            <span className="text-6xl font-black font-mono tracking-wider text-white z-10 transition-transform group-hover:scale-110 duration-500">
                                {Math.floor(stopwatch.elapsedTime / 60)}:{String(stopwatch.elapsedTime % 60).padStart(2, '0')}
                            </span>

                            <div className="mt-4 flex flex-col items-center gap-1 z-10">
                                <div className={`flex items-center gap-2 font-bold tracking-widest text-[10px] uppercase ${stopwatch.isRunning ? 'text-green-400' : 'text-slate-500'}`}>
                                    {stopwatch.isRunning && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                                    {stopwatch.isRunning ? 'Working' : 'Paused'}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                    {currentExercise.equipment}
                                </div>
                            </div>
                        </CircularTimer>

                        {/* Target Info Overlay */}
                        <div className="grid grid-cols-2 gap-4 w-full max-w-xs px-4">
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5 text-slate-500 uppercase font-bold text-[9px] tracking-widest">
                                    <Target size={12} className="text-blue-400" />
                                    RIR Target
                                </div>
                                <span className="text-xl font-black text-yellow-500">{currentExercise.targetRir}</span>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5 text-slate-500 uppercase font-bold text-[9px] tracking-widest">
                                    <Zap size={12} className="text-blue-400" />
                                    Rep Range
                                </div>
                                <span className="text-xl font-black text-white">{currentExercise.minimumRepetitions}-{currentExercise.maximumRepetitions}</span>
                            </div>
                        </div>

                        {/* WORK Controls */}
                        <div className="w-full max-w-xs px-4">
                            <div className="grid grid-cols-4 gap-3">
                                <button
                                    onClick={skipSet}
                                    className="col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] border border-slate-700"
                                >
                                    <span className="text-[10px] uppercase tracking-wider">Skip</span>
                                </button>

                                <button
                                    onClick={() => completeSet()}
                                    className="col-span-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                                >
                                    <Check size={24} strokeWidth={3} />
                                    <span className="uppercase tracking-widest font-black">Complete Set</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* REST MODE UI */}
                {isResting && (
                    <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Large Timer (Same size as Work) */}
                        <div className="relative">
                            <CircularTimer
                                progress={1 - restTimer.progress}
                                timeLeft={restTimer.timeLeft}
                                size={280}
                            >
                                {/* Inner Content Matching Work Timer */}
                                <span className="text-6xl font-black font-mono tracking-wider text-white z-10">
                                    {Math.floor(restTimer.timeLeft / 60)}:{String(restTimer.timeLeft % 60).padStart(2, '0')}
                                </span>

                                <div className="mt-4 flex flex-col items-center gap-1 z-10">
                                    <div className="flex items-center gap-2 font-bold tracking-widest text-[10px] uppercase text-blue-400">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        Resting
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter truncate max-w-[180px]">
                                        Next: {activeRoutine.exercises[currentExerciseIndex + 1]?.name || "Finish"}
                                    </div>
                                </div>
                            </CircularTimer>

                            {/* "Resting" label below removed as it's now inside */}
                        </div>

                        {/* REST Controls (ABOVE Logger) */}
                        <div className="w-full max-w-xs px-4 flex flex-col gap-4">
                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => restTimer.adjustTime(-10)}
                                    className="flex-1 p-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors flex flex-col items-center gap-1 active:scale-95"
                                >
                                    <Minus size={16} />
                                    <span className="text-[10px] font-bold">-10s</span>
                                </button>
                                <button
                                    onClick={() => {
                                        restTimer.reset();
                                        restTimer.start();
                                    }}
                                    className="p-3 text-slate-500 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors active:scale-95"
                                >
                                    <RotateCcw size={18} />
                                </button>
                                <button
                                    onClick={() => restTimer.adjustTime(10)}
                                    className="flex-1 p-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors flex flex-col items-center gap-1 active:scale-95"
                                >
                                    <Plus size={16} />
                                    <span className="text-[10px] font-bold">+10s</span>
                                </button>
                            </div>

                            <button
                                onClick={handleSkipRest}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-slate-700"
                            >
                                <span className="uppercase tracking-wider text-sm">Skip Rest & Start Set</span>
                            </button>
                        </div>



                        {/* Logging Interface - Integrated (BELOW Controls) */}
                        <div className="w-full max-w-lg px-4">
                            <div className={`bg-slate-900/50 border ${isSetLogged ? 'border-green-500/30' : 'border-slate-800'} rounded-2xl p-4 transition-colors`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        {isSetLogged ? <Check size={14} className="text-green-500" /> : <History size={14} />}
                                        {isSetLogged ? "Set Logged" : "Log Set"}
                                    </h3>
                                    {isSetLogged ? (
                                        <button
                                            onClick={() => setIsSetLogged(false)}
                                            className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                                        >
                                            Edit
                                        </button>
                                    ) : (
                                        <Toggle
                                            label="Auto Save"
                                            checked={autoSavePreference}
                                            onChange={setAutoSavePreference}
                                        />
                                    )}
                                </div>

                                {!isSetLogged && (
                                    <div className="flex justify-center gap-2 sm:gap-4 mb-4">
                                        <WheelPicker
                                            label="KG"
                                            value={logWeight}
                                            onChange={setLogWeight}
                                            min={0}
                                            max={300}
                                            step={2.5}
                                            height={140}
                                            width="80px"
                                        />
                                        <div className="w-px bg-slate-800" />
                                        <WheelPicker
                                            label="RIR"
                                            value={logRir}
                                            onChange={setLogRir}
                                            min={0}
                                            max={4}
                                            step={0.5}
                                            height={140}
                                            width="80px"
                                        />
                                        <div className="w-px bg-slate-800" />
                                        <WheelPicker
                                            label="Rep"
                                            value={logReps}
                                            onChange={setLogReps}
                                            min={0}
                                            max={99}
                                            step={1}
                                            height={140}
                                            width="80px"
                                        />
                                    </div>
                                )}

                                {isSetLogged ? (
                                    <div className="flex items-center justify-center gap-8 py-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl font-black text-white">{logWeight}</span>
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">KG</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl font-black text-white">{logRir}</span>
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">RIR</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl font-black text-white">{logReps}</span>
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">Reps</span>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConfirmLog}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                        <Save size={18} />
                                        <span>Save Log</span>
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                )}

            </section>

            {/* Upcoming Exercises List */}
            <section className="flex-1 overflow-y-auto min-h-0 bg-slate-950 border-t border-slate-800 shadow-2xl relative">
                {/* Gradient fade at top */}
                <div className="sticky top-0 h-8 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />

                <div className="px-6 pb-6">
                    <div className="flex items-center justify-between mb-4 sticky top-4 z-20 bg-slate-950 py-2">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Up Next
                        </h3>
                        {currentExercise.notes && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-800">
                                <Info size={12} className="text-blue-400" />
                                <span className="text-[9px] text-slate-400 font-medium italic truncate max-w-[150px]">
                                    {currentExercise.notes}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        {activeRoutine.exercises.map((ex, idx) => {
                            const isCurrent = idx === currentExerciseIndex;
                            if (idx < currentExerciseIndex) return null;

                            return (
                                <div
                                    key={ex.exerciseId + idx}
                                    className={`
                                        flex justify-between items-center p-4 rounded-2xl border transition-all duration-300
                                        ${isCurrent
                                            ? 'bg-blue-600/10 border-blue-500/30 scale-[1.02]'
                                            : 'bg-slate-900/30 border-slate-800 text-slate-500 grayscale opacity-60'
                                        }
                                    `}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                                                {ex.name}
                                            </span>
                                            {isCurrent && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-mono opacity-60">
                                                {ex.targetSets} × {ex.minimumRepetitions}-{ex.maximumRepetitions}
                                            </span>
                                            <div className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                                            <span className="text-[9px] font-mono opacity-60">
                                                RIR {ex.targetRir}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className={`text-[10px] font-black ${isCurrent ? 'text-blue-400' : 'text-slate-600'}`}>
                                            {isCurrent ? `SET ${currentExercise.targetSets - setsRemaining + 1}` : 'QUEUED'}
                                        </span>
                                        <span className="text-[9px] opacity-40 uppercase tracking-tighter">
                                            {ex.equipment.split(',')[0]}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="h-12" />
                    </div>
                </div>
            </section>

            {/* Exit Confirmation Modal */}
            {showExitConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-2">
                                <AlertTriangle size={24} />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-white">End Workout?</h3>
                                <p className="text-sm text-slate-400">
                                    Are you sure you want to end this workout?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 w-full mt-4">
                                <button
                                    onClick={handleEndAndSave}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all"
                                >
                                    End & Save
                                </button>

                                <button
                                    onClick={handleDiscardSession}
                                    className="w-full bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 font-bold py-3 px-4 rounded-xl transition-all"
                                >
                                    Discard Workout
                                </button>

                                <button
                                    onClick={() => setShowExitConfirmation(false)}
                                    className="w-full text-slate-500 hover:text-white font-medium py-2 text-sm transition-colors mt-2"
                                >
                                    Resume
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
