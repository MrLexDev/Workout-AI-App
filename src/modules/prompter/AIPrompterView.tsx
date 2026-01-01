import { Sparkles } from 'lucide-react';

export const AIPrompterView = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 space-y-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles size={40} className="text-white" />
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">AI Coach</h2>
                <p className="text-slate-400 max-w-xs">
                    Your personal AI fitness assistant is coming soon. Get ready for personalized insights and workout generation.
                </p>
            </div>
        </div>
    );
};
