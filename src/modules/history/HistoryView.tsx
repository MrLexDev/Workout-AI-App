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
    Weight
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
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
    const { height, setHeight, weightHistory, addWeightEntry, deleteWeightEntry } = useUserStore();
    const [heightInput, setHeightInput] = useState('');
    const [weightInput, setWeightInput] = useState('');
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);

    // ----- EXERCISE STATS STATE -----
    const { getLogsByExercise } = usePerformanceStore();
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
    const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([]);

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

    // Initialize selected exercise
    useEffect(() => {
        if (!selectedExerciseId && allExercises.length > 0) {
            setSelectedExerciseId(allExercises[0].id);
        }
    }, [allExercises, selectedExerciseId]);

    // Get logs for selected exercise
    const exerciseLogs = useMemo(() => {
        if (!selectedExerciseId) return [];
        return getLogsByExercise(selectedExerciseId);
    }, [selectedExerciseId, getLogsByExercise]);

    // ----- DERIVED DATA (BODY) -----
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
    const bmi = (height && currentWeight)
        ? (currentWeight / ((height / 100) * (height / 100))).toFixed(1)
        : null;

    // ----- CHART DATA (BODY) -----
    const bodyChartData = useMemo(() => {
        const sortedHistory = [...weightHistory].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return {
            labels: sortedHistory.map(entry => new Date(entry.date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Weight (kg)',
                    data: sortedHistory.map(entry => entry.weight),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    tension: 0.3,
                },
            ],
        };
    }, [weightHistory]);

    // ----- CHART DATA (EXERCISE) -----
    const exerciseChartData = useMemo(() => {
        // Logs are already sorted by timestamp in getLogsByExercise
        return {
            labels: exerciseLogs.map(log => new Date(log.timestamp).toLocaleDateString()),
            datasets: [
                {
                    label: '1 Rep Max (Estimated)',
                    data: exerciseLogs.map(log => log.oneRepMax),
                    borderColor: 'rgb(168, 85, 247)', // Purple-500
                    backgroundColor: 'rgba(168, 85, 247, 0.5)',
                    tension: 0.3,
                },
                {
                    label: 'Lifted Weight',
                    data: exerciseLogs.map(log => log.weight),
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
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const handleSaveHeight = () => {
        const h = parseFloat(heightInput);
        if (!isNaN(h) && h > 0) {
            setHeight(h);
        }
    };

    const handleAddWeight = () => {
        const w = parseFloat(weightInput);
        if (!isNaN(w) && w > 0 && dateInput) {
            addWeightEntry(w, dateInput);
            setWeightInput('');
        }
    };

    // ----- RENDER LOADING / SETUP -----
    if (!height) {
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
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                    />
                    <button
                        onClick={handleSaveHeight}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 pb-20 animate-in fade-in duration-500">
            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-900 mx-4 mt-4 rounded-xl mb-6 border border-slate-800">
                <button
                    onClick={() => setHistoryTab('body')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${historyTab === 'body'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <User size={16} />
                    Body Stats
                </button>
                <button
                    onClick={() => setHistoryTab('exercises')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${historyTab === 'exercises'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Activity size={16} />
                    Performance
                </button>
                <button
                    onClick={() => setHistoryTab('workouts')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${historyTab === 'workouts'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
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
                                <span className="text-2xl font-bold text-white">{currentWeight || '--'}</span>
                                <span className="text-xs text-slate-500">kg</span>
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
                        <div className="bg-slate-800 p-4 rounded-xl space-y-1">
                            <span className="text-xs text-slate-400 font-medium uppercase">Height</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-white">{height}</span>
                                <span className="text-xs text-slate-500">cm</span>
                            </div>
                        </div>
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
                                    <span className="text-slate-500 text-sm">kg</span>
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
                        <div className="h-64 w-full">
                            {weightHistory.length > 1 ? (
                                <Line options={chartOptions} data={bodyChartData} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                    Add at least 2 entries to see the graph
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History List */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-white px-1">History</h3>
                        <div className="space-y-2">
                            {weightHistory.map((entry) => (
                                <div key={entry.id} className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-900 p-2 rounded text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{entry.weight} kg</p>
                                            <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteWeightEntry(entry.id)}
                                        className="text-slate-500 hover:text-red-400 p-2 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {weightHistory.length === 0 && (
                                <div className="text-center text-slate-500 py-4">
                                    No weight entries yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {historyTab === 'exercises' && (
                // EXERCISE STATS VIEW
                <div className="space-y-6 px-4">
                    {/* Exercise Selector */}
                    <div className="bg-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium uppercase tracking-wider">
                            <Dumbbell className="w-4 h-4 text-purple-500" />
                            Select Exercise
                        </div>
                        <div className="relative">
                            <select
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-purple-500 outline-none"
                                value={selectedExerciseId}
                                onChange={(e) => setSelectedExerciseId(e.target.value)}
                            >
                                {allExercises.map(ex => (
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
                                        {Math.max(...exerciseLogs.map(l => l.oneRepMax)).toFixed(1)}
                                    </span>
                                    <span className="text-xs text-slate-500">kg</span>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl space-y-1 border border-slate-700">
                                <span className="text-xs text-slate-400 font-medium uppercase">Heaviest Lift</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-teal-400">
                                        {Math.max(...exerciseLogs.map(l => l.weight))}
                                    </span>
                                    <span className="text-xs text-slate-500">kg</span>
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
                                                <span className="font-bold text-white text-lg">{log.weight}kg</span>
                                                <span className="text-slate-500 text-sm">x {log.reps}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">1RM Est.</div>
                                        <div className="text-purple-400 font-bold">{log.oneRepMax.toFixed(1)} kg</div>
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
            )}

            {historyTab === 'workouts' && (
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
                                        {session.logs.reduce((acc, log) => acc + (log.weight * log.reps), 0).toLocaleString()} kg
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
                                                    <div className="text-slate-500 text-[10px]">Best: {bestSet.weight}kg</div>
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
            )}
        </div>
    );
};
