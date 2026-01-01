
import { useUserStore } from '../../store/userStore';
import { Settings as SettingsIcon, Globe, Scale, ChevronRight } from 'lucide-react';

export const SettingsView = () => {
    const { weightUnit, setWeightUnit } = useUserStore();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

            {/* Units Section */}
            <section className="bg-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3 text-slate-300 mb-2">
                    <Scale size={20} className="text-blue-400" />
                    <h3 className="font-semibold text-lg">Units</h3>
                </div>

                <div className="flex items-center justify-between p-2">
                    <span className="text-white">Weight Unit</span>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => setWeightUnit('kg')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${weightUnit === 'kg'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Kg
                        </button>
                        <button
                            onClick={() => setWeightUnit('lb')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${weightUnit === 'lb'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Lb
                        </button>
                    </div>
                </div>
            </section>

            {/* Language Section (UI Only) */}
            <section className="bg-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3 text-slate-300 mb-2">
                    <Globe size={20} className="text-green-400" />
                    <h3 className="font-semibold text-lg">Language</h3>
                </div>

                <div className="flex items-center justify-between p-2 opacity-60 cursor-not-allowed">
                    <span className="text-white">App Language</span>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span>English</span>
                        <ChevronRight size={16} />
                    </div>
                </div>
                <p className="text-xs text-slate-500 px-2">More languages coming soon.</p>
            </section>

            {/* App Info Section */}
            <section className="bg-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3 text-slate-300 mb-2">
                    <SettingsIcon size={20} className="text-purple-400" />
                    <h3 className="font-semibold text-lg">About</h3>
                </div>

                <div className="flex items-center justify-between p-2">
                    <span className="text-white">Version</span>
                    <span className="text-slate-400">1.0.0</span>
                </div>
            </section>
        </div>
    );
};
