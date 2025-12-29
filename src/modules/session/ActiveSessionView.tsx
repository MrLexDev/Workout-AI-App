import React, { useEffect, useState, useRef } from 'react';
import { useWorkoutStore } from '../../store/workoutStore';
import { usePerformanceStore } from '../../store/performanceStore';
import { usePrecisionTimer } from '../../hooks/usePrecisionTimer';
import { useStopwatch } from '../../hooks/useStopwatch';
import { CircularTimer } from '../../components/timer/CircularTimer';
import { WheelPicker } from '../../components/inputs/WheelPicker';
import { RotateCcw, ArrowLeft, Check, Info, Target, Zap, Plus, Minus, Save, History } from 'lucide-react';

export const ActiveSessionView: React.FC = () => {
    const {
        activeRoutine,
        endSession,
        sessionState,
        currentExerciseIndex,
        setsRemaining,
        completeSet,
        startWork
    } = useWorkoutStore();

    const { addLog, getLogsByExercise } = usePerformanceStore();

    // Derived active exercise
    const currentExercise = activeRoutine?.exercises[currentExerciseIndex];

    // ----- STOPWATCH (WORK MODE) -----
    const stopwatch = useStopwatch();

    // ----- TIMER (REST MODE) -----
    const [restTarget, setRestTarget] = useState(60);

    // ----- LOGGING STATE -----
    const [logWeight, setLogWeight] = useState(0);
    const [logReps, setLogReps] = useState(0);
    const [isSetLogged, setIsSetLogged] = useState(false);

    // Track previous session state to handle transitions only
    const prevSessionState = useRef<string | null>(null);

    const restTimer = usePrecisionTimer(restTarget, () => {
        // Auto-switch to WORK when timer ends
        startWork();
    });

    // Effect: Sync state changes & Pre-fill logs
    useEffect(() => {
        if (!currentExercise) return;

        // Only execute transition logic if sessionState has changed
        if (prevSessionState.current !== sessionState) {
            if (sessionState === 'WORK') {
                stopwatch.start();
                restTimer.reset();
            } else if (sessionState === 'REST') {
                // Use restTimeSeconds from v1.1.0 schema
                setRestTarget(currentExercise.restTimeSeconds);
                stopwatch.reset();
                restTimer.start();

                // Pre-fill logs from history
                const logs = getLogsByExercise(currentExercise.exerciseId);
                const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

                setLogWeight(lastLog ? lastLog.weight : 0);
                setLogReps(currentExercise.maximumRepetitions); // Default to max reps target
                setIsSetLogged(false);

            } else if (sessionState === 'IDLE' || sessionState === 'COMPLETED') {
                stopwatch.reset();
                restTimer.reset();
            }

            prevSessionState.current = sessionState;
        }
    }, [sessionState, currentExercise, stopwatch, restTimer, getLogsByExercise]);

    const handleConfirmLog = () => {
        if (currentExercise) {
            addLog(currentExercise.exerciseId, logWeight, logReps);
            setIsSetLogged(true);
        }
    };

    if (!activeRoutine || !currentExercise || sessionState === 'COMPLETED') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-950">
                <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 text-center animate-in fade-in zoom-in duration-300">
                    <Check size={48} className="mx-auto mb-4 text-green-500" />
                    <h2 className="text-xl font-bold text-white mb-2">Workout Finished!</h2>
                    <p className="text-sm text-slate-400 mb-6">Great session! Your progress has been saved.</p>
                    <button
                        onClick={endSession}
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
                    onClick={endSession}
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
                        <div className="flex flex-col items-center justify-center h-[280px] w-[280px] rounded-full bg-slate-800/20 border-8 border-slate-800 animate-in fade-in zoom-in duration-300 relative overflow-hidden group">
                            {/* Pulse effect in background */}
                            {stopwatch.isRunning && <div className="absolute inset-0 bg-green-500/5 animate-pulse" />}

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
                        </div>

                        {/* Target Info Overlay */}
                        <div className="grid grid-cols-2 gap-4 w-full max-w-xs px-4">
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5 text-slate-500 uppercase font-bold text-[9px] tracking-widest">
                                    <Target size={12} className="text-blue-400" />
                                    RPE Target
                                </div>
                                <span className="text-xl font-black text-yellow-500">{currentExercise.targetRpe}</span>
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
                            <button
                                onClick={() => completeSet()}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                            >
                                <Check size={24} strokeWidth={3} />
                                <span className="uppercase tracking-widest font-black">Complete Set</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* REST MODE UI */}
                {isResting && (
                    <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Large Timer (Same size as Work) */}
                        <div className="relative">
                            <CircularTimer
                                progress={restTimer.progress}
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
                                    onClick={() => restTimer.reset()}
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
                                onClick={startWork}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-slate-700"
                            >
                                <span className="uppercase tracking-wider text-sm">Skip Rest & Start Set</span>
                            </button>
                        </div>

                        {/* Logging Interface - Integrated (BELOW Controls) */}
                        <div className="w-full max-w-sm px-4">
                            <div className={`bg-slate-900/50 border ${isSetLogged ? 'border-green-500/30' : 'border-slate-800'} rounded-2xl p-4 transition-colors`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        {isSetLogged ? <Check size={14} className="text-green-500" /> : <History size={14} />}
                                        {isSetLogged ? "Set Logged" : "Log Set"}
                                    </h3>
                                    {isSetLogged && (
                                        <button
                                            onClick={() => setIsSetLogged(false)}
                                            className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>

                                {!isSetLogged && (
                                    <div className="flex justify-center gap-4 mb-4">
                                        <WheelPicker
                                            label="KG"
                                            value={logWeight}
                                            onChange={setLogWeight}
                                            min={0}
                                            max={300}
                                            step={2.5}
                                            height={140}
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
                                                RPE {ex.targetRpe}
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
        </div>
    );
};
