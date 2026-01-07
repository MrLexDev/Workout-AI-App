import React, { type ReactNode } from 'react';

import { LayoutDashboard, Dumbbell, History, Settings, Sparkles } from 'lucide-react';

interface AppShellProps {
    children: ReactNode;
    activeTab?: 'dashboard' | 'workout' | 'history' | 'settings' | 'ai_prompter';
    onTabChange?: (tab: 'dashboard' | 'workout' | 'history' | 'settings' | 'ai_prompter') => void;
    disablePadding?: boolean;
}

/**
 * AppShell
 * Main layout wrapper. It limits the width to simulate a mobile app experience
 * on desktop screens and handles the main background structure.
 * 
 * Each tab gets its own scroll container via the key prop - this ensures
 * each tab's scroll position is independent and always starts at the top.
 */
export const AppShell: React.FC<AppShellProps> = ({ children, activeTab = 'dashboard', onTabChange, disablePadding = false }) => {
    return (
        <div className="min-h-screen w-full bg-slate-950 flex justify-center overflow-hidden">
            {/* Mobile container limit */}
            <main className="w-full max-w-md bg-slate-900 h-screen shadow-2xl relative flex flex-col">

                {/* Top Header */}
                {/* Header removed as per user request */}

                {/* Content Area - Scroll container that can be targeted for scroll reset */}
                <div data-scroll-container className={`flex-1 overflow-y-auto pb-24 ${(activeTab === 'history' || disablePadding) ? 'p-0' : 'p-4'}`}>
                    {children}
                </div>

                {/* Bottom Navigation Placeholder (Visual Reference) */}
                <nav className="fixed bottom-0 w-full max-w-md bg-slate-800 border-t border-slate-700 h-16 flex items-center justify-around z-20">
                    <button
                        onClick={() => onTabChange?.('dashboard')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-medium">Dashboard</span>
                    </button>
                    <button
                        onClick={() => onTabChange?.('workout')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'workout' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <Dumbbell size={20} />
                        <span className="text-[10px] font-medium">Workout</span>
                    </button>
                    <button
                        onClick={() => onTabChange?.('history')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <History size={20} />
                        <span className="text-[10px] font-medium">History</span>
                    </button>
                    <button
                        onClick={() => onTabChange?.('ai_prompter')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ai_prompter' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <Sparkles size={20} />
                        <span className="text-[10px] font-medium">AI Coach</span>
                    </button>
                    <button
                        onClick={() => onTabChange?.('settings')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <Settings size={20} />
                        <span className="text-[10px] font-medium">Settings</span>
                    </button>
                </nav>
            </main>
        </div>
    );
};