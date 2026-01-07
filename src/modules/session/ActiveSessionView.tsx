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
import { ArrowLeft, Check, Info, Target, Zap, Plus, Minus, Save, History, AlertTriangle } from 'lucide-react';
import { Toggle } from '../../components/inputs/Toggle';
import { useNativeBack } from '../../hooks/useNativeBack';
import { useWeight } from '../../hooks/useWeight';

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

    // ----- SCROLL / COMPACT STATE -----
    const [isCompact, setIsCompact] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { autoSavePreference, setAutoSavePreference } = useUserStore();
    const { displayWeight, toKg, unitLabel } = useWeight();

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

    // Handle Scroll for Compact Mode
    // We want the timer to shrink when the user scrolls down to see more exercises
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const scrollTop = scrollContainerRef.current.scrollTop;

            // Simpler thresholds since resizing external timer won't affect internal scrollTop
            if (!isCompact && scrollTop > 10) {
                setIsCompact(true);
            } else if (isCompact && scrollTop < 5) {
                setIsCompact(false);
            }
        }
    };

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
                toKg(logWeight), // Convert display weight (lb/kg) to store weight (kg)
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

                setLogWeight(lastLog ? displayWeight(lastLog.weight) : 0); // Pre-fill converted weight
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

    // Format Logic helpers
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* 1. Header (Always visible at top) */}
            <div className="flex-none bg-slate-950/80 backdrop-blur-md border-b border-white/5 transition-all duration-300 z-50">
                <header className="flex items-center gap-4 px-4 py-3">
                    <button
                        onClick={() => setShowExitConfirmation(true)}
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 overflow-hidden">
                        <h1 className="text-lg font-bold text-white leading-tight truncate">
                            {isResting ? "Resting" : currentExercise.name}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isResting ? 'text-blue-400' : 'text-green-400'}`}>
                                {isResting
                                    ? `Next: ${activeRoutine.exercises[currentExerciseIndex + 1]?.name || "Finish"}`
                                    : `Set ${currentExercise.targetSets - setsRemaining + 1} / ${currentExercise.targetSets}`
                                }
                            </span>
                        </div>
                    </div>
                </header>
            </div>

            {/* 
                  Sticky Timer Section - Cross-Fade Transition
            */}
            <div
                className={`
                    relative z-40 bg-slate-950 shadow-2xl border-b border-slate-800/50 overflow-hidden
                    transition-[height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                    will-change-[height]
                    ${isCompact ? 'h-[64px] py-0' : 'h-[360px] py-6'}
                `}
            >
                {/* --- LARGE VIEW (Default) --- */}
                <div
                    className={`
                        absolute inset-0 w-full h-full flex flex-col items-center gap-6 
                        transition-opacity duration-500 ease-in-out py-6
                        ${isCompact ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                    `}
                >
                    {/* Visual Timer */}
                    {!isResting ? (
                        // WORK TIMER
                        <div className="relative transform scale-95 origin-top transition-transform duration-500">
                            <CircularTimer
                                progress={stopwatch.progress}
                                offset={stopwatch.offset}
                                timeLeft={stopwatch.elapsedTime}
                                variant="green"
                                size={230}
                            >
                                <span className="text-5xl font-black font-mono tracking-wider text-white z-10 w-[200px] text-center">
                                    {formatTime(stopwatch.elapsedTime)}
                                </span>
                                <div className="mt-2 flex flex-col items-center gap-1 z-10">
                                    <div className="flex items-center gap-2 font-bold tracking-widest text-[10px] uppercase text-green-400">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Working
                                    </div>
                                </div>
                            </CircularTimer>
                        </div>
                    ) : (
                        // REST TIMER
                        <div className="relative transform scale-95 origin-top transition-transform duration-500">
                            <CircularTimer
                                progress={1 - restTimer.progress}
                                timeLeft={restTimer.timeLeft}
                                size={230}
                                variant="blue"
                            >
                                <span className="text-5xl font-black font-mono tracking-wider text-white z-10 w-[200px] text-center">
                                    {formatTime(restTimer.timeLeft)}
                                </span>
                                <div className="mt-2 flex flex-col items-center gap-1 z-10">
                                    <div className="flex items-center gap-2 font-bold tracking-widest text-[10px] uppercase text-blue-400">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        Resting
                                    </div>
                                </div>
                            </CircularTimer>
                        </div>
                    )}

                    {/* Large Controls */}
                    {!isResting ? (
                        // Work Controls
                        <div className="w-full max-w-xs px-4 grid grid-cols-4 gap-3">
                            <button
                                onClick={skipSet}
                                className="col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-400/80 hover:text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
                            >
                                <span className="text-[10px] uppercase tracking-wider">Skip</span>
                            </button>
                            <button
                                onClick={() => completeSet()}
                                className="col-span-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                            >
                                <Check size={20} strokeWidth={3} />
                                <span className="uppercase tracking-widest font-black text-sm">Complete</span>
                            </button>
                        </div>
                    ) : (
                        // Rest Controls
                        // Rest Controls
                        <div className="w-full max-w-xs px-4 flex gap-3">
                            <button onClick={() => restTimer.adjustTime(-10)} className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-xl active:scale-95 text-slate-400 hover:text-white">
                                <Minus size={16} className="mx-auto" />
                            </button>
                            <button onClick={handleSkipRest} className="flex-[1.5] p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl active:scale-95 text-white hover:text-white flex items-center justify-center gap-2 group">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Skip Rest</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                            </button>
                            <button onClick={() => restTimer.adjustTime(10)} className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-xl active:scale-95 text-slate-400 hover:text-white">
                                <Plus size={16} className="mx-auto" />
                            </button>
                        </div>
                    )}


                </div>

                {/* --- COMPACT VIEW (Sticky) --- */}
                <div
                    className={`
                        absolute inset-0 w-full h-full flex items-center justify-between gap-4 px-4 
                        transition-opacity duration-500 ease-in-out
                        ${isCompact ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                    `}
                >
                    {/* Compact Timer Display */}
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isResting ? 'border-blue-500 text-blue-400' : 'border-green-500 text-green-400'}`}>
                            {isResting ? <Target size={18} /> : <Zap size={18} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black font-mono text-white leading-none">
                                {formatTime(isResting ? restTimer.timeLeft : stopwatch.elapsedTime)}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isResting ? 'text-blue-500' : 'text-green-500'}`}>
                                {isResting ? 'Resting' : 'Working'}
                            </span>
                        </div>
                    </div>

                    {/* Compact Controls */}
                    <div className="flex items-center gap-2">
                        {isResting ? (
                            <>
                                <button onClick={() => restTimer.adjustTime(10)} className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center active:scale-95">
                                    <Plus size={18} />
                                </button>
                                <button onClick={handleSkipRest} className="px-4 h-10 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider flex items-center active:scale-95">
                                    Skip
                                </button>
                            </>
                        ) : (
                            <button onClick={() => completeSet()} className="px-6 h-10 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20">
                                <Check size={16} strokeWidth={3} />
                                Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Main Content (Scrollable List) */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto scroll-smooth"
            >
                {/* Content Section (Scrolls naturally under the sticky elements) */}
                <div className="px-4 pt-2 flex flex-col gap-6 pb-24">

                    {/* Log Set Card (Only in Rest Mode, otherwise hidden/collapsed) */}
                    {isResting && (
                        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    {isSetLogged ? <Check size={14} className="text-green-500" /> : <History size={14} />}
                                    {isSetLogged ? "Set Logged" : "Log Set"}
                                </h3>
                                {isSetLogged ? (
                                    <button onClick={() => setIsSetLogged(false)} className="text-[10px] text-blue-400 hover:text-blue-300 underline">
                                        Edit
                                    </button>
                                ) : (
                                    <Toggle label="Auto Save" checked={autoSavePreference} onChange={setAutoSavePreference} />
                                )}
                            </div>

                            {!isSetLogged ? (
                                <div className="flex justify-center gap-2 sm:gap-4 mb-4">
                                    <WheelPicker label={unitLabel.toUpperCase()} value={logWeight} onChange={setLogWeight} min={0} max={displayWeight(300)} step={unitLabel === 'kg' ? 2.5 : 5} height={120} width="70px" />
                                    <div className="w-px bg-slate-800" />
                                    <WheelPicker label="RIR" value={logRir} onChange={setLogRir} min={0} max={4} step={0.5} height={120} width="70px" />
                                    <div className="w-px bg-slate-800" />
                                    <WheelPicker label="Rep" value={logReps} onChange={setLogReps} min={0} max={99} step={1} height={120} width="70px" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-8 py-4">
                                    <div className="flex flex-col items-center"><span className="text-2xl font-black text-white">{logWeight}</span><span className="text-[10px] text-slate-500 uppercase font-bold">{unitLabel.toUpperCase()}</span></div>
                                    <div className="flex flex-col items-center"><span className="text-2xl font-black text-white">{logRir}</span><span className="text-[10px] text-slate-500 uppercase font-bold">RIR</span></div>
                                    <div className="flex flex-col items-center"><span className="text-2xl font-black text-white">{logReps}</span><span className="text-[10px] text-slate-500 uppercase font-bold">Reps</span></div>
                                </div>
                            )}

                            {!isSetLogged && (
                                <button onClick={handleConfirmLog} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                    <Save size={18} />
                                    <span>Save Log</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Work Target Info (Only in Work Mode) */}
                    {!isResting && (
                        <div className="grid grid-cols-2 gap-4">
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
                    )}


                    {/* Upcoming List Header */}
                    <div className="flex items-center justify-between mt-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Up Next</h3>
                        {currentExercise.notes && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-800 max-w-[60%]">
                                <Info size={12} className="text-blue-400 flex-none" />
                                <span className="text-[9px] text-slate-400 font-medium italic truncate">
                                    {currentExercise.notes}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Exercise List */}
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
                                            ? 'bg-blue-600/10 border-blue-500/30'
                                            : 'bg-slate-900/30 border-slate-800 text-slate-500 grayscale opacity-60'
                                        }
                                    `}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                                                {ex.name}
                                            </span>
                                            {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
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
                                            {ex.equipmentList[0]}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

            </div>

            {/* Exit Confirmation Modal */}
            {showExitConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
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
