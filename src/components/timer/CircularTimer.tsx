import React from 'react';

interface CircularTimerProps {
    progress: number; // 0 to 1
    timeLeft: number; // in seconds
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
    progress,
    timeLeft,
    size = 280,
    strokeWidth = 12,
    children
}) => {
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * progress;

    // Helper to format time mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative flex items-center justify-center drop-shadow-2xl">
            {/* SVG Ring */}
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 pointer-events-none"
            >
                {/* Background Track */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-slate-800"
                />

                {/* Progress Circle with Gradient */}
                <defs>
                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
                        <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet-500 */}
                    </linearGradient>
                </defs>
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="url(#timerGradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        transition: 'stroke-dashoffset 0.1s linear'
                    }}
                />
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                {children ? children : (
                    <>
                        <span className="text-6xl font-black font-mono tracking-wider tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-2">
                            Resting
                        </span>
                    </>
                )}
            </div>

            {/* Outer Glow Effect (Optional decorative) */}
            <div
                className="absolute inset-0 rounded-full bg-blue-500/5 blur-3xl -z-10"
                style={{ transform: 'scale(1.2)' }}
            />
        </div>
    );
};
