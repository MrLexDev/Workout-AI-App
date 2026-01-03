import React, { useMemo, useState, useEffect } from 'react';
import { useNativeBack } from '../../hooks/useNativeBack';
import { type ExerciseDefinition, type Routine } from '../../types/workout';
import exerciseData from '../../data/exercises.json';
import { exerciseStorageService } from '../../services/storage/ExerciseStorageService';
import { Dumbbell, Search, ChevronDown, ChevronUp, Download, X, AlertCircle, Filter, Eye, EyeOff, Trash2, BookOpen } from 'lucide-react';
import { useWorkoutStore } from '../../store/workoutStore';
import initialRoutinesData from '../../data/initialRoutines.json';
import { RoutinePreviewModal } from './RoutinePreviewModal';

interface ExerciseLibraryProps {
    onViewInstructions?: (exercise: ExerciseDefinition) => void;
}

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ onViewInstructions }) => {
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

    // --- Hide/Delete State ---
    const [hiddenExerciseIds, setHiddenExerciseIds] = useState<Set<string>>(new Set());

    // Load hidden IDs on mount
    useEffect(() => {
        const loadedHidden = exerciseStorageService.loadHiddenExercises();
        setHiddenExerciseIds(new Set(loadedHidden));
    }, []);

    const toggleHide = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(hiddenExerciseIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setHiddenExerciseIds(newSet);
        exerciseStorageService.saveHiddenExercises(Array.from(newSet));
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this exercise permanently?')) {
            const newCustom = customExercises.filter(ex => ex.id !== id);
            setCustomExercises(newCustom);
            exerciseStorageService.saveCustomExercises(newCustom);
        }
    };

    // --- Filters State ---
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
    const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
    const [selectedSource, setSelectedSource] = useState<'All' | 'Default' | 'User'>('All');
    const [showHidden, setShowHidden] = useState(false);

    // Derive detailed filter options from all exercises
    const { allMuscles, allEquipment, defaultExerciseIds } = useMemo(() => {
        const muscles = new Set<string>();
        const equipment = new Set<string>();
        const defaultIds = new Set<string>();

        // Identify default IDs from the static JSON file directly
        const staticData = exerciseData as ExerciseDefinition[];
        staticData.forEach(ex => defaultIds.add(ex.id));

        allExercises.forEach(ex => {
            ex.targetMuscles.primary.forEach(m => muscles.add(m));
            // Secondary muscles
            ex.targetMuscles.secondary.forEach(m => muscles.add(m));

            // Equipment list
            ex.equipmentList.forEach(eq => equipment.add(eq.trim()));
        });

        return {
            allMuscles: Array.from(muscles).sort(),
            allEquipment: Array.from(equipment).sort(),
            defaultExerciseIds: defaultIds
        };
    }, [allExercises]);

    // Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    // Back Handler for Import Modal and Internal Tabs
    useNativeBack(() => {
        if (isImportModalOpen) {
            setIsImportModalOpen(false);
            return true;
        }
        if (activeTab === 'routines') {
            setActiveTab('exercises');
            return true;
        }
        return false;
    }, [isImportModalOpen, activeTab]);

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    // Filter based on search results AND selected filters
    const filteredExercises = useMemo(() => {
        let result = allExercises;

        // 1. Search Query
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(ex =>
                ex.name.toLowerCase().includes(lowerQuery) ||
                ex.targetMuscles.primary.some(m => m.toLowerCase().includes(lowerQuery)) ||
                ex.targetMuscles.secondary.some(m => m.toLowerCase().includes(lowerQuery)) ||
                ex.equipmentList.some(eq => eq.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Source Filter
        if (selectedSource === 'Default') {
            result = result.filter(ex => defaultExerciseIds.has(ex.id));
        } else if (selectedSource === 'User') {
            result = result.filter(ex => !defaultExerciseIds.has(ex.id));
        }

        // 3. Muscle Filter
        if (selectedMuscle !== 'All') {
            result = result.filter(ex =>
                ex.targetMuscles.primary.includes(selectedMuscle as any) ||
                ex.targetMuscles.secondary.includes(selectedMuscle as any)
            );
        }

        // 4. Equipment Filter
        if (selectedEquipment !== 'All') {
            // Check if exact match or contained
            result = result.filter(ex => ex.equipmentList.includes(selectedEquipment));
        }

        // 5. Hide/Show Logic
        if (!showHidden) {
            result = result.filter(ex => !hiddenExerciseIds.has(ex.id));
        }

        return result;
    }, [allExercises, searchQuery, selectedSource, selectedMuscle, selectedEquipment, defaultExerciseIds, hiddenExerciseIds, showHidden]);

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

                {/* Search Bar & Filters - Only for Exercises currently */}
                {activeTab === 'exercises' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder={`Search ${filteredExercises.length} exercises...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${isFilterExpanded || selectedMuscle !== 'All' || selectedEquipment !== 'All' || selectedSource !== 'All'
                                    ? 'text-blue-400 bg-blue-500/10'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                            >
                                <Filter size={18} />
                            </button>
                        </div>

                        {/* Expandable Filter Panel */}
                        {isFilterExpanded && (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-200">

                                {/* Source Filter */}
                                <div className="col-span-2 flex p-1 bg-slate-900/50 rounded-lg border border-slate-800">
                                    {['All', 'Default', 'User'].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setSelectedSource(option as any)}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedSource === option
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>

                                {/* Muscle Selector */}
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1">Muscle</label>
                                    <div className="relative">
                                        <select
                                            value={selectedMuscle}
                                            onChange={(e) => setSelectedMuscle(e.target.value)}
                                            className="w-full appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="All">All Muscles</option>
                                            {allMuscles.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Equipment Selector */}
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider ml-1">Equipment</label>
                                    <div className="relative">
                                        <select
                                            value={selectedEquipment}
                                            onChange={(e) => setSelectedEquipment(e.target.value)}
                                            className="w-full appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="All">All Equipment</option>
                                            {allEquipment.map(eq => (
                                                <option key={eq} value={eq}>{eq}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Show Hidden Toggle */}
                                <div className="col-span-2 flex items-center justify-between p-2 bg-slate-900/30 rounded-lg border border-slate-800">
                                    <span className="text-xs text-slate-400 font-medium ml-1">Show Hidden Exercises</span>
                                    <button
                                        onClick={() => setShowHidden(!showHidden)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showHidden ? 'bg-blue-600' : 'bg-slate-700'}`}
                                    >
                                        <span
                                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out"
                                            style={{ transform: showHidden ? 'translateX(24px)' : 'translateX(4px)' }}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
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
                                            <div className="flex-1 opacity-100">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-bold text-base ${hiddenExerciseIds.has(ex.id) ? 'text-slate-500 line-through' : 'text-white'}`}>{ex.name}</h3>
                                                    {hiddenExerciseIds.has(ex.id) && (
                                                        <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded border border-slate-600">Hidden</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20">
                                                        {ex.targetMuscles.primary[0]}
                                                    </span>
                                                    <span className="text-xs text-slate-500 truncate">
                                                        {ex.equipmentList.join(', ')}
                                                    </span>
                                                </div>

                                            </div>

                                            <div className="flex items-center gap-1">
                                                {/* Hide/Unhide Button */}
                                                <button
                                                    onClick={(e) => toggleHide(ex.id, e)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                                                    title={hiddenExerciseIds.has(ex.id) ? "Unhide" : "Hide"}
                                                >
                                                    {hiddenExerciseIds.has(ex.id) ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>

                                                {/* Delete Button (Only for User exercises) */}
                                                {!defaultExerciseIds.has(ex.id) && (
                                                    <button
                                                        onClick={(e) => handleDelete(ex.id, e)}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}

                                                <button className="text-slate-500 p-1 ml-1" onClick={(e) => { e.stopPropagation(); toggleExpand(ex.id); }}>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details - REFACTORED to minimal info as instructions moved */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-0 border-t border-slate-700/50 bg-slate-900/30">
                                                <div className="mt-4 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Targets</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {ex.targetMuscles.primary.map((m, i) => (
                                                                <span key={`p-${i}`} className="text-xs font-bold text-blue-300 bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                                    {m}
                                                                </span>
                                                            ))}
                                                            {ex.targetMuscles.secondary.map((m, i) => (
                                                                <span key={`s-${i}`} className="text-xs text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                                                    {m}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Equipment</span>
                                                        <span className="text-xs text-white">{ex.equipmentList.join(', ')}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onViewInstructions) onViewInstructions(ex);
                                                        }}
                                                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg border border-indigo-500/30 transition-colors"
                                                    >
                                                        <BookOpen size={14} />
                                                        How to do
                                                    </button>
                                                </div>
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
