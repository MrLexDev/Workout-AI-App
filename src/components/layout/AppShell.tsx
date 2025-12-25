import React, { type ReactNode } from 'react';

interface AppShellProps {
    children: ReactNode;
    title?: string;
}

/**
 * AppShell
 * Main layout wrapper. It limits the width to simulate a mobile app experience
 * on desktop screens and handles the main background structure.
 */
export const AppShell: React.FC<AppShellProps> = ({ children, title }) => {
    return (
        <div className="min-h-screen w-full bg-slate-950 flex justify-center">
            {/* Mobile container limit */}
            <main className="w-full max-w-md bg-slate-900 min-h-screen shadow-2xl relative flex flex-col">

                {/* Top Header */}
                <header className="px-6 py-5 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 backdrop-blur-sm">
                    <h1 className="text-xl font-bold tracking-tight text-white">
                        {title || 'Workout Tracker'}
                    </h1>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-4 overflow-y-auto pb-24">
                    {children}
                </div>

                {/* Bottom Navigation Placeholder (Visual Reference) */}
                <nav className="fixed bottom-0 w-full max-w-md bg-slate-800 border-t border-slate-700 h-16 flex items-center justify-around z-20">
                    <span className="text-xs text-slate-400">Dashboard</span>
                    <span className="text-xs text-slate-400">Workout</span>
                    <span className="text-xs text-slate-400">History</span>
                </nav>
            </main>
        </div>
    );
};