import { AppShell } from './components/layout/AppShell';
import { WorkoutDashboard } from './modules/dashboard/WorkoutDashboard';
import { ActiveSessionView } from './modules/session/ActiveSessionView';
import { ExerciseLibrary } from './modules/exercises/ExerciseLibrary';
import { HistoryView } from './modules/history/HistoryView';
import { SettingsView } from './modules/settings/SettingsView';
import { AIPrompterView } from './modules/prompter/AIPrompterView';
import { useWorkoutStore } from './store/workoutStore';
import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { BackHandlerProvider, useBackHandlerContext } from './contexts/BackHandlerContext';

function AppContent() {
    const { isSessionActive } = useWorkoutStore();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'workout' | 'history' | 'settings' | 'ai_prompter'>('dashboard');
    const { handleBack, register } = useBackHandlerContext();

    // Register Root Handler (Lowest Priority)
    useEffect(() => {
        // Priority 1 (Lowest) - Default App Navigation
        const unregister = register(() => {
            if (activeTab !== 'dashboard') {
                setActiveTab('dashboard');
                return true;
            }
            // If on dashboard, let default happen (which usually effectively nothing or exit if we call exitApp)
            // But usually we want to explicit exit
            CapacitorApp.exitApp();
            return true;
        }, 1);

        return unregister;
    }, [activeTab, register]);

    // Setup Global Listener connected to Context
    useEffect(() => {
        const listener = CapacitorApp.addListener('backButton', () => {
            handleBack();
        });

        return () => {
            listener.then((remove: { remove: () => void }) => remove.remove());
        };
    }, [handleBack]);

    return (
        <AppShell
            title={isSessionActive ? "Workout In Progress" : (
                activeTab === 'dashboard' ? 'Dashboard' :
                    activeTab === 'workout' ? 'Exercise Library' :
                        activeTab === 'history' ? 'History' :
                            activeTab === 'settings' ? 'Settings' : 'AI Coach'
            )}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {isSessionActive ? (
                <ActiveSessionView />
            ) : (
                <>
                    {activeTab === 'dashboard' && <WorkoutDashboard />}
                    {activeTab === 'workout' && <ExerciseLibrary />}
                    {activeTab === 'history' && <HistoryView />}
                    {activeTab === 'settings' && <SettingsView />}
                    {activeTab === 'ai_prompter' && <AIPrompterView />}
                </>
            )}
        </AppShell>
    );
}

function App() {
    return (
        <BackHandlerProvider>
            <AppContent />
        </BackHandlerProvider>
    );
}

export default App;