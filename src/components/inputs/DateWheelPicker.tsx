import React, { useEffect, useState, useMemo } from 'react';
import { WheelPicker } from './WheelPicker';

interface DateWheelPickerProps {
    value?: string; // Format: YYYY-MM-DD
    onChange: (value: string) => void;
}

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DateWheelPicker: React.FC<DateWheelPickerProps> = ({ value, onChange }) => {
    // Parse initial value or default to "2000-01-01"
    const parsedDate = useMemo(() => {
        if (!value) return { year: 2000, month: 1, day: 1 };
        const date = new Date(value);
        if (isNaN(date.getTime())) return { year: 2000, month: 1, day: 1 };
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1, // 1-12
            day: date.getDate()
        };
    }, [value]);

    const [year, setYear] = useState(parsedDate.year);
    const [month, setMonth] = useState(parsedDate.month);
    const [day, setDay] = useState(parsedDate.day);

    // Sync state if external value changes significantly (avoid loops)
    useEffect(() => {
        setYear(parsedDate.year);
        setMonth(parsedDate.month);
        setDay(parsedDate.day);
    }, [parsedDate]);

    // Calculate max days in current month/year
    const maxDays = useMemo(() => {
        return new Date(year, month, 0).getDate();
    }, [year, month]);

    // Construct date string and notify parent
    const handleChange = (y: number, m: number, d: number) => {
        // Adjust day if it exceeds max for new month
        const currentMaxDays = new Date(y, m, 0).getDate();
        const validDay = Math.min(d, currentMaxDays);

        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
        onChange(dateStr);
    };

    const handleYearChange = (newYear: number) => {
        setYear(newYear); // Optimistic update
        handleChange(newYear, month, day);
    };

    const handleMonthChange = (newMonth: number) => {
        setMonth(newMonth);
        handleChange(year, newMonth, day);
    };

    const handleDayChange = (newDay: number) => {
        setDay(newDay);
        handleChange(year, month, newDay);
    };

    const currentYear = new Date().getFullYear();

    return (
        <div className="flex justify-center gap-1 bg-slate-900 rounded-xl p-2 border border-slate-800">
            {/* Day */}
            <WheelPicker
                min={1}
                max={maxDays}
                value={day}
                onChange={handleDayChange}
                width="60px"
                height={150}
                label="Day"
            />
            {/* Month */}
            <WheelPicker
                min={1}
                max={12}
                value={month}
                onChange={handleMonthChange}
                width="80px"
                height={150}
                formatter={(val) => MONTHS[val - 1]}
                label="Month"
            />
            {/* Year */}
            <WheelPicker
                min={1920}
                max={currentYear}
                value={year}
                onChange={handleYearChange}
                width="80px"
                height={150}
                label="Year"
            />
        </div>
    );
};
