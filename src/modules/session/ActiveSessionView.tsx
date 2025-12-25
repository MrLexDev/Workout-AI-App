import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from '../../store/workoutStore';
import { usePrecisionTimer } from '../../hooks/usePrecisionTimer';
import { useStopwatch } from '../../hooks/useStopwatch';
import { CircularTimer } from '../../components/timer/CircularTimer';
import { Pause,/* Play,*/ RotateCcw, ArrowLeft, Check/*, Timer as TimerIcon*/ } from 'lucide-react';

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
    // We update target time whenever the current exercise changes or we switch to REST
    const [restTarget, setRestTarget] = useState(60);

    const restTimer = usePrecisionTimer(restTarget, () => {
        // Auto-switch to WORK when timer ends?
        // Let's play a sound and then auto-start work
        console.log('Rest finished!');
        startWork();
    });

    // Effect: Sync state changes
    useEffect(() => {
        if (!currentExercise) return;

        if (sessionState === 'WORK') {
            // Ensure stopwatch is running, timer is reset/paused
            stopwatch.start();
            restTimer.reset();
        } else if (sessionState === 'REST') {
            // Ensure timer is running, stopwatch is reset/paused
            setRestTarget(currentExercise.restTimeSec);
            stopwatch.reset(); // or pause if we want to keep track of total time? usually rest is separate.
            restTimer.start();
        } else if (sessionState === 'IDLE' || sessionState === 'COMPLETED') {
            stopwatch.reset();
            restTimer.reset();
        }
    }, [sessionState, currentExercise, stopwatch.start, stopwatch.reset, restTimer.start, restTimer.reset]);

    // Handle Manual Complete Set
    const handleCompleteSet = () => {
        completeSet();
    };

    if (!activeRoutine || !currentExercise) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>No active routine or finished.</p>
                <button onClick={endSession} className="mt-4 text-blue-400 underline">
                    Go Back
                </button>
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
                <div className="overflow-hidden">
                    <h1 className="text-xl font-bold text-white leading-tight truncate">
                        {currentExercise.name}
                    </h1>
                    <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                        Set {currentExercise.targetSets - setsRemaining + 1} of {currentExercise.targetSets}
                    </span>
                </div>
            </header>

            {/* Main Center Display (Flexible, non-scrolling part) */}
            <section className="flex-none flex flex-col items-center justify-center py-4 relative">

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
                    <div className="flex flex-col items-center justify-center h-[280px] w-[280px] rounded-full bg-slate-800/30 border-4 border-slate-700/30 animate-in fade-in zoom-in duration-300">
                        <span className="text-6xl font-black font-mono tracking-wider text-white">
                            {Math.floor(stopwatch.elapsedTime / 60)}:{String(stopwatch.elapsedTime % 60).padStart(2, '0')}
                        </span>
                        <div className="mt-2 flex items-center gap-2 text-green-400 font-medium tracking-widest text-sm uppercase">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Working
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="mt-8 w-full max-w-xs flex flex-col items-center gap-4 px-4">

                    {isResting ? (
                        <button
                            onClick={startWork}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                            <span className="uppercase tracking-wider text-sm">Skip Rest</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleCompleteSet}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
                        >
                            <Check size={24} strokeWidth={3} />
                            <span className="uppercase tracking-wider text-sm">Complete Set</span>
                        </button>
                    )}

                    {/* Timer Adjustments (Only during Rest) */}
                    {isResting && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => restTimer.pause()} // Or handle logic
                                className="p-3 text-slate-500 hover:text-white bg-slate-800 rounded-lg"
                            >
                                <Pause size={20} />
                            </button>
                            <button
                                onClick={() => restTimer.reset()}
                                className="p-3 text-slate-500 hover:text-white bg-slate-800 rounded-lg"
                            >
                                <RotateCcw size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Exercises List (Scrollable now!) */}
            <section className="flex-1 overflow-y-auto min-h-0 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 mt-6">
                <div className="p-6">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider sticky top-0 bg-slate-900/95 py-2 z-10">
                        Up Next
                    </h3>
                    <div className="space-y-3 pb-8">
                        {activeRoutine.exercises.map((ex, idx) => {
                            //const isDone = idx < currentExerciseIndex;
                            const isCurrent = idx === currentExerciseIndex;

                            // Filter out done exercises to keep list focused? 
                            // Or keep them for history visually? 
                            // Let's hide done ones to keep focus on "Upcoming".
                            if (idx < currentExerciseIndex) return null;

                            return (
                                <div
                                    key={ex.id + idx}
                                    className={`
                                        flex justify-between items-center p-4 rounded-xl border transition-colors
                                        ${isCurrent
                                            ? 'bg-blue-500/10 border-blue-500/50'
                                            : 'bg-slate-800/50 border-slate-800 text-slate-400'
                                        }
                                    `}
                                >
                                    <div>
                                        <span className={`font-medium ${isCurrent ? 'text-blue-200' : ''}`}>
                                            {ex.name}
                                        </span>
                                        {isCurrent && (
                                            <span className="ml-2 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm opacity-80">{ex.targetSets} Sets</span>
                                </div>
                            );
                        })}
                        {/* Empty spacer for easier scrolling at bottom */}
                        <div className="h-12" />
                    </div>
                </div>
            </section>

            {/* Footer Info (Removed since title is at top) */}
        </div>
    );
};
