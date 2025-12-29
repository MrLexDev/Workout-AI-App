import React from 'react';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div
                    className={`block w-9 h-5 rounded-full transition-colors duration-300 ${checked ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                />
                <div
                    className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${checked ? 'translate-x-4' : 'translate-x-0'
                        }`}
                />
            </div>
            {label && (
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${checked ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {label}
                </span>
            )}
        </label>
    );
};
