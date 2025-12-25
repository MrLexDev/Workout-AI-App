import { AppShell } from './components/layout/AppShell';
import { WorkoutDashboard } from './modules/dashboard/WorkoutDashboard';

function App() {
    return (
        <AppShell title="Dashboard">
            <WorkoutDashboard />
        </AppShell>
    );
}

export default App;