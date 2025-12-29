import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export const useStopwatch = () => {
    const [elapsedTime, setElapsedTime] = useState(0); // in seconds (can use ms for more precision if needed)
    const [isRunning, setIsRunning] = useState(false);

    // Tracking start time
    const startTimeRef = useRef<number | null>(null);
    // Tracking accumulated time from previous pauses
    const accumulatedTimeRef = useRef<number>(0);

    useEffect(() => {
        let animationFrameId: number;

        const loop = () => {
            if (isRunning && startTimeRef.current !== null) {
                const now = Date.now();
                const delta = now - startTimeRef.current;
                // Total elapsed = stored accumulation + current delta
                const totalMs = accumulatedTimeRef.current + delta;
                setElapsedTime(Math.floor(totalMs / 1000));

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
            setElapsedTime(Math.floor(accumulatedTimeRef.current / 1000));
        }
    }, [isRunning]);

    const reset = useCallback(() => {
        setIsRunning(false);
        startTimeRef.current = null;
        accumulatedTimeRef.current = 0;
        setElapsedTime(0);
    }, []);

    const returnValue = useMemo(() => ({
        elapsedTime,
        isRunning,
        start,
        pause,
        reset
    }), [elapsedTime, isRunning, start, pause, reset]);

    return returnValue;
};
