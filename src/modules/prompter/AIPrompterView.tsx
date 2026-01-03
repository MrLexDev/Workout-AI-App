import { useState, useMemo } from 'react';
import { Sparkles, Copy, FileJson, Check, Settings, History, User, Target, CheckCircle } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useWorkoutHistoryStore } from '../../store/workoutHistoryStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { generateCoachPrompt, type PromptOptions } from '../../utils/promptHelpers';
import { workoutStorageService } from '../../services/storage/WorkoutStorageService';
import { exerciseStorageService } from '../../services/storage/ExerciseStorageService';
import exerciseData from '../../data/exercises.json';
import { type ExerciseDefinition } from '../../types/workout';

export const AIPrompterView = () => {
    const [activeTab, setActiveTab] = useState<'generate' | 'import'>('generate');

    // Stores
    const userStore = useUserStore();
    const historyStore = useWorkoutHistoryStore();
    const { createRoutine } = useWorkoutStore();

    // Derive Unique Equipment List for context
    const allEquipment = useMemo(() => {
        const equipment = new Set<string>();
        (exerciseData as ExerciseDefinition[]).forEach(ex => {
            ex.equipmentList.forEach(eq => equipment.add(eq.trim()));
        });
        return Array.from(equipment).sort();
    }, []);

    // Generation State
    const [options, setOptions] = useState<PromptOptions>({
        enquiryType: 'routine',
        includeProfile: true,
        includeStats: true,
        includeHistory: true,
        includeObjectives: true,
        historyDays: 7
    });
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copied, setCopied] = useState(false);

    // Import State
    const [jsonInput, setJsonInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importMessage, setImportMessage] = useState<string | null>(null);

    const handleGenerate = () => {
        // Collect all exercise IDs (static + custom)
        const staticIds = (exerciseData as ExerciseDefinition[]).map(ex => ex.id);
        const customExercises = exerciseStorageService.loadCustomExercises();
        const customIds = customExercises.map(ex => ex.id);
        const allIds = Array.from(new Set([...staticIds, ...customIds])).sort();

        const prompt = generateCoachPrompt(
            {
                user: userStore,
                history: historyStore.sessions,
                allEquipment,
                availableExerciseIds: allIds
            },
            options
        );
        setGeneratedPrompt(prompt);
        setCopied(false);
    };

    const handleCopy = async () => {
        if (!generatedPrompt) return;
        try {
            await navigator.clipboard.writeText(generatedPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    // Analysis State
    const [analysisResult, setAnalysisResult] = useState<{
        consistencyScore: number;
        volumeAnalysis: string;
        muscleBalance: string;
        recommendations: string[];
    } | null>(null);

    const handleImport = () => {
        setImportError(null);
        setImportSuccess(false);
        setAnalysisResult(null);

        if (!jsonInput.trim()) return;

        try {
            // Locate JSON within the text (in case user pasted extra text)
            let jsonString = jsonInput;
            const firstBrace = jsonInput.indexOf('{');
            const lastBrace = jsonInput.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonString = jsonInput.substring(firstBrace, lastBrace + 1);
            }

            const parsed = JSON.parse(jsonString);

            // Determine Import Type
            // Determine Import Type
            if (parsed.type === 'routine' && parsed.data) {
                // Envelope Format: Routine
                const validatedRoutine = workoutStorageService.validateAndParseRoutine(JSON.stringify(parsed.data));
                createRoutine(validatedRoutine);
                setImportSuccess(true);
                setImportMessage(parsed.message || null);
                setJsonInput('');
            }
            else if (parsed.type === 'exercises' && parsed.data) {
                // Envelope Format: Exercises
                const validatedExercises = exerciseStorageService.parseImportJson(JSON.stringify(parsed.data));

                const existing = exerciseStorageService.loadCustomExercises();
                const merged = [...existing, ...validatedExercises];
                // Dedupe by ID
                const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
                exerciseStorageService.saveCustomExercises(unique);

                setImportSuccess(true);
                setImportMessage(parsed.message || null);
                setJsonInput('');
            }
            else if (parsed.type === 'analysis' && parsed.data) {
                // Envelope Format: Analysis
                setAnalysisResult(parsed.data);
                setImportSuccess(true);
                setImportMessage(parsed.message || null);
                setJsonInput('');
            }
            else {
                // Fallback / Legacy: Try to parse as Routine directly
                try {
                    const validatedRoutine = workoutStorageService.validateAndParseRoutine(jsonString);
                    createRoutine(validatedRoutine);
                    setImportSuccess(true);
                    setJsonInput('');
                } catch (err) {
                    throw new Error('Unknown JSON format. Could not detect type (routine/exercises/analysis).');
                }
            }
        } catch (e: any) {
            setImportError(e.message || 'Invalid JSON format');
        }
    };

    return (
        <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Coach</h1>
                    <p className="text-xs text-slate-400">Powered by your data</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'generate'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                        }`}
                >
                    <Sparkles size={16} />
                    Create Prompt
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'import'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                        }`}
                >
                    <FileJson size={16} />
                    Import Response
                </button>
            </div>

            {/* Content Actions */}
            {activeTab === 'generate' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Enquiry Type Card */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">I want to...</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setOptions({ ...options, enquiryType: 'routine' })}
                                className={`px-2 py-3 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${options.enquiryType === 'routine'
                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                <FileJson size={16} />
                                New Routine
                            </button>
                            <button
                                onClick={() => setOptions({ ...options, enquiryType: 'exercises' })}
                                className={`px-2 py-3 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${options.enquiryType === 'exercises'
                                    ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                <Target size={16} />
                                More Exercises
                            </button>
                            <button
                                onClick={() => setOptions({ ...options, enquiryType: 'analysis' })}
                                className={`px-2 py-3 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${options.enquiryType === 'analysis'
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                <Sparkles size={16} />
                                Analysis
                            </button>
                        </div>
                    </div>

                    {/* Options Card */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Include in Context</h3>

                        <div className="grid grid-cols-1 gap-3">
                            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <User size={18} />
                                    </div>
                                    <span className="text-sm text-slate-200">Personal Profile</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={options.includeProfile}
                                    onChange={(e) => setOptions({ ...options, includeProfile: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                        <Settings size={18} />
                                    </div>
                                    <span className="text-sm text-slate-200">Equipment & Stats</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={options.includeStats}
                                    onChange={(e) => setOptions({ ...options, includeStats: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                        <Target size={18} />
                                    </div>
                                    <span className="text-sm text-slate-200">Objectives & Goals</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={options.includeObjectives}
                                    onChange={(e) => setOptions({ ...options, includeObjectives: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                        <History size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-slate-200">Workout History</span>
                                        <span className="text-xs text-slate-500">Last {options.historyDays} days</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {options.includeHistory && (
                                        <select
                                            value={options.historyDays}
                                            onChange={(e) => setOptions({ ...options, historyDays: Number(e.target.value) })}
                                            className="bg-slate-900 border border-slate-700 rounded text-xs text-white p-1"
                                        >
                                            <option value={7}>7 Days</option>
                                            <option value={14}>14 Days</option>
                                            <option value={30}>30 Days</option>
                                        </select>
                                    )}
                                    <input
                                        type="checkbox"
                                        checked={options.includeHistory}
                                        onChange={(e) => setOptions({ ...options, includeHistory: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                                    />
                                </div>
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        <Sparkles size={18} />
                        Generate Prompt
                    </button>

                    {/* Result Area */}
                    {generatedPrompt && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-center text-slate-400 px-1">
                                <span className="text-xs font-medium uppercase tracking-wider">Ready to Copy</span>
                                <span className="text-xs">{generatedPrompt.length} chars</span>
                            </div>
                            <div className="relative group">
                                <textarea
                                    value={generatedPrompt}
                                    readOnly
                                    className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none resize-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-2 shadow-xl"
                                >
                                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                    <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy'}</span>
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 text-center">
                                Copy this prompt and paste it into ChatGPT, Claude, or your preferred AI.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <p className="text-sm text-slate-400 mb-4">
                            Paste the JSON response from the AI below to automatically create a new routine.
                        </p>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='{ "id": "my-new-routine", ... }'
                            className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                        />
                    </div>

                    {importError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-2 animate-in slide-in-from-top-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            {importError}
                        </div>
                    )}

                    {importSuccess && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-200 text-sm flex items-center gap-2 animate-in slide-in-from-top-1">
                            <Check size={16} className="text-green-400" />
                            {analysisResult ? 'Analysis loaded below!' : 'Import successful!'}
                        </div>
                    )}

                    {analysisResult && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center">
                                    <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Consistency</span>
                                    <span className="text-3xl font-bold text-blue-500">{analysisResult.consistencyScore}%</span>
                                </div>
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center">
                                    <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Rating</span>
                                    <span className="text-xl font-bold text-emerald-500">
                                        {analysisResult.consistencyScore > 80 ? 'Excellent' : analysisResult.consistencyScore > 50 ? 'Good' : 'Improving'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                                <h3 className="text-sm font-semibold text-slate-200">Volume Analysis</h3>
                                <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                                    {analysisResult.volumeAnalysis}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                                <h3 className="text-sm font-semibold text-slate-200">Muscle Balance</h3>
                                <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                                    {analysisResult.muscleBalance}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                                <h3 className="text-sm font-semibold text-slate-200">Recommendations</h3>
                                <ul className="space-y-2">
                                    {analysisResult.recommendations.map((rec, i) => (
                                        <li key={i} className="flex gap-2 text-xs text-slate-300">
                                            <span className="text-blue-500 font-bold">{i + 1}.</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}


                    <button
                        onClick={handleImport}
                        disabled={!jsonInput.trim()}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                        <FileJson size={18} />
                        Import Routine
                    </button>
                </div>
            )}

            {/* Success Modal */}
            {importMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-blue-500/30 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 p-6 text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Import Successful!</h2>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 text-left">
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{importMessage}</p>
                        </div>
                        <button
                            onClick={() => {
                                setImportMessage(null);
                                setImportSuccess(false); // Optionally clear success state if we want to reset
                            }}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/20"
                        >
                            Awesome!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
