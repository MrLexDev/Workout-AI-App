import { useState, useMemo, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { usePerformanceStore } from '../../store/performanceStore';
import { exerciseStorageService } from '../../services/storage/ExerciseStorageService';
import exerciseData from '../../data/exercises.json';
import { type ExerciseDefinition } from '../../types/workout';
import { useWorkoutHistoryStore } from '../../store/workoutHistoryStore';
import {
    Calendar,
    Trash2,
    Dumbbell,
    Activity,
    User,
    ChevronDown,
    Clock,
    BarChart,
    Ruler,
    Weight,
    History,
    ChevronLeft,
    Target,
    Edit3,
    Check,
    AlertCircle,
    Search,
    TrendingUp
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import { MuscleRadarChart } from '../../components/charts/MuscleRadarChart';
import { calculateMuscleVolume, groupMuscleScores } from '../../utils/muscleAnalysis';
import { VolumeStatsView } from './VolumeStatsView';
import { DateWheelPicker } from '../../components/inputs/DateWheelPicker';
import { useNativeBack } from '../../hooks/useNativeBack';
import { useWeight } from '../../hooks/useWeight';

import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export const HistoryView = () => {
    // ----- TAB STATE -----
    const [historyTab, setHistoryTab] = useState<'body' | 'exercises' | 'workouts'>('body');

    // ----- WORKOUT HISTORY STATE -----
    const { sessions, deleteSession } = useWorkoutHistoryStore();

    // ----- BODY STATS STATE -----
    const {
        height, setHeight, weightHistory, addWeightEntry, deleteWeightEntry,
        gender, setGender, birthDate, setBirthDate,
        availableEquipment, setAvailableEquipment,
        objective, setObjective,
        specialConsiderations, setSpecialConsiderations,
        equipmentSelectionMode, setEquipmentSelectionMode
    } = useUserStore();
    const { displayWeight, toKg, unitLabel } = useWeight();
    const [weightInput, setWeightInput] = useState('');
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);

    // ----- PROFILE EDIT STATE -----
    const [editHeight, setEditHeight] = useState('');
    const [editGender, setEditGender] = useState<'male' | 'female' | 'other' | null>(null);
    const [editBirthDate, setEditBirthDate] = useState('');
    const [editEquipment, setEditEquipment] = useState<string[]>([]);
    const [editEquipmentMode, setEditEquipmentMode] = useState<'full_gym' | 'home_gym'>('home_gym');
    const [isEditingObjective, setIsEditingObjective] = useState(false);
    const [objectiveInput, setObjectiveInput] = useState(objective || '');
    const [isEditingConsiderations, setIsEditingConsiderations] = useState(false);
    const [considerationsInput, setConsiderationsInput] = useState(specialConsiderations || '');

    // Sync inputs with store when they change externally
    useEffect(() => {
        setObjectiveInput(objective || '');
    }, [objective]);

    useEffect(() => {
        setConsiderationsInput(specialConsiderations || '');
    }, [specialConsiderations]);

    // ----- EXERCISE STATS STATE -----
    const { getLogsByExercise, preSelectedExerciseId, setPreSelectedExerciseId, logs } = usePerformanceStore();
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [showWithProgressOnly, setShowWithProgressOnly] = useState(false);
    const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([]);
    const [radarRange, setRadarRange] = useState<'7d' | '30d' | 'all'>('7d');

    // Load custom exercises on mount
    useEffect(() => {
        setCustomExercises(exerciseStorageService.loadCustomExercises());
    }, []);

    // Merge static and custom exercises for the selector
    const allExercises = useMemo(() => {
        const map = new Map<string, ExerciseDefinition>();
        (exerciseData as ExerciseDefinition[]).forEach(ex => map.set(ex.id, ex));
        customExercises.forEach(ex => map.set(ex.id, ex));
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [customExercises]);

    // Initialize selected exercise or handle redirect
    useEffect(() => {
        if (preSelectedExerciseId) {
            // Check validity
            const exists = allExercises.some(e => e.id === preSelectedExerciseId);
            if (exists) {
                setSelectedExerciseId(preSelectedExerciseId);
                setHistoryTab('exercises');
            }
            // Consumed
            setPreSelectedExerciseId(null);
        } else if (!selectedExerciseId && allExercises.length > 0) {
            setSelectedExerciseId(allExercises[0].id);
        }
    }, [allExercises, selectedExerciseId, preSelectedExerciseId, setPreSelectedExerciseId]);

    // Identify exercises with >= 2 logs (sufficient for chart)
    const exercisesWithProgress = useMemo(() => {
        const counts = new Map<string, number>();
        logs.forEach(log => {
            counts.set(log.exerciseId, (counts.get(log.exerciseId) || 0) + 1);
        });
        const set = new Set<string>();
        counts.forEach((count, id) => {
            if (count >= 2) set.add(id);
        });
        return set;
    }, [logs]);

    // Filter exercises based on search and progress availability
    const filteredExercises = useMemo(() => {
        let result = allExercises;

        // 1. Search Query
        if (exerciseSearch.trim()) {
            const lower = exerciseSearch.toLowerCase();
            result = result.filter(ex => ex.name.toLowerCase().includes(lower));
        }

        // 2. Progress Filter
        if (showWithProgressOnly) {
            result = result.filter(ex => exercisesWithProgress.has(ex.id));
        }

        return result;
    }, [allExercises, exerciseSearch, showWithProgressOnly, exercisesWithProgress]);

    // Get logs for selected exercise
    const exerciseLogs = useMemo(() => {
        if (!selectedExerciseId) return [];
        return getLogsByExercise(selectedExerciseId);
    }, [selectedExerciseId, getLogsByExercise]);

    // Derive Unique Equipment List
    const allEquipment = useMemo(() => {
        const equipment = new Set<string>();
        allExercises.forEach(ex => {
            ex.equipmentList.forEach(eq => equipment.add(eq.trim()));
        });
        return Array.from(equipment).sort();
    }, [allExercises]);



    // ----- RADAR CHART DATA -----
    const muscleRadarData = useMemo(() => {
        const scores = calculateMuscleVolume(sessions, allExercises, radarRange);
        return groupMuscleScores(scores);
    }, [sessions, allExercises, radarRange]);

    // ----- DERIVED DATA (BODY) -----
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
    const bmi = (height && currentWeight)
        ? (currentWeight / ((height / 100) * (height / 100))).toFixed(1)
        : null;

    const age = useMemo(() => {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();
        let a = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            a--;
        }
        return a;
    }, [birthDate]);

    // ----- CHART DATA (BODY) -----
    // ----- CHART DATA (BODY) -----
    const bodyChartData = useMemo(() => {
        const sortedHistory = [...weightHistory].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return {
            datasets: [
                {
                    label: `Weight (${unitLabel})`,
                    data: sortedHistory.map(entry => ({ x: entry.date, y: displayWeight(entry.weight) })),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    tension: 0.3,
                },
            ],
        };
    }, [weightHistory]);

    // ----- CHART DATA (EXERCISE) -----
    // ----- CHART DATA (EXERCISE) -----
    const exerciseChartData = useMemo(() => {
        // Logs are already sorted by timestamp in getLogsByExercise
        return {
            datasets: [
                {
                    label: '1 Rep Max (Estimated)',
                    data: exerciseLogs.map(log => ({ x: log.timestamp, y: displayWeight(log.oneRepMax) })),
                    borderColor: 'rgb(168, 85, 247)', // Purple-500
                    backgroundColor: 'rgba(168, 85, 247, 0.5)',
                    tension: 0.3,
                },
                {
                    label: 'Lifted Weight',
                    data: exerciseLogs.map(log => ({ x: log.timestamp, y: displayWeight(log.weight) })),
                    borderColor: 'rgb(94, 234, 212)', // Teal-300
                    backgroundColor: 'rgba(94, 234, 212, 0.5)',
                    borderDash: [5, 5],
                    tension: 0.3,
                }
            ],
        };
    }, [exerciseLogs]);

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: {
                display: false, // Custom legend or hide
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: {
                        day: 'MMM d'
                    }
                },
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const handleSaveProfile = () => {
        const h = parseFloat(editHeight);
        if (!isNaN(h) && h > 0) {
            setHeight(h);
        }
        setGender(editGender);
        setBirthDate(editBirthDate || null);
        setAvailableEquipment(editEquipment);
        setEquipmentSelectionMode(editEquipmentMode);
        setView('overview');
    };

    const handleAddWeight = () => {
        const w = parseFloat(weightInput);
        if (!isNaN(w) && w > 0 && dateInput) {
            addWeightEntry(toKg(w), dateInput);
            setWeightInput('');
        }
    };

    const handleSaveObjective = () => {
        setObjective(objectiveInput);
        setIsEditingObjective(false);
    };

    const handleSaveConsiderations = () => {
        setSpecialConsiderations(considerationsInput);
        setIsEditingConsiderations(false);
    };

    // ----- VIEW STATE -----
    const [view, setView] = useState<'overview' | 'volume' | 'weightHistory' | 'profile'>('overview');

    useNativeBack(() => {
        if (view !== 'overview') {
            setView('overview');
            return true;
        }
        return false;
    }, [view]);

    // Initialize profile edit state when opening profile view
    useEffect(() => {
        setEditHeight(height ? height.toString() : '');
        setEditGender(gender);
        setEditBirthDate(birthDate || '');
        setEditEquipment(availableEquipment || []);
        setEditEquipmentMode(equipmentSelectionMode);
    }, [view, height, gender, birthDate, availableEquipment, equipmentSelectionMode]);

    // ... (existing helper functions) ...

    if (!height) {
        // ... (existing setup view) ...
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in fade-in duration-500">
                <div className="bg-slate-800 p-4 rounded-full">
                    <Ruler className="w-12 h-12 text-blue-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Welcome to History</h2>
                    <p className="text-slate-400">Let's start by setting up your profile. How tall are you?</p>
                </div>

                <div className="flex gap-2 w-full max-w-xs">
                    <input
                        type="number"
                        placeholder="Height (cm)"
                        className="flex-1 bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        value={editHeight}
                        onChange={(e) => setEditHeight(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            const h = parseFloat(editHeight);
                            if (!isNaN(h) && h > 0) {
                                setHeight(h);
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'profile') {
        return (
            <div className="flex flex-col min-h-full bg-slate-950 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4 p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                    <button
                        onClick={() => setView('overview')}
                        className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-500" />
                        Personal Details
                    </h2>
                </div>

                <div className="p-4 space-y-6">
                    {/* Height */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Height (cm)</label>
                        <input
                            type="number"
                            placeholder="175"
                            className="w-full bg-slate-800 border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editHeight}
                            onChange={(e) => setEditHeight(e.target.value)}
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Gender</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['male', 'female', 'other'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setEditGender(g)}
                                    className={`py-3 rounded-xl border font-medium capitalize transition-all ${editGender === g
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                        }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Equipment Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-400">Available Equipment</label>

                        {/* Mode Toggle */}
                        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 mb-2">
                            <button
                                onClick={() => {
                                    if (editEquipmentMode !== 'full_gym') {
                                        setEditEquipmentMode('full_gym');
                                    }
                                }}
                                className={`flex-1 flex flex-col items-center py-2 rounded-lg text-xs font-bold transition-all ${editEquipmentMode === 'full_gym'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                <span className="uppercase tracking-wide">Full Gym</span>
                                <span className="text-[10px] opacity-80 font-normal normal-case">Exceptions only</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (editEquipmentMode !== 'home_gym') {
                                        setEditEquipmentMode('home_gym');
                                    }
                                }}
                                className={`flex-1 flex flex-col items-center py-2 rounded-lg text-xs font-bold transition-all ${editEquipmentMode === 'home_gym'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                <span className="uppercase tracking-wide">Home Gym</span>
                                <span className="text-[10px] opacity-80 font-normal normal-case">Select items</span>
                            </button>
                        </div>

                        {/* Helper Text */}
                        <div className="px-1 text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">
                            {editEquipmentMode === 'full_gym' ? 'Full Gym Except...' : 'Which includes...'}
                        </div>

                        {/* Selection Grid */}
                        <div className="grid grid-cols-2 gap-2 p-1 max-h-[40vh] overflow-y-auto">
                            {allEquipment.map(eq => {
                                const isAvailable = editEquipment.includes(eq);

                                // In Full Gym mode:
                                // We show what is EXCLUDED in RED.
                                // If it is available (isAvailable=true), it is NOT selected (visually neutral).
                                // If it is NOT available (isAvailable=false), it IS selected as an exception (Red).
                                const isExcluded = !isAvailable;

                                // In Home Gym mode:
                                // We show what is INCLUDED in Blue.
                                // If it is available (isAvailable=true), it IS selected (Blue).

                                if (editEquipmentMode === 'full_gym') {
                                    return (
                                        <button
                                            key={eq}
                                            onClick={() => {
                                                if (isAvailable) {
                                                    // User clicks to EXCLUDE it. Remove from available list.
                                                    setEditEquipment(prev => prev.filter(e => e !== eq));
                                                } else {
                                                    // User clicks to INCLUDE it (remove exception). Add to available list.
                                                    setEditEquipment(prev => [...prev, eq]);
                                                }
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border ${isExcluded
                                                ? 'bg-red-500/10 border-red-500 text-red-200'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="truncate">{eq}</span>
                                                {isExcluded && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                                            </div>
                                        </button>
                                    );
                                } else {
                                    // Home Gym Mode
                                    return (
                                        <button
                                            key={eq}
                                            onClick={() => {
                                                if (isAvailable) {
                                                    // User clicks to REMOVE.
                                                    setEditEquipment(prev => prev.filter(e => e !== eq));
                                                } else {
                                                    // User clicks to ADD.
                                                    setEditEquipment(prev => [...prev, eq]);
                                                }
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border ${isAvailable
                                                ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="truncate">{eq}</span>
                                                {isAvailable && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                            </div>
                                        </button>
                                    );
                                }
                            })}
                        </div>
                    </div>


                    {/* Birth Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Date of Birth</label>
                        <div className="flex justify-center py-2">
                            <DateWheelPicker
                                value={editBirthDate}
                                onChange={(val) => setEditBirthDate(val)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all mt-8"
                    >
                        Save Details
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'volume') {
        return <VolumeStatsView onBack={() => setView('overview')} />;
    }

    if (view === 'weightHistory') {
        return (
            <div className="flex flex-col h-full bg-slate-950 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4 p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                    <button
                        onClick={() => setView('overview')}
                        className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-500" />
                        Weight History
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {weightHistory.map((entry) => (
                        <div key={entry.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700/50">
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-900 p-3 rounded-lg text-blue-500">
                                    <Weight className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg">{displayWeight(entry.weight)} {unitLabel}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(entry.date).toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteWeightEntry(entry.id)}
                                className="text-slate-500 hover:text-red-400 p-3 hover:bg-slate-700/50 rounded-lg transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    {weightHistory.length === 0 && (
                        <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-3">
                            <div className="bg-slate-900 p-4 rounded-full">
                                <History className="w-8 h-8 text-slate-700" />
                            </div>
                            <p>No weight entries recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-slate-950 pb-20 animate-in fade-in duration-500">
            {/* Tab Switcher */}
            <div className="flex w-full border-b border-slate-800 mb-6 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
                <button
                    onClick={() => setHistoryTab('body')}
                    className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${historyTab === 'body'
                        ? 'border-blue-500 text-blue-500'
                        : 'border-transparent text-slate-500 hover:text-white'
                        }`}
                >
                    <User size={16} />
                    Body Stats
                </button>
                <button
                    onClick={() => setHistoryTab('exercises')}
                    className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${historyTab === 'exercises'
                        ? 'border-blue-500 text-blue-500'
                        : 'border-transparent text-slate-500 hover:text-white'
                        }`}
                >
                    <Activity size={16} />
                    Performance
                </button>
                <button
                    onClick={() => setHistoryTab('workouts')}
                    className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${historyTab === 'workouts'
                        ? 'border-blue-500 text-blue-500'
                        : 'border-transparent text-slate-500 hover:text-white'
                        }`}
                >
                    <BarChart size={16} />
                    Workouts
                </button>
            </div>

            {historyTab === 'body' && (
                // BODY STATS VIEW
                <div className="space-y-6 px-4">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-800 p-4 rounded-xl space-y-1">
                            <span className="text-xs text-slate-400 font-medium uppercase">Current</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-white">{currentWeight ? displayWeight(currentWeight) : '--'}</span>
                                <span className="text-xs text-slate-500">{unitLabel}</span>
                            </div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl space-y-1">
                            <span className="text-xs text-slate-400 font-medium uppercase">BMI</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-bold ${!bmi ? 'text-white' :
                                    parseFloat(bmi) < 18.5 ? 'text-yellow-500' :
                                        parseFloat(bmi) < 25 ? 'text-green-500' :
                                            parseFloat(bmi) < 30 ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                    {bmi || '--'}
                                </span>
                            </div>
                        </div>
                        <div
                            onClick={() => setView('profile')}
                            className="bg-slate-800 p-4 rounded-xl space-y-1 cursor-pointer hover:bg-slate-700 transition-colors ring-1 ring-inset ring-transparent hover:ring-slate-600"
                        >
                            <span className="text-xs text-slate-400 font-medium uppercase flex items-center gap-1">
                                Bio <ChevronLeft className="w-3 h-3 rotate-180 ml-auto" />
                            </span>
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-white">{height}</span>
                                    <span className="text-xs text-slate-500">cm</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                    <span>{gender || '---'}</span>
                                    {age !== null && (
                                        <>
                                            <span className="text-slate-700">•</span>
                                            <span>{age}Y</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Objective */}
                    <div className="bg-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-400" />
                                Current Objective
                            </h3>
                            {!isEditingObjective ? (
                                <button
                                    onClick={() => setIsEditingObjective(true)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                                >
                                    <Edit3 size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSaveObjective}
                                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all"
                                >
                                    <Check size={18} />
                                </button>
                            )}
                        </div>

                        {isEditingObjective ? (
                            <div className="space-y-2 animate-in fade-in duration-200">
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] text-sm resize-none"
                                    placeholder="Set your fitness goal in your own words..."
                                    value={objectiveInput}
                                    onChange={(e) => setObjectiveInput(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsEditingObjective(false);
                                            setObjectiveInput(objective || '');
                                        }}
                                        className="text-[10px] uppercase tracking-wider font-bold text-slate-500 hover:text-slate-300 px-2 py-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveObjective}
                                        className="text-[10px] uppercase tracking-wider font-bold text-blue-400 hover:text-blue-300 px-2 py-1"
                                    >
                                        Save Goal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[40px] flex items-center">
                                {objective ? (
                                    <p className="text-sm text-slate-200 italic leading-relaxed">
                                        "{objective}"
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">
                                        No objective set yet. Click edit to define your fitness goal.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Special Considerations */}
                    <div className="bg-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                Special Considerations
                            </h3>
                            {!isEditingConsiderations ? (
                                <button
                                    onClick={() => setIsEditingConsiderations(true)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                                >
                                    <Edit3 size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSaveConsiderations}
                                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all"
                                >
                                    <Check size={18} />
                                </button>
                            )}
                        </div>

                        {isEditingConsiderations ? (
                            <div className="space-y-2 animate-in fade-in duration-200">
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none min-h-[80px] text-sm resize-none"
                                    placeholder="Add any injuries, limitations, or specific focus areas..."
                                    value={considerationsInput}
                                    onChange={(e) => setConsiderationsInput(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsEditingConsiderations(false);
                                            setConsiderationsInput(specialConsiderations || '');
                                        }}
                                        className="text-[10px] uppercase tracking-wider font-bold text-slate-500 hover:text-slate-300 px-2 py-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveConsiderations}
                                        className="text-[10px] uppercase tracking-wider font-bold text-amber-500 hover:text-amber-400 px-2 py-1"
                                    >
                                        Save Details
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[40px] flex items-center">
                                {specialConsiderations ? (
                                    <p className="text-sm text-slate-200 leading-relaxed">
                                        {specialConsiderations}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">
                                        No special considerations added.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Add Weight Form */}
                    <div className="bg-slate-800 p-4 rounded-xl space-y-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Weight className="w-4 h-4 text-blue-400" />
                            Log Weight
                        </h3>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500 text-sm">{unitLabel}</span>
                                </div>
                                <input
                                    type="number"
                                    placeholder="75.5"
                                    className="w-full bg-slate-900 border-slate-700 text-white rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    value={weightInput}
                                    onChange={(e) => setWeightInput(e.target.value)}
                                />
                            </div>
                            <div className="relative w-32">
                                <input
                                    type="date"
                                    className="w-full bg-slate-900 border-slate-700 text-white rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={dateInput}
                                    onChange={(e) => setDateInput(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleAddWeight}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-slate-800 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-400 text-sm">Weight Evolution</h3>
                        </div>
                        <div className="h-64 w-full mb-4">
                            {weightHistory.length > 1 ? (
                                <Line options={chartOptions} data={bodyChartData} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                    Add at least 2 entries to see the graph
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setView('weightHistory')}
                            className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <History size={14} />
                            View Full History
                        </button>
                    </div>

                    {/* Muscle Distribution Radar */}
                    <div
                        className="bg-slate-800 p-4 rounded-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-400 text-sm flex items-center gap-2">
                                <Activity size={16} />
                                Muscle Distribution
                            </h3>
                            <div className="flex bg-slate-900 rounded-lg p-0.5" onClick={e => e.stopPropagation()}>
                                {(['7d', '30d', 'all'] as const).map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setRadarRange(range)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${radarRange === range
                                            ? 'bg-slate-700 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {range === 'all' ? 'All' : range}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-64 w-full pointer-events-none">
                            <MuscleRadarChart data={muscleRadarData} />
                        </div>
                        <button
                            onClick={() => setView('volume')}
                            className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <Activity size={14} />
                            View Detailed Volume
                        </button>
                    </div>

                    <button
                        onClick={() => setView('profile')}
                        className="w-full bg-slate-800 p-4 rounded-xl flex items-center justify-between group hover:bg-slate-700 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-900 p-2 rounded-lg text-blue-500 group-hover:text-blue-400 transition-colors">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-white">Personal Details</h3>
                                <p className="text-sm text-slate-500">Edit gender, height & birth date</p>
                            </div>
                        </div>
                        <ChevronLeft className="text-slate-500 rotate-180 group-hover:text-white transition-colors" />
                    </button>


                </div>
            )}

            {
                historyTab === 'exercises' && (
                    // EXERCISE STATS VIEW
                    <div className="space-y-6 px-4">
                        {/* Exercise Selector */}
                        <div className="bg-slate-800 p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium uppercase tracking-wider">
                                <Dumbbell className="w-4 h-4 text-purple-500" />
                                Select Exercise
                            </div>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search exercise..."
                                    value={exerciseSearch}
                                    onChange={(e) => setExerciseSearch(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            {/* Progress Filter Toggle */}
                            <button
                                onClick={() => setShowWithProgressOnly(!showWithProgressOnly)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all mb-2 ${showWithProgressOnly
                                    ? 'bg-purple-500/10 border-purple-500 text-purple-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={14} />
                                    <span>Show only with charts</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full border ${showWithProgressOnly ? 'bg-purple-500 border-purple-500' : 'border-slate-600'}`} />
                            </button>

                            <div className="relative">
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={selectedExerciseId}
                                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                                >
                                    {filteredExercises.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-slate-800 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <h3 className="font-semibold text-slate-200">performance</h3>
                                    <p className="text-xs text-slate-500">1 Rep Max (Estimated) vs Lifted Weight</p>
                                </div>
                            </div>
                            <div className="h-64 w-full">
                                {exerciseLogs.length > 1 ? (
                                    <Line options={chartOptions} data={exerciseChartData} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center px-8">
                                        Complete at least 2 sessions of this exercise to see your progress chart.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Summary */}
                        {exerciseLogs.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800 p-4 rounded-xl space-y-1 border border-slate-700">
                                    <span className="text-xs text-slate-400 font-medium uppercase">Max 1RM</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-purple-400">
                                            {Math.max(...exerciseLogs.map(l => displayWeight(l.oneRepMax))).toFixed(1)}
                                        </span>
                                        <span className="text-xs text-slate-500">{unitLabel}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-800 p-4 rounded-xl space-y-1 border border-slate-700">
                                    <span className="text-xs text-slate-400 font-medium uppercase">Heaviest Lift</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-teal-400">
                                            {Math.max(...exerciseLogs.map(l => displayWeight(l.weight)))}
                                        </span>
                                        <span className="text-xs text-slate-500">{unitLabel}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Log List */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-white px-1">Recent Logs</h3>
                            <div className="space-y-2">
                                {[...exerciseLogs].reverse().map((log) => (
                                    <div key={log.id} className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-900 p-2 rounded text-slate-500">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-white text-lg">{displayWeight(log.weight)}{unitLabel}</span>
                                                    <span className="text-slate-500 text-sm">x {log.reps}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">1RM Est.</div>
                                            <div className="text-purple-400 font-bold">{displayWeight(log.oneRepMax).toFixed(1)} {unitLabel}</div>
                                        </div>
                                    </div>
                                ))}
                                {exerciseLogs.length === 0 && (
                                    <div className="text-center text-slate-500 py-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                                        No logs found for this exercise.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                historyTab === 'workouts' && (
                    // WORKOUTS VIEW
                    <div className="space-y-4 px-4">
                        {[...sessions].reverse().map(session => (
                            <div key={session.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-white font-bold">{session.routineSnapshot.name || "Untitled Routine"}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <Calendar size={12} />
                                            <span>{new Date(session.startTime).toLocaleDateString()}</span>
                                            <span className="text-slate-700">•</span>
                                            <Clock size={12} />
                                            <span>{Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteSession(session.id)}
                                        className="text-slate-500 hover:text-red-400 p-2 -mr-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                        <span className="text-slate-500 block mb-1">Total Volume</span>
                                        <span className="text-white font-mono font-bold">
                                            {session.logs.reduce((acc, log) => acc + (displayWeight(log.weight) * log.reps), 0).toLocaleString()} {unitLabel}
                                        </span>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                        <span className="text-slate-500 block mb-1">Rest Efficiency</span>
                                        <span className="text-white font-mono font-bold">
                                            {(() => {
                                                const totalActual = session.restData.reduce((acc, r) => acc + r.actualSeconds, 0);
                                                const totalTarget = session.restData.reduce((acc, r) => acc + r.targetSeconds, 0);
                                                // Handle division by zero
                                                if (totalTarget === 0) return 'N/A';
                                                const diff = totalActual - totalTarget;
                                                const color = diff > 30 ? 'text-red-400' : diff < -30 ? 'text-yellow-400' : 'text-green-400';
                                                const sign = diff > 0 ? '+' : '';
                                                return <span className={color}>{sign}{Math.round(diff)}s vs {Math.round(totalTarget)}s</span>;
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2 border-t border-slate-700/50">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Exercises</div>
                                    {session.routineSnapshot.exercises.map((ex, i) => {
                                        // Calculate best set for summary
                                        const exLogs = session.logs.filter(l => l.exerciseId === ex.exerciseId);
                                        const bestSet = exLogs.reduce((best, curr) => curr.weight > best.weight ? curr : best, { weight: 0, reps: 0 });

                                        return (
                                            <div key={ex.exerciseId + i} className="flex justify-between items-center text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400">{ex.name}</span>
                                                    {/* Averages */}
                                                    {exLogs.length > 0 && (
                                                        <div className="flex gap-3 text-[10px] text-slate-500 font-mono mt-0.5">
                                                            {/* Avg Work */}
                                                            <span>
                                                                Work: {Math.round(exLogs.reduce((acc, l) => acc + (l.duration || 0), 0) / exLogs.length)}s
                                                            </span>
                                                            {/* Avg RIR */}
                                                            {(() => {
                                                                const validRirLogs = exLogs.filter(l => l.rir !== undefined && l.rir !== null);
                                                                if (validRirLogs.length === 0) return null;
                                                                const avgRir = (validRirLogs.reduce((acc, l) => acc + (l.rir || 0), 0) / validRirLogs.length).toFixed(1);
                                                                return (
                                                                    <span className="text-yellow-500/80">
                                                                        RIR: {avgRir}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {/* Avg Rest */}
                                                            {(() => {
                                                                const rests = session.restData.filter(r => r.exerciseId === ex.exerciseId);
                                                                if (rests.length === 0) return null;
                                                                const avgRest = rests.reduce((acc, r) => acc + r.actualSeconds, 0) / rests.length;
                                                                const avgTarget = rests.reduce((acc, r) => acc + r.targetSeconds, 0) / rests.length;

                                                                // Green if under target (good), Red if over (bad)
                                                                const isGood = avgRest <= avgTarget;
                                                                const color = isGood ? 'text-green-500' : 'text-red-400';

                                                                return (
                                                                    <span className={color}>
                                                                        Rest: {Math.round(avgRest)}s
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>

                                                {exLogs.length > 0 ? (
                                                    <div className="text-right">
                                                        <div className="text-slate-200 font-mono text-xs">{exLogs.length} sets</div>
                                                        <div className="text-slate-500 text-[10px]">Best: {displayWeight(bestSet.weight)}{unitLabel}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600 text-xs italic">Skipped</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {sessions.length === 0 && (
                            <div className="text-center py-12">
                                <div className="bg-slate-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity className="text-slate-700" size={32} />
                                </div>
                                <h3 className="text-slate-400 font-bold mb-2">No Workouts Yet</h3>
                                <p className="text-sm text-slate-600">Complete a workout to see it here.</p>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
};
