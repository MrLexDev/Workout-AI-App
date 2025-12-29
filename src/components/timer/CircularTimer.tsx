import React from 'react';

interface CircularTimerProps {
    progress: number; // 0 to 1 (Length of stroke, 1 = Full)
    offset?: number;  // 0 to 1 (Start position, clockwise from top)
    timeLeft: number; // in seconds
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
    variant?: 'blue' | 'green';
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
    progress,
    offset = 0,
    timeLeft,
    size = 280,
    strokeWidth = 12,
    children,
    variant = 'blue'
}) => {
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    // Length of the dash (stroke)
    const dashLength = circumference * Math.max(0, Math.min(1, progress));
    // Offset to move the start of the dash clockwise
    // SVG stroke-dashoffset: -X shifts the dash pattern X units FORWARD (clockwise)
    const dashOffset = -circumference * offset;

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
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
                        <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet-500 */}
                    </linearGradient>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" /> {/* Emerald-500 */}
                        <stop offset="100%" stopColor="#3b82f6" /> {/* Blue-500 */}
                    </linearGradient>
                </defs>
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={`url(#${variant === 'green' ? 'greenGradient' : 'blueGradient'})`}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: `${dashLength} ${circumference}`,
                        strokeDashoffset: dashOffset,
                        transition: 'stroke-dashoffset 0.1s linear, stroke-dasharray 0.1s linear'
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
                className={`absolute inset-0 rounded-full ${variant === 'green' ? 'bg-green-500/5' : 'bg-blue-500/5'} blur-3xl -z-10`}
                style={{ transform: 'scale(1.2)' }}
            />
        </div>
    );
};
