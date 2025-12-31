import React, { useMemo } from 'react';
import { type Routine } from '../../types/workout';
import { hydrateRoutine } from '../../utils/routineHelpers';
import { useNativeBack } from '../../hooks/useNativeBack';
import { X, Play, Plus, Clock, BarChart, Dumbbell } from 'lucide-react';

interface RoutinePreviewModalProps {
    routine: Routine;
    isOpen: boolean;
    onClose: () => void;
    onStart: () => void;
    onAddToDashboard: () => void;
    isAlreadyInDashboard: boolean;
}

export const RoutinePreviewModal: React.FC<RoutinePreviewModalProps> = ({
    routine,
    isOpen,
    onClose,
    onStart,
    onAddToDashboard,
    isAlreadyInDashboard
}) => {
    useNativeBack(() => {
        if (isOpen) {
            onClose();
            return true;
        }
        return false;
    }, [isOpen, onClose], 20); // Higher priority than App root

    if (!isOpen) return null;

    const hydratedRoutine = useMemo(() => hydrateRoutine(routine), [routine]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="relative h-32 bg-gradient-to-br from-blue-900/50 to-slate-900 flex items-center px-6 border-b border-slate-700/50">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors bg-slate-900/50 p-1 rounded-full"
                    >
                        <X size={20} />
                    </button>
                    <div>
                        <div className="flex gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-950/50 border border-blue-500/20 px-2 py-0.5 rounded">
                                {hydratedRoutine.difficulty}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800/50 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                                <Clock size={10} /> {hydratedRoutine.estimatedDurationMinutes}m
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{hydratedRoutine.name}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Description */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h3>
                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                            {hydratedRoutine.description}
                        </p>
                    </div>

                    {/* Tags */}
                    {hydratedRoutine.tags && hydratedRoutine.tags.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {hydratedRoutine.tags.map(tag => (
                                    <span key={tag} className="text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Exercises List */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Workout Plan</span>
                            <span className="text-xs normal-case font-normal text-slate-600">{hydratedRoutine.exercises.length} Exercises</span>
                        </h3>
                        <div className="space-y-3">
                            {hydratedRoutine.exercises.map((ex, index) => (
                                <div key={index} className="flex items-start gap-4 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-500 font-mono text-xs font-bold border border-slate-700">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm">{ex.name}</h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <BarChart size={12} className="text-blue-500" />
                                                <span className="text-slate-300">{ex.targetSets}</span> Sets
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Dumbbell size={12} className="text-blue-500" />
                                                <span className="text-slate-300">{ex.minimumRepetitions}-{ex.maximumRepetitions}</span> Reps
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} className="text-blue-500" />
                                                <span className="text-slate-300">{ex.restTimeSeconds}s</span> Rest
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/80 flex gap-3">
                    {!isAlreadyInDashboard && (
                        <button
                            onClick={onAddToDashboard}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                        >
                            <Plus size={18} />
                            Add to My Routines
                        </button>
                    )}
                    <button
                        onClick={onStart}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                    >
                        <Play size={18} fill="currentColor" />
                        Start Workout
                    </button>
                </div>
            </div>
        </div>
    );
};
