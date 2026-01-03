import { useMemo, type ReactNode } from 'react';
import { type MuscleVolumeStats } from '../../utils/muscleAnalysis';
import { bodyFront as maleFront } from '../../data/OriginalHichamData/bodyFront';
import { bodyBack as maleBack } from '../../data/OriginalHichamData/bodyBack';
import { bodyFemaleFront } from '../../data/OriginalHichamData/bodyFemaleFront';
import { bodyFemaleBack } from '../../data/OriginalHichamData/bodyFemaleBack';
import { type BodyPart } from '../../data/OriginalHichamData';
import { useUserStore } from '../../store/userStore';

interface MuscleHeatMapProps {
    data: MuscleVolumeStats;
    metric?: 'volume' | 'effectiveReps';
}

export const MuscleHeatMap = ({ data, metric = 'effectiveReps' }: MuscleHeatMapProps) => {
    const gender = useUserStore(state => state.gender);

    // Select assets based on gender
    const isFemale = gender === 'female';
    const bodyFront = isFemale ? bodyFemaleFront : maleFront;
    const bodyBack = isFemale ? bodyFemaleBack : maleBack;

    // Helper to get value for a muscle slug
    const getValueForSlug = (slug: string) => {
        const m = slug.toLowerCase();
        const keysToCheck: string[] = [];

        // Map SVG Slugs to our App's Muscle Groups
        switch (m) {
            case 'chest': keysToCheck.push('Pectoralis Major', 'Upper Chest', 'Lower Chest'); break;
            case 'obliques': keysToCheck.push('Obliques', 'Abs'); break;
            case 'abs': keysToCheck.push('Abs'); break;
            case 'biceps': keysToCheck.push('Biceps'); break;
            case 'triceps': keysToCheck.push('Triceps'); break;
            case 'forearm': keysToCheck.push('Forearms'); break;
            case 'trapezius': keysToCheck.push('Traps', 'Rhomboids', 'Rear Delts'); break;
            case 'upper-back': keysToCheck.push('Traps', 'Rhomboids', 'Latissimus Dorsi'); break;
            case 'lower-back': keysToCheck.push('Lower Back', 'Erectors'); break;
            case 'deltoids': keysToCheck.push('Front Delts', 'Side Delts', 'Rear Delts'); break;
            case 'quadriceps': keysToCheck.push('Quads'); break;
            case 'hamstring': keysToCheck.push('Hamstrings'); break;
            case 'gluteal': keysToCheck.push('Glutes'); break;
            case 'calves': keysToCheck.push('Calves'); break;
            case 'tibialis': keysToCheck.push('Calves'); break;
            case 'adductors': keysToCheck.push('Adductors'); break;
            case 'neck': keysToCheck.push('Traps'); break;
            case 'shoulders': keysToCheck.push('Front Delts', 'Side Delts', 'Rear Delts'); break;
            case 'hand':
            case 'hands': keysToCheck.push('Forearms'); break;
            case 'feet':
            case 'ankle':
            case 'ankles': keysToCheck.push('Calves'); break;
            case 'head':
            case 'hair':
            case 'face':
                break;
            default: keysToCheck.push(slug);
        }

        let total = 0;
        keysToCheck.forEach(key => {
            const muscleData = data[key];
            if (muscleData && muscleData.length > 0) {
                // Sum all data points for the period
                muscleData.forEach(d => {
                    total += metric === 'volume' ? d.volume : d.effectiveReps;
                });
            }
        });
        return total;
    };

    // Calculate max value to normalize
    const maxValue = useMemo(() => {
        let max = 0;
        // Check all potential slugs from our assets
        const allSlugs = new Set([...bodyFront.map(b => b.slug), ...bodyBack.map(b => b.slug)]);
        allSlugs.forEach(s => {
            const v = getValueForSlug(s);
            if (v > max) max = v;
        });
        return max || 1;
    }, [data, metric]);

    const getColor = (slug: string) => {
        const lowerSlug = slug.toLowerCase();
        // Special case for cosmetic parts
        if (['head', 'hair', 'face'].includes(lowerSlug)) return '#d1d5db'; // gray-300

        const value = getValueForSlug(slug);
        const intensity = Math.min(1, value / maxValue);

        if (intensity <= 0) return '#e2e8f0'; // slate-200 for inactive

        // Pure white (inactive-ish) to pure red scaling
        const gb = Math.round(255 * (1 - intensity));
        return `rgb(255, ${gb}, ${gb})`;
    };

    const renderBodyPart = (part: BodyPart) => {
        const fill = getColor(part.slug);
        const paths: ReactNode[] = [];

        if (part.path.common) {
            part.path.common.forEach((d, i) => paths.push(<path key={`${part.slug}-common-${i}`} d={d} fill={fill} stroke="black" strokeWidth="1" />));
        }
        if (part.path.left) {
            part.path.left.forEach((d, i) => paths.push(<path key={`${part.slug}-left-${i}`} d={d} fill={fill} stroke="black" strokeWidth="1" />));
        }
        if (part.path.right) {
            part.path.right.forEach((d, i) => paths.push(<path key={`${part.slug}-right-${i}`} d={d} fill={fill} stroke="black" strokeWidth="1" />));
        }

        return paths;
    };

    // Adjust ViewBox based on model
    // Male: Front X[0-700], Back X[750-1450]
    // Female: Coordinates might differ slightly, but let's start with a standard box for now or adjust if cropped.
    // Based on inspection, Female models are also in similar coordinate ranges but might be scaled differently.
    // Let's assume standard ranges first and refine.
    // Actually, looking at female data, Front X is ~200-500, Y is ~0-1400.
    // Female Front: X range ~100 to ~600.
    // Female Back: X range ~1000 to ~1300.
    // This suggests the female model is positioned differently or smaller.

    // Male ViewBoxes (Proven):
    const maleFrontViewBox = "0 0 700 1450";
    const maleBackViewBox = "750 0 700 1450";

    // Female ViewBoxes (Estimated from raw data inspection):
    // Front: MinX ~80, MaxX ~550 -> Width ~500. Center ~300.
    // Back: MinX ~1050, MaxX ~1300 -> Width ~250?? That seems too narrow.
    // Let's rely on standard centering. 
    // Female Front seems to be around X=300.
    // Female Back seems to be around X=1200.

    // Let's use a safe wide box for female first to see where they land, then user can correct.
    // Or better, let's try to center them.
    // const femaleFrontViewBox = "0 0 600 1500";
    // const femaleBackViewBox = "1000 0 600 1500";

    // To be safe, let's stick to the Male defaults if we can't be sure, 
    // BUT the user specifically asked for female body. The coordinates are definitely different.
    // Re-inspecting female data from file view:
    // Left Hand: X~76. Right Hand: X~590. -> Width ~500. Center ~330.
    // Neck: X~330.
    // So Female Front is centered at X=330.

    // Female Back:
    // Hair: X~1096.
    // Right Hand: X~1430.
    // Neck: X~1130.
    // So Female Back is centered at X=1200.

    // Adjusted Female ViewBoxes:
    const finalFemaleFrontViewBox = "0 -50 700 1550"; // Width 700 to match Back, scaling them equally
    const finalFemaleBackViewBox = "800 -50 700 1550"; // Width 700, starts at 800 (Centers model at 1150)

    const currentFrontViewBox = isFemale ? finalFemaleFrontViewBox : maleFrontViewBox;
    const currentBackViewBox = isFemale ? finalFemaleBackViewBox : maleBackViewBox;

    return (
        <div className="flex flex-row justify-center items-center gap-4 py-4 h-full animate-in fade-in duration-500 overflow-hidden">
            {/* Front View */}
            <div className="h-full w-1/2 relative flex justify-center">
                <svg viewBox={currentFrontViewBox} className="h-full w-auto drop-shadow-lg max-h-[500px]" preserveAspectRatio="xMidYMid meet">
                    {bodyFront.map(part => renderBodyPart(part))}
                </svg>
                <div className="absolute bottom-0 w-full text-center text-xs font-bold text-slate-400">FRONT</div>
            </div>

            {/* Back View */}
            <div className="h-full w-1/2 relative flex justify-center">
                <svg viewBox={currentBackViewBox} className="h-full w-auto drop-shadow-lg max-h-[500px]" preserveAspectRatio="xMidYMid meet">
                    {bodyBack.map(part => renderBodyPart(part))}
                </svg>
                <div className="absolute bottom-0 w-full text-center text-xs font-bold text-slate-400">BACK</div>
            </div>
        </div>
    );
};
