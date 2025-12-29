import React, { useRef, useEffect, useState } from 'react';

interface WheelPickerProps {
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
    label?: string;
    height?: number;
    itemHeight?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({
    min,
    max,
    step = 1,
    value,
    onChange,
    label,
    height = 200,
    itemHeight = 40
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);
    const [range, setRange] = useState<number[]>([]);

    // Generate range numbers
    useEffect(() => {
        const arr = [];
        for (let i = min; i <= max; i += step) {
            // Fix float precision issues
            arr.push(parseFloat(i.toFixed(2)));
        }
        setRange(arr);
    }, [min, max, step]);

    // Handle initial scroll position
    useEffect(() => {
        if (scrollRef.current && range.length > 0 && !isScrolling.current) {
            const index = range.findIndex(v => v === value);
            if (index !== -1) {
                scrollRef.current.scrollTop = index * itemHeight;
            }
        }
    }, [range, value, itemHeight]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        isScrolling.current = true;

        const scrollTop = scrollRef.current.scrollTop;
        const index = Math.round(scrollTop / itemHeight);

        // Debounce value update to avoid too many updates while scrolling
        if (range[index] !== undefined) {
            // We can throttle this or just update. 
            // For snapping, the CSS should handle the visual alignment, 
            // but we need to update state eventually.
            // Here we update immediately but maybe we should wait for scroll end?
            // For simplicity, let's update. If performance is bad, debounce.
            if (range[index] !== value) {
                onChange(range[index]);
            }
        }

        // Reset scrolling flag after a delay? 
        // actually simply updating value might trigger the useEffect above 
        // which forces scrollTop, causing a fight.
        // We need to disable the useEffect sync while user is interacting.
        // We'll use a timeout to clear the "isScrolling" flag.

        clearTimeout((window as any).scrollTimeout);
        (window as any).scrollTimeout = setTimeout(() => {
            isScrolling.current = false;
            // Ensure perfect snap on stop
            if (scrollRef.current) {
                const finalIndex = Math.round(scrollRef.current.scrollTop / itemHeight);
                if (range[finalIndex] !== value) {
                    onChange(range[finalIndex]);
                }
            }
        }, 150);
    };

    return (
        <div className="flex flex-col items-center">
            {label && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</div>}
            <div
                className="relative overflow-hidden bg-slate-900/50 rounded-xl border border-slate-800"
                style={{ height: height, width: '100px' }}
            >
                {/* Selection Highlight */}
                <div
                    className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none border-y border-blue-500/50 bg-blue-500/10 z-10"
                    style={{ height: itemHeight }}
                />

                {/* Gradients */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-20" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-20" />

                <div
                    ref={scrollRef}
                    className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                    onScroll={handleScroll}
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {/* Padding for center alignment */}
                    <div style={{ height: (height - itemHeight) / 2 }} />

                    {range.map((num) => (
                        <div
                            key={num}
                            className={`flex items-center justify-center snap-center transition-all duration-200 ${num === value ? 'text-white font-bold scale-110' : 'text-slate-600 scale-90'
                                }`}
                            style={{ height: itemHeight }}
                        >
                            {num}
                        </div>
                    ))}

                    <div style={{ height: (height - itemHeight) / 2 }} />
                </div>
            </div>
        </div>
    );
};
