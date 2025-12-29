import React from 'react';
import { type Routine } from '../../types/workout';
import { X, Play, Clock, Tag, Info } from 'lucide-react';

interface RoutinePreviewProps {
    routine: Routine;
    onClose: () => void;
    onStart: () => void;
}

export const RoutinePreview: React.FC<RoutinePreviewProps> = ({ routine, onClose, onStart }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-start bg-slate-800/50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">{routine.name}</h2>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">
                                v{routine.version}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                {routine.category}
                            </span>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${routine.difficulty === 'Beginner' ? 'text-green-400 border-green-400/20 bg-green-400/10' :
                                routine.difficulty === 'Intermediate' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' :
                                    'text-red-400 border-red-400/20 bg-red-400/10'
                                }`}>
                                {routine.difficulty}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                                <Clock size={10} />
                                ~{routine.estimatedDurationMinutes}min
                            </span>
                        </div>
                        {routine.description && (
                            <p className="text-slate-400 text-sm mt-2 leading-relaxed">{routine.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tags */}
                <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap gap-2">
                    {routine.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700/50">
                            <Tag size={10} />
                            {tag}
                        </div>
                    ))}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/20">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Workout Plan ({routine.exercises.length} Exercises)
                    </h3>

                    {routine.exercises.map((ex, index) => (
                        <div key={ex.exerciseId + index} className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                                        {index + 1}
                                    </div>
                                    <h4 className="text-white font-medium">{ex.name}</h4>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded">
                                    <Clock size={10} />
                                    {ex.restTimeSeconds}s
                                </div>
                            </div>

                            {/* Muscles */}
                            <div className="flex flex-wrap gap-1.5 ml-9">
                                {ex.primaryMuscles.map(m => (
                                    <span key={m} className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter">
                                        {m}
                                    </span>
                                ))}
                            </div>

                            {/* Details Row */}
                            <div className="grid grid-cols-3 gap-2 ml-9">
                                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Sets</span>
                                    <span className="text-sm font-bold text-white">{ex.targetSets}</span>
                                </div>
                                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Reps</span>
                                    <span className="text-sm font-bold text-white">{ex.minimumRepetitions}-{ex.maximumRepetitions}</span>
                                </div>
                                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">RPE</span>
                                    <span className="text-sm font-bold text-yellow-500">{ex.targetRpe}</span>
                                </div>
                            </div>

                            {ex.notes && (
                                <div className="ml-9 flex gap-2 p-2 bg-slate-900/30 rounded-lg text-[10px] text-slate-400 italic">
                                    <Info size={12} className="flex-shrink-0 mt-0.5 text-slate-500" />
                                    {ex.notes}
                                </div>
                            )}
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
