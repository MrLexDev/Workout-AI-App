import { useState, useMemo } from 'react';
import { useUserStore } from '../../store/userStore';
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
import { Ruler, Weight, Calendar, Trash2 } from 'lucide-react';

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
    const { height, setHeight, weightHistory, addWeightEntry, deleteWeightEntry } = useUserStore();

    // Local state for forms
    const [heightInput, setHeightInput] = useState('');
    const [weightInput, setWeightInput] = useState('');
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]); // Default today

    // Derived state
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
    const bmi = (height && currentWeight)
        ? (currentWeight / ((height / 100) * (height / 100))).toFixed(1)
        : null;

    // Chart Data
    const chartData = useMemo(() => {
        // Create a copy and sort purely by date ascending for the chart
        const sortedHistory = [...weightHistory].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return {
            labels: sortedHistory.map(entry => new Date(entry.date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Weight (kg)',
                    data: sortedHistory.map(entry => entry.weight),
                    borderColor: 'rgb(59, 130, 246)', // Blue-500
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    tension: 0.3,
                },
            ],
        };
    }, [weightHistory]);

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Weight Evolution',
                color: '#94a3b8' // Slate-400
            },
        },
        scales: {
            y: {
                grid: {
                    color: '#334155' // Slate-700
                },
                ticks: {
                    color: '#94a3b8'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#94a3b8'
                }
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
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
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
                <div className="h-64 w-full">
                    {weightHistory.length > 1 ? (
                        <Line options={chartOptions} data={chartData} />
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
    );
};
