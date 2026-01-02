import React, { useState, useMemo } from 'react';
import { Play, MoreHorizontal, Download, Upload, Trash2, Plus } from 'lucide-react';
import { useNativeBack } from '../../hooks/useNativeBack';
import { useWorkoutStore } from '../../store/workoutStore';
import { RoutinePreview } from './RoutinePreview';
import { ImportRoutineModal } from './ImportRoutineModal';
import { hydrateRoutine } from '../../utils/routineHelpers';
import { type Routine } from '../../types/workout';

export const WorkoutDashboard: React.FC = () => {
    // Connect to the store
    const { routines, selectRoutine, startSession, deleteRoutine, createRoutine } = useWorkoutStore();

    // UI State
    const [previewRoutineId, setPreviewRoutineId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [importTargetId, setImportTargetId] = useState<string | null>(null);

    // Back Handler
    useNativeBack(() => {
        if (previewRoutineId) {
            setPreviewRoutineId(null);
            return true;
        }
        if (importTargetId) {
            setImportTargetId(null);
            return true;
        }
        if (activeMenuId) {
            setActiveMenuId(null);
            return true;
        }
        return false;
    }, [previewRoutineId, importTargetId, activeMenuId]);

    // Hydrate routines for display
    const hydratedRoutines = useMemo(() => {
        return routines.map(hydrateRoutine);
    }, [routines]);

    // Handlers
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

    const handleMenuClick = (e: React.MouseEvent, routineId: string) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === routineId ? null : routineId);
    };

    const handleExport = (e: React.MouseEvent, routine: any) => {
        e.stopPropagation();
        const json = JSON.stringify(routine, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            alert('Routine JSON copied to clipboard!');
        });
        setActiveMenuId(null);
    };

    const handleImportClick = (e: React.MouseEvent, routineId: string) => {
        e.stopPropagation();
        setImportTargetId(routineId);
        setActiveMenuId(null);
    };

    const handleDeleteClick = (e: React.MouseEvent, routineId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this routine?')) {
            deleteRoutine(routineId);
        }
        setActiveMenuId(null);
    };

    const handleCreateRoutine = () => {
        const newRoutine: Routine = {
            id: crypto.randomUUID(),

            name: 'New Custom Routine',
            category: 'Custom',
            difficulty: 'Intermediate',
            estimatedDurationMinutes: 45,
            description: 'A new custom workout routine.',
            exercises: [],
            tags: ['Custom']
        };
        createRoutine(newRoutine);
    };

    // Close menu when clicking outside
    const closeMenu = () => setActiveMenuId(null);

    const previewRoutine = hydratedRoutines.find(r => r.id === previewRoutineId);

    return (
        <div className="space-y-6 relative pb-20" onClick={closeMenu}>
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white">My Routines</h2>
                    <p className="text-slate-400 text-sm">Select a routine to start training</p>
                </div>
                <button
                    onClick={handleCreateRoutine}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors"
                >
                    <Plus size={16} />
                    NEW
                </button>
            </header>

            <div className="space-y-4">
                {hydratedRoutines.map((routine) => (
                    <div
                        key={routine.id}
                        className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer group relative"
                        onClick={() => handleCardClick(routine.id)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{routine.name}</h3>
                                <p className="text-slate-400 text-xs mt-1">
                                    {routine.exercises.length} Exercises • {routine.description}
                                </p>
                            </div>

                            {/* Menu Button */}
                            <div className="relative">
                                <button
                                    onClick={(e) => handleMenuClick(e, routine.id)}
                                    className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
                                >
                                    <MoreHorizontal size={20} />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMenuId === routine.id && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                            onClick={(e) => handleImportClick(e, routine.id)}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                                        >
                                            <Upload size={16} />
                                            Import JSON
                                        </button>
                                        <button
                                            onClick={(e) => handleExport(e, routine)}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left border-t border-slate-800"
                                        >
                                            <Download size={16} />
                                            Export JSON
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, routine.id)}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors text-left border-t border-slate-800"
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Exercise Preview (First 3) */}
                        <div className="flex gap-2 mb-4 overflow-hidden">
                            {routine.exercises.slice(0, 3).map((ex, i) => (
                                <span
                                    key={ex.exerciseId + i}
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

            {/* Import Modal */}
            {importTargetId && (
                <ImportRoutineModal
                    targetRoutineId={importTargetId}
                    onClose={() => setImportTargetId(null)}
                />
            )}
        </div>
    );
};