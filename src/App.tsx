import { AppShell } from './components/layout/AppShell';
import { WorkoutDashboard } from './modules/dashboard/WorkoutDashboard';
import { ActiveSessionView } from './modules/session/ActiveSessionView';
import { ExerciseLibrary } from './modules/exercises/ExerciseLibrary';
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
                    {activeTab === 'history' && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <p>History feature coming soon!</p>
                        </div>
                    )}
                </>
            )}
        </AppShell>
    );
}

export default App;