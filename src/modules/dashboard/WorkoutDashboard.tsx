import React, { useState } from 'react';
import { Play, MoreHorizontal } from 'lucide-react';
import { useWorkoutStore } from '../../store/workoutStore';
import { RoutinePreview } from './RoutinePreview';

export const WorkoutDashboard: React.FC = () => {
    // Connect to the store
    const { routines, selectRoutine, startSession } = useWorkoutStore();
    const [previewRoutineId, setPreviewRoutineId] = useState<string | null>(null);

    const handleCardClick = (routineId: string) => {
        setPreviewRoutineId(routineId);
    };

    const handleStartWorkout = () => {
        if (previewRoutineId) {
            selectRoutine(previewRoutineId);
            startSession();
            setPreviewRoutineId(null);
        }
    };

    const previewRoutine = routines.find(r => r.id === previewRoutineId);

    return (
        <div className="space-y-6 relative">
            <header>
                <h2 className="text-2xl font-bold text-white">My Routines</h2>
                <p className="text-slate-400 text-sm">Select a routine to start training</p>
            </header>

            <div className="space-y-4">
                {routines.map((routine) => (
                    <div
                        key={routine.id}
                        className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer group"
                        onClick={() => handleCardClick(routine.id)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{routine.name}</h3>
                                <p className="text-slate-400 text-xs mt-1">
                                    {routine.exercises.length} Exercises • {routine.description}
                                </p>
                            </div>
                            <button className="text-slate-500 hover:text-white p-1">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        {/* Exercise Preview (First 3) */}
                        <div className="flex gap-2 mb-4 overflow-hidden">
                            {routine.exercises.slice(0, 3).map((ex) => (
                                <span
                                    key={ex.id}
                                    className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-300 border border-slate-700 whitespace-nowrap"
                                >
                                    {ex.name}
                                </span>
                            ))}
                            {routine.exercises.length > 3 && (
                                <span className="px-2 py-1 text-xs text-slate-500">+{routine.exercises.length - 3}</span>
                            )}
                        </div>

                        <button
                            className="w-full bg-slate-700 group-hover:bg-blue-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Play size={18} fill="currentColor" />
                            Preview Workout
                        </button>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            {previewRoutine && (
                <RoutinePreview
                    routine={previewRoutine}
                    onClose={() => setPreviewRoutineId(null)}
                    onStart={handleStartWorkout}
                />
            )}
        </div>
    );
};