import { AppShell } from './components/layout/AppShell';
import { WorkoutDashboard } from './modules/dashboard/WorkoutDashboard';
import { ActiveSessionView } from './modules/session/ActiveSessionView';
import { useWorkoutStore } from './store/workoutStore';

function App() {
    const { isSessionActive } = useWorkoutStore();

    return (
        <AppShell title={isSessionActive ? "Workout In Progress" : "Dashboard"}>
            {isSessionActive ? (
                <ActiveSessionView />
            ) : (
                <WorkoutDashboard />
            )}
        </AppShell>
    );
}

export default App;