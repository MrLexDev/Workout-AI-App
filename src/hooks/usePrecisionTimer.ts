import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UsePrecisionTimerReturn {
    timeLeft: number;
    isRunning: boolean;
    progress: number;
    start: () => void;
    pause: () => void;
    reset: () => void;
    adjustTime: (seconds: number) => void;
}

/**
 * A robust timer hook that uses Date.now() deltas to prevent drift.
 * @param targetTimeSeconds The duration of the timer in seconds.
 * @param onComplete Callback function to execute when the timer reaches zero.
 */
export const usePrecisionTimer = (
    targetTimeSeconds: number,
    onComplete?: () => void
): UsePrecisionTimerReturn => {
    // Current time remaining in milliseconds (used for precise calculations)
    // We store this in a ref to be the source of truth without triggering re-renders
    const remainingTimeRef = useRef<number>(targetTimeSeconds * 1000);

    // The timestamp when the current active segment started (Date.now())
    const startTimeRef = useRef<number | null>(null);

    // State for UI rendering
    const [timeLeft, setTimeLeft] = useState<number>(targetTimeSeconds);
    const [progress, setProgress] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    // Store the latest callback to avoid stale closures in the interval
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Reset internal state if the target time changes
    useEffect(() => {
        remainingTimeRef.current = targetTimeSeconds * 1000;
        startTimeRef.current = null;
        setTimeLeft(targetTimeSeconds);
        setProgress(0);
        setIsRunning(false);
    }, [targetTimeSeconds]);

    const calculateState = useCallback(() => {
        const totalDurationMs = targetTimeSeconds * 1000;
        let currentRemaining = remainingTimeRef.current;

        // If running, calculate delta
        if (startTimeRef.current !== null) {
            const now = Date.now();
            const elapsedSinceStart = now - startTimeRef.current;
            currentRemaining = Math.max(0, remainingTimeRef.current - elapsedSinceStart);
        }

        // Calculate progress (0 starts at beginning, 1 is complete)
        // Guard against divide by zero
        const currentProgress = totalDurationMs > 0
            ? Math.min(1, Math.max(0, 1 - (currentRemaining / totalDurationMs)))
            : 1;

        return {
            remainingMs: currentRemaining,
            displaySeconds: Math.ceil(currentRemaining / 1000),
            progressVal: currentProgress
        };
    }, [targetTimeSeconds]);

    // The tick loop
    useEffect(() => {
        //let animationFrameId: number;
        let intervalId: ReturnType<typeof setInterval>;

        if (isRunning) {
            // We use setInterval for the main check loop to ensure we consistently catch the end
            // purely relying on RAF might stop in background tabs completely.
            intervalId = setInterval(() => {
                const { remainingMs, displaySeconds, progressVal } = calculateState();

                // Update UI state
                setTimeLeft(displaySeconds);
                setProgress(progressVal);

                if (remainingMs <= 0) {
                    setIsRunning(false);
                    startTimeRef.current = null;
                    remainingTimeRef.current = 0;

                    // Prevent slight negative floating point issues
                    setTimeLeft(0);
                    setProgress(1);

                    // Trigger completion
                    if (onCompleteRef.current) {
                        onCompleteRef.current();
                    }

                    // [PLACEHOLDER] TRIGGER NATIVE AUDIO/NOTIFICATION HERE
                    // e.g. playNotificationSound();
                }
            }, 50); // 50ms update rate approx 20fps, good enough for timer UI
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isRunning, calculateState]);

    const start = useCallback(() => {
        if (remainingTimeRef.current <= 0) return; // Already finished
        if (!isRunning) {
            setIsRunning(true);
            // Set the start time point
            startTimeRef.current = Date.now();
        }
    }, [isRunning]);

    const pause = useCallback(() => {
        if (isRunning && startTimeRef.current !== null) {
            // Commit the elapsed time to the remainingTimeRef
            const now = Date.now();
            const elapsed = now - startTimeRef.current;
            remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);

            startTimeRef.current = null;
            setIsRunning(false);
        }
    }, [isRunning]);

    const reset = useCallback(() => {
        setIsRunning(false);
        startTimeRef.current = null;
        remainingTimeRef.current = targetTimeSeconds * 1000;

        setTimeLeft(targetTimeSeconds);
        setProgress(0);
    }, [targetTimeSeconds]);

    const adjustTime = useCallback((seconds: number) => {
        const adjustmentMs = seconds * 1000;
        const newRemainingMs = Math.max(0, remainingTimeRef.current + adjustmentMs);
        remainingTimeRef.current = newRemainingMs;

        // If not running, we need to update the UI manually
        if (!isRunning) {
            const displaySeconds = Math.ceil(newRemainingMs / 1000);
            const totalDurationMs = targetTimeSeconds * 1000;
            const currentProgress = totalDurationMs > 0
                ? Math.min(1, Math.max(0, 1 - (newRemainingMs / totalDurationMs)))
                : 1;

            setTimeLeft(displaySeconds);
            setProgress(currentProgress);
        }
    }, [isRunning, targetTimeSeconds]);

    return useMemo(() => ({
        timeLeft,
        isRunning,
        progress,
        start,
        pause,
        reset,
        adjustTime
    }), [timeLeft, isRunning, progress, start, pause, reset, adjustTime]);
};
