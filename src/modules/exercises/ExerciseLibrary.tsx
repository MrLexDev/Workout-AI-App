import React, { useMemo, useState, useEffect } from 'react';
import { type ExerciseDefinition, type Routine } from '../../types/workout';
import exerciseData from '../../data/exercises.json';
import { exerciseStorageService } from '../../services/storage/ExerciseStorageService';
import { Dumbbell, Search, Info, ChevronDown, ChevronUp, Download, X, AlertCircle } from 'lucide-react';
import { useWorkoutStore } from '../../store/workoutStore';
import initialRoutinesData from '../../data/initialRoutines.json';
import { RoutinePreviewModal } from './RoutinePreviewModal';

export const ExerciseLibrary: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'exercises' | 'routines'>('exercises');

    // 1. Static + Custom Exercises
    const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([]);

    // Load custom exercises on mount
    useEffect(() => {
        setCustomExercises(exerciseStorageService.loadCustomExercises());
    }, []);

    // Merge static and custom
    // We prioritize custom if IDs collide (optional decision, usually safer to merge unique IDs)
    const allExercises = useMemo(() => {
        // Create a map to ensure uniqueness by ID, defaulting to static, overwriting with custom
        const map = new Map<string, ExerciseDefinition>();

        const staticData = exerciseData as ExerciseDefinition[];
        staticData.forEach(ex => map.set(ex.id, ex));
        customExercises.forEach(ex => map.set(ex.id, ex));

        return Array.from(map.values());
    }, [customExercises]);

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    // Filter based on search results from the MERGED list
    const filteredExercises = useMemo(() => {
        if (!searchQuery.trim()) return allExercises;
        const lowerQuery = searchQuery.toLowerCase();
        return allExercises.filter(ex =>
            ex.name.toLowerCase().includes(lowerQuery) ||
            ex.primaryMuscles.some(m => m.toLowerCase().includes(lowerQuery)) ||
            ex.secondaryMuscles.some(m => m.muscle.toLowerCase().includes(lowerQuery)) ||
            ex.equipment.toLowerCase().includes(lowerQuery)
        );
    }, [allExercises, searchQuery]);

    const handleImport = () => {
        setImportError(null);
        setImportSuccess(null);

        try {
            const newExercises = exerciseStorageService.parseImportJson(importJson);

            // Merge with existing custom exercises to avoid losing previous custom ones
            // Logic: Filter out old custom ones that have same ID as new ones (overwrite)
            // or just append. Let's use a Map for the custom list too.
            const mergedCustom = [...customExercises];
            let addedCount = 0;
            let updatedCount = 0;

            newExercises.forEach(newEx => {
                const existingIdx = mergedCustom.findIndex(e => e.id === newEx.id);
                if (existingIdx >= 0) {
                    mergedCustom[existingIdx] = newEx;
                    updatedCount++;
                } else {
                    mergedCustom.push(newEx);
                    addedCount++;
                }
            });

            exerciseStorageService.saveCustomExercises(mergedCustom);
            setCustomExercises(mergedCustom);
            setImportSuccess(`Successfully imported ${addedCount} new exercises and updated ${updatedCount}.`);
            setImportJson('');
            // Optional: Close modal after short delay? Or let user close.
        } catch (e: any) {
            setImportError(e.message);
        }
    };

    // --- Routine Logic ---
    const { routines, createRoutine, selectRoutine, startSession } = useWorkoutStore();

    // Split routines into Default (Initial) and Custom (User)
    const { defaultRoutines, userRoutines } = useMemo(() => {
        // We use the ID to check if it's one of the initial ones
        const initialIds = new Set((initialRoutinesData as any[]).map(r => r.id));
        const defaults = initialRoutinesData as Routine[]; // Direct source for formatting consistency
        const users: Routine[] = [];

        // Safeguard to prevent crash and ensure routines is iterable
        (routines || []).forEach(r => {
            if (!initialIds.has(r.id)) {
                users.push(r);
            }
        });

        return { defaultRoutines: defaults, userRoutines: users };
    }, [routines]);

    // Preview Modal Logic
    const [previewRoutine, setPreviewRoutine] = useState<Routine | null>(null);

    const handleOpenPreview = (routine: Routine) => {
        setPreviewRoutine(routine);
    };

    const handleClosePreview = () => {
        setPreviewRoutine(null);
    };

    const handleStartWorkout = () => {
        if (!previewRoutine) return;

        // 1. Ensure routine exists in store (if default, valid, if user, valid)
        // Check if routine exists in store (by ID)
        const exists = routines && routines.some(r => r.id === previewRoutine.id);
        if (!exists) {
            createRoutine(previewRoutine);
        }

        // 2. Select and Start
        selectRoutine(previewRoutine.id);
        startSession();

        // 3. No need to navigate, App state handles view switch
    };

    const handleAddToDashboard = () => {
        if (!previewRoutine) return;
        createRoutine(previewRoutine);
        handleClosePreview();
    };

    const isPreviewInStore = useMemo(() => {
        if (!previewRoutine || !routines) return false;
        return routines.some(r => r.id === previewRoutine.id);
    }, [previewRoutine, routines]);


    return (
        <div className="space-y-6 relative">
            <header className="space-y-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Dumbbell className="text-blue-500" />
                            Library
                        </h2>
                        {activeTab === 'exercises' && (
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Download size={16} />
                                Import
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('exercises')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'exercises'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            Exercises
                        </button>
                        <button
                            onClick={() => setActiveTab('routines')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'routines'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            Routines
                        </button>
                    </div>
                </div>

                {/* Search Bar - Only for Exercises currently */}
                {activeTab === 'exercises' && (
                    <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${allExercises.length} exercises...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                )}
            </header>

            <div className="min-h-[300px]">
                {activeTab === 'exercises' ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
                        {filteredExercises.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                                <p>No exercises found.</p>
                            </div>
                        ) : (
                            filteredExercises.map((ex) => {
                                const isExpanded = expandedIds.has(ex.id);

                                return (
                                    <div
                                        key={ex.id}
                                        className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden transition-all duration-200"
                                    >
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/50"
                                            onClick={() => toggleExpand(ex.id)}
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white text-base">{ex.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20">
                                                        {ex.primaryMuscles[0]}
                                                    </span>
                                                    <span className="text-xs text-slate-500 truncate">
                                                        {ex.equipment}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="text-slate-500 p-1">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-0 border-t border-slate-700/50 bg-slate-900/30">
                                                <div className="mt-4 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Targets</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {/* Primary Muscles - Always Bold */}
                                                            {ex.primaryMuscles.map((m, i) => (
                                                                <span key={`p-${i}`} className="text-xs font-bold text-blue-300 bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                                    {m}
                                                                </span>
                                                            ))}
                                                            {/* Secondary Muscles - Bold if Impact is High */}
                                                            {ex.secondaryMuscles.map((sm, i) => (
                                                                <span key={`s-${i}`} className={`text-xs px-1.5 py-0.5 rounded border border-slate-700 ${sm.impact === 'High' ? 'font-bold text-slate-100 bg-slate-700' : 'text-slate-300 bg-slate-800'}`}>
                                                                    {sm.muscle}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Equipment</span>
                                                        <span className="text-xs text-white">{ex.equipment}</span>
                                                    </div>
                                                </div>

                                                {ex.description && (
                                                    <div className="mt-4 bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg flex gap-3">
                                                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-blue-200/80 leading-relaxed">
                                                            {ex.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    // --- ROUTINES VIEW ---
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* 1. Default Workouts Section */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">Default Workouts</h3>
                            <div className="grid gap-3">
                                {defaultRoutines.map(routine => (
                                    <div
                                        key={routine.id}
                                        onClick={() => handleOpenPreview(routine)}
                                        className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 transition-all cursor-pointer hover:bg-slate-700/50"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white text-lg">{routine.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">{routine.estimatedDurationMinutes} min</span>
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-900/30 text-indigo-400 border border-indigo-500/20">
                                                    {routine.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{routine.description}</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {routine.tags.map((tag, i) => (
                                                <span key={i} className="text-[10px] text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 2. My Workouts Section */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">My Workouts</h3>
                            {userRoutines.length === 0 ? (
                                <div className="p-6 text-center border border-slate-800 border-dashed rounded-xl bg-slate-900/30">
                                    <p className="text-sm text-slate-500">You haven't created any custom workouts yet.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {userRoutines.map(routine => (
                                        <div
                                            key={routine.id}
                                            onClick={() => handleOpenPreview(routine)}
                                            className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 transition-all cursor-pointer hover:bg-slate-700/50"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white text-lg">{routine.name}</h4>
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-500/20">
                                                    {routine.exercises.length} Exercises
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 line-clamp-2 mb-3">{routine.description}</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {routine.tags.map((tag, i) => (
                                                    <span key={i} className="text-[10px] text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">Import Exercises</h3>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            <p className="text-sm text-slate-400 mb-2">
                                Paste your JSON array of exercises below. Existing exercises with the same ID will be updated.
                            </p>
                            <textarea
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                placeholder='[{"id": "ex-1", "name": "...", ...}]'
                                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
                            />

                            {importError && (
                                <div className="mt-3 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex gap-2">
                                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                                    <p className="text-xs text-red-300">{importError}</p>
                                </div>
                            )}

                            {importSuccess && (
                                <div className="mt-3 bg-green-500/10 border border-green-500/20 p-3 rounded-lg flex gap-2">
                                    <AlertCircle size={16} className="text-green-400 shrink-0" />
                                    <p className="text-xs text-green-300">{importSuccess}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleImport}
                                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                            >
                                Import Exercises
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Routine Preview Modal */}
            {previewRoutine && (
                <RoutinePreviewModal
                    routine={previewRoutine}
                    isOpen={!!previewRoutine}
                    onClose={handleClosePreview}
                    onStart={handleStartWorkout}
                    onAddToDashboard={handleAddToDashboard}
                    isAlreadyInDashboard={isPreviewInStore}
                />
            )}
        </div>
    );
};
