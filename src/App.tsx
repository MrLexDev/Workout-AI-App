import { AppShell } from './components/layout/AppShell';
import { WorkoutDashboard } from './modules/dashboard/WorkoutDashboard';
import { ActiveSessionView } from './modules/session/ActiveSessionView';
import { ExerciseLibrary } from './modules/exercises/ExerciseLibrary';
import { HistoryView } from './modules/history/HistoryView';
import { useWorkoutStore } from './store/workoutStore';
import { useState } from 'react';

function App() {
    const { isSessionActive } = useWorkoutStore();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'workout' | 'history'>('dashboard');

    return (
        <AppShell
            title={isSessionActive ? "Workout In Progress" : (
                activeTab === 'dashboard' ? 'Dashboard' :
                    activeTab === 'workout' ? 'Exercise Library' : 'History'
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
                </>
            )}
        </AppShell>
    );
}

export default App;