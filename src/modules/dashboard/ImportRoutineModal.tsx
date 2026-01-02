import React, { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useWorkoutStore } from '../../store/workoutStore';
import { workoutStorageService } from '../../services/storage/WorkoutStorageService';

interface ImportRoutineModalProps {
    targetRoutineId: string;
    onClose: () => void;
}

export const ImportRoutineModal: React.FC<ImportRoutineModalProps> = ({ targetRoutineId, onClose }) => {
    const { updateRoutine } = useWorkoutStore();
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);
        try {
            let routineDataString = jsonText;
            let conclusionMessage: string | null = null;

            // Try to parse as AI Envelope
            try {
                const parsed = JSON.parse(jsonText);
                if (parsed.type === 'routine' && parsed.data) {
                    routineDataString = JSON.stringify(parsed.data);
                    conclusionMessage = parsed.message || null;
                }
            } catch (e) {
                // If it's not valid JSON here, validateAndParseRoutine will catch it
            }

            // 1. Validate structure
            const validatedRoutine = workoutStorageService.validateAndParseRoutine(routineDataString);

            // 2. Ensure ID matches the target
            const routineToSave = {
                ...validatedRoutine,
                id: targetRoutineId // Override ID with the target one
            };

            updateRoutine(routineToSave);

            if (conclusionMessage) {
                setSuccessMessage(conclusionMessage);
            } else {
                onClose();
            }
        } catch (e: any) {
            setError(e.message || 'Invalid JSON format or missing fields.');
        }
    };

    if (successMessage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-blue-500/30 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Routine Updated!</h2>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 text-left">
                        <p className="text-slate-300 text-sm leading-relaxed">{successMessage}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/20"
                    >
                        Awesome, let's go!
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Import Routine</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-400">
                        Paste the valid JSON content below. This will <span className="text-red-400 font-bold">overwrite</span> the current routine configuration.
                    </p>

                    <textarea
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        placeholder='{ "id": "...", "name": "...", "exercises": [...] }'
                        className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
                        spellCheck={false}
                    />

                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-bold flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
