import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from '../../store/workoutStore';
import { usePrecisionTimer } from '../../hooks/usePrecisionTimer';
import { useStopwatch } from '../../hooks/useStopwatch';
import { CircularTimer } from '../../components/timer/CircularTimer';
import { RotateCcw, ArrowLeft, Check, Info, Target, Zap, Plus, Minus } from 'lucide-react';

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

    // Derived active exercise
    const currentExercise = activeRoutine?.exercises[currentExerciseIndex];

    // ----- STOPWATCH (WORK MODE) -----
    const stopwatch = useStopwatch();

    // ----- TIMER (REST MODE) -----
    const [restTarget, setRestTarget] = useState(60);

    const restTimer = usePrecisionTimer(restTarget, () => {
        // Auto-switch to WORK when timer ends
        startWork();
    });

    // Effect: Sync state changes
    useEffect(() => {
        if (!currentExercise) return;

        if (sessionState === 'WORK') {
            stopwatch.start();
            restTimer.reset();
        } else if (sessionState === 'REST') {
            // Use restTimeSeconds from v1.1.0 schema
            setRestTarget(currentExercise.restTimeSeconds);
            stopwatch.reset();
            restTimer.start();
        } else if (sessionState === 'IDLE' || sessionState === 'COMPLETED') {
            stopwatch.reset();
            restTimer.reset();
        }
    }, [sessionState, currentExercise, stopwatch, restTimer]);

    // Handle Manual Complete Set
    const handleCompleteSet = () => {
        completeSet();
    };

    if (!activeRoutine || !currentExercise) {
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
            <section className="flex-none flex flex-col items-center justify-center py-6 relative">

                {/* Visualizer Switch */}
                {isResting ? (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <CircularTimer
                            progress={restTimer.progress}
                            timeLeft={restTimer.timeLeft}
                            size={280}
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-20 text-slate-400 font-medium tracking-widest text-sm uppercase">
                            Resting
                        </div>
                    </div>
                ) : (
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
                )}

                {/* Target Info Overlay (Only during work) */}
                {!isResting && (
                    <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-xs px-4">
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
                )}

                {/* Controls */}
                <div className="mt-8 w-full max-w-xs flex flex-col items-center gap-4 px-4">

                    {isResting ? (
                        <button
                            onClick={startWork}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-slate-700"
                        >
                            <span className="uppercase tracking-wider text-sm">Skip Rest</span>
                        </button>
                    ) : (
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={handleCompleteSet}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                            >
                                <Check size={24} strokeWidth={3} />
                                <span className="uppercase tracking-widest font-black">Complete Set</span>
                            </button>
                        </div>
                    )}

                    {isResting && (
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => restTimer.adjustTime(-15)}
                                className="flex-1 p-4 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors flex flex-col items-center gap-1"
                            >
                                <Minus size={20} />
                                <span className="text-[10px] font-bold">-15s</span>
                            </button>
                            <button
                                onClick={() => restTimer.reset()}
                                className="p-4 text-slate-500 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
                            >
                                <RotateCcw size={20} />
                            </button>
                            <button
                                onClick={() => restTimer.adjustTime(15)}
                                className="flex-1 p-4 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors flex flex-col items-center gap-1"
                            >
                                <Plus size={20} />
                                <span className="text-[10px] font-bold">+15s</span>
                            </button>
                        </div>
                    )}
                </div>
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
