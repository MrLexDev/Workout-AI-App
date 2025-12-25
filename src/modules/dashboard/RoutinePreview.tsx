import React from 'react';
import { type Routine } from '../../types/workout';
import { X, Play, Clock, Dumbbell } from 'lucide-react';

interface RoutinePreviewProps {
    routine: Routine;
    onClose: () => void;
    onStart: () => void;
}

export const RoutinePreview: React.FC<RoutinePreviewProps> = ({ routine, onClose, onStart }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-md max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-start bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">{routine.name}</h2>
                        {routine.description && (
                            <p className="text-slate-400 text-sm mt-1">{routine.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Workout Plan ({routine.exercises.length} Exercises)
                    </h3>

                    {routine.exercises.map((ex, index) => (
                        <div key={ex.id + index} className="flex gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs mt-1">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium">{ex.name}</h4>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                        <Dumbbell size={12} />
                                        <span>{ex.targetSets} Sets</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                        <Clock size={12} />
                                        <span>{ex.restTimeSec}s Rest</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="p-5 border-t border-slate-800 bg-slate-900">
                    <button
                        onClick={onStart}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
                    >
                        <Play size={20} fill="currentColor" />
                        Start Workout
                    </button>
                </div>

            </div>
        </div>
    );
};
