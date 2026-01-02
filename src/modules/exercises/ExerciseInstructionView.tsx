import React from 'react';
import { ArrowLeft, BookOpen, Info } from 'lucide-react';
import type { ExerciseDefinition } from '../../types/workout';
import exerciseMediaData from '../../data/exerciseMedia.json';

interface ExerciseInstructionViewProps {
    exercise: ExerciseDefinition;
    onBack: () => void;
}

export const ExerciseInstructionView: React.FC<ExerciseInstructionViewProps> = ({ exercise, onBack }) => {
    const mediaItem = exerciseMediaData.find(item => item.exerciseId === exercise.id);
    const imageUrl = mediaItem?.imageUrl || `https://placehold.co/600x400/1e293b/475569?text=${encodeURIComponent(exercise.name)}`;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 safe-top flex items-center gap-4 shrink-0">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full active:bg-slate-800"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-white truncate flex-1">
                    {exercise.name}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-safe">
                {/* Image Section */}
                <div className="w-full aspect-video bg-slate-900 border-b border-slate-800 relative overflow-hidden group">
                    <img
                        src={imageUrl}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {exercise.targetMuscles.primary.map((m, i) => (
                                <span key={i} className="text-[10px] font-bold text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/30 backdrop-blur-sm">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Instructions Content */}
                <div className="p-5 space-y-6">

                    {/* Setup Section */}
                    {exercise.instructions?.setup && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Info size={18} />
                                <h3 className="text-sm font-bold uppercase tracking-wider">Setup</h3>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed">
                                {exercise.instructions.setup}
                            </div>
                        </div>
                    )}

                    {/* Execution Section */}
                    {exercise.instructions?.execution && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <BookOpen size={18} />
                                <h3 className="text-sm font-bold uppercase tracking-wider">Execution</h3>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <ul className="space-y-3">
                                    {exercise.instructions.execution.map((step, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-slate-300">
                                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                                                {idx + 1}
                                            </span>
                                            <span className="leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Pro Tips Section */}
                    {exercise.instructions?.tips && exercise.instructions.tips.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 pl-1">Pro Tips</h3>
                            <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 space-y-3">
                                {exercise.instructions.tips.map((tip, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm text-amber-200/80">
                                        <span className="text-amber-500 font-bold">•</span>
                                        <span className="leading-relaxed">{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
