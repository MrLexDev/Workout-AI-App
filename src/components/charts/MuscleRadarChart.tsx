import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface MuscleRadarChartProps {
    data: Record<string, number>;
}

export const MuscleRadarChart: React.FC<MuscleRadarChartProps> = ({ data }) => {
    // Ensure we have all groups present even if 0, in a specific order
    const labels = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
    const values = labels.map(label => data[label] || 0);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Effective Sets',
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue-500 optimized visibility
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: {
                    color: 'rgba(148, 163, 184, 0.1)' // Slate-400 very transparent
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)'
                },
                pointLabels: {
                    color: '#94a3b8', // Slate-400
                    font: {
                        size: 11,
                        weight: 600 as const // Force cast because type definition varies
                    }
                },
                ticks: {
                    display: false, // Hide numeric rings to keep it clean, or true if needed
                    backdropColor: 'transparent',
                    color: '#64748b'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    return <Radar data={chartData} options={options} />;
};
