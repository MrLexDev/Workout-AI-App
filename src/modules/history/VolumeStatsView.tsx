import { useState, useMemo } from 'react';
import { ChevronLeft, Info } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useWorkoutHistoryStore } from '../../store/workoutHistoryStore';
import { calculateVolumeStats, MUSCLE_GROUPS } from '../../utils/muscleAnalysis';
import exerciseData from '../../data/exercises.json';
import { exerciseStorageService } from '../../services/storage/ExerciseStorageService';
import { useWeight } from '../../hooks/useWeight';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface VolumeStatsViewProps {
    onBack: () => void;
}

export const VolumeStatsView = ({ onBack }: VolumeStatsViewProps) => {
    const { sessions } = useWorkoutHistoryStore();
    const { displayWeight, unitLabel } = useWeight();
    const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('weekly');
    const [expandedMuscle, setExpandedMuscle] = useState<string | null>(null);

    // Load exercises
    const allExercises = useMemo(() => {
        const custom = exerciseStorageService.loadCustomExercises();
        return [...(exerciseData as any[]), ...custom];
    }, []);

    const volumeData = useMemo(() => {
        return calculateVolumeStats(sessions, allExercises, granularity);
    }, [sessions, allExercises, granularity]);

    // Helper to find group for a muscle
    const getMuscleGroup = (muscle: string) => {
        return Object.entries(MUSCLE_GROUPS).find(([_, members]) => members.includes(muscle) || _ === muscle)?.[0] || 'Other';
    };

    // Muscle groups found in data
    const activeMuscles = useMemo(() => {
        return Object.keys(volumeData).sort();
    }, [volumeData]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
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

    const getChartData = (muscle: string, metric: 'volume' | 'effectiveReps') => {
        const data = volumeData[muscle] || [];
        // Take last 12 points
        const recentData = data.slice(-12);

        return {
            labels: recentData.map(d => {
                const date = new Date(d.date);
                return granularity === 'weekly'
                    ? `${date.getDate()}/${date.getMonth() + 1}`
                    : date.toLocaleDateString('default', { month: 'short' });
            }),
            datasets: [{
                label: metric === 'volume' ? `Volume (${unitLabel})` : 'Effective Reps',
                data: recentData.map(d => metric === 'volume' ? displayWeight(d.volume) : d.effectiveReps),
                backgroundColor: metric === 'volume' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(168, 85, 247, 0.7)',
                borderRadius: 4,
            }]
        };
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-white">Muscle Volume</h2>
                    <p className="text-xs text-slate-500">Track your weekly progress</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Controls */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button
                        onClick={() => setGranularity('weekly')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${granularity === 'weekly'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setGranularity('monthly')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${granularity === 'monthly'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        Monthly
                    </button>
                </div>

                {/* Info Card */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-blue-400">About Effective Reps</h4>
                        <p className="text-xs text-blue-200/70 leading-relaxed">
                            "Effective Reps" are the ones that stimulate growth, usually the last 5 reps before failure.
                            We calculate this based on your RIR (Reps in Reserve).
                            <br />
                            <span className="opacity-50 mt-1 block">Formula: Min(Reps, 5 - RIR)</span>
                        </p>
                    </div>
                </div>

                {/* Muscle List */}
                <div className="space-y-4">
                    {activeMuscles.map(muscle => {
                        const isExpanded = expandedMuscle === muscle;
                        const data = volumeData[muscle];
                        const lastPoint = data[data.length - 1];
                        const group = getMuscleGroup(muscle);

                        return (
                            <div key={muscle} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => setExpandedMuscle(isExpanded ? null : muscle)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/80 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-8 rounded-full ${group === 'Chest' ? 'bg-blue-500' :
                                            group === 'Back' ? 'bg-purple-500' :
                                                group === 'Legs' ? 'bg-teal-500' :
                                                    group === 'Shoulders' ? 'bg-orange-500' :
                                                        group === 'Arms' ? 'bg-pink-500' : 'bg-slate-500'
                                            }`} />
                                        <div className="text-left">
                                            <h3 className="font-bold text-white">{muscle}</h3>
                                            <div className="text-xs text-slate-500 flex gap-2">
                                                <span>Last: {Math.round(displayWeight(lastPoint?.volume || 0)).toLocaleString()}{unitLabel}</span>
                                                <span>•</span>
                                                <span>{Math.round(lastPoint?.effectiveReps || 0)} eff. reps</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronLeft
                                        className={`text-slate-500 transition-transform duration-300 ${isExpanded ? '-rotate-90' : 'rotate-180'}`}
                                        size={20}
                                    />
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="p-4 pt-0 border-t border-slate-800/50 animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Volume Load</h4>
                                                <Bar data={getChartData(muscle, 'volume')} options={chartOptions} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Effective Reps</h4>
                                                <Bar data={getChartData(muscle, 'effectiveReps')} options={chartOptions} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {activeMuscles.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No volume data found for the selected period.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
