import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export const useStopwatch = () => {
    const [elapsedTime, setElapsedTime] = useState(0); // in seconds (can use ms for more precision if needed)
    const [isRunning, setIsRunning] = useState(false);

    // Tracking start time
    const startTimeRef = useRef<number | null>(null);
    // Tracking accumulated time from previous pauses
    const accumulatedTimeRef = useRef<number>(0);

    const [progress, setProgress] = useState(0);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        let animationFrameId: number;

        const loop = () => {
            if (isRunning && startTimeRef.current !== null) {
                const now = Date.now();
                const delta = now - startTimeRef.current;
                const totalMs = accumulatedTimeRef.current + delta;

                setElapsedTime(Math.floor(totalMs / 1000));

                // 2-Minute "Chase" Cycle for Clockwise Motion
                // Cycle 0 (0-60s): Fill clockwise from top. (Front moves)
                // Cycle 1 (60-120s): Empty clockwise from top. (Back moves) chase.
                const totalCycleProgress = (totalMs % 120000) / 60000;

                if (totalCycleProgress <= 1) {
                    // Minute 1: Fill 0 -> 1, Start at 0
                    setProgress(totalCycleProgress);
                    setOffset(0);
                } else {
                    // Minute 2: Length 1 -> 0, Start moves 0 -> 1
                    const p = totalCycleProgress - 1;
                    setProgress(1 - p);
                    setOffset(p);
                }

                animationFrameId = requestAnimationFrame(loop);
            }
        };

        if (isRunning) {
            loop();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isRunning]);

    const start = useCallback(() => {
        if (!isRunning) {
            startTimeRef.current = Date.now();
            setIsRunning(true);
        }
    }, [isRunning]);

    const pause = useCallback(() => {
        if (isRunning && startTimeRef.current) {
            const now = Date.now();
            const delta = now - startTimeRef.current;
            accumulatedTimeRef.current += delta;

            startTimeRef.current = null;
            setIsRunning(false);
            const finalTotalMs = accumulatedTimeRef.current;
            setElapsedTime(Math.floor(finalTotalMs / 1000));

            const totalCycleProgress = (finalTotalMs % 120000) / 60000;
            if (totalCycleProgress <= 1) {
                setProgress(totalCycleProgress);
                setOffset(0);
            } else {
                const p = totalCycleProgress - 1;
                setProgress(1 - p);
                setOffset(p);
            }
        }
    }, [isRunning]);

    const reset = useCallback(() => {
        setIsRunning(false);
        startTimeRef.current = null;
        accumulatedTimeRef.current = 0;
        setElapsedTime(0);
        setProgress(0);
        setOffset(0);
    }, []);

    const returnValue = useMemo(() => ({
        elapsedTime,
        isRunning,
        progress,
        offset,
        start,
        pause,
        reset
    }), [elapsedTime, isRunning, progress, offset, start, pause, reset]);

    return returnValue;
};
