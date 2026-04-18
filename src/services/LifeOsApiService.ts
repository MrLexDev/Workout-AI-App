import type { WorkoutSession } from '../types/history';

const BASE_URL = 'https://desktop-d2j2job.tail70d658.ts.net';
const TIMEOUT_MS = 15_000;

// ---------- request / response shapes ----------

interface PerformedExercise {
    exerciseName: string;
    weightInKilograms: number;
    repetitionCount: number;
    setSequenceNumber: number;
    repsInReserve: number | null;
    restDurationSeconds: number | null;
}

interface LifeOsSessionRequest {
    sessionStartTimestamp: string;
    sessionEndTimestamp: string | null;
    sessionNotes: string | null;
    performedExercises: PerformedExercise[];
}

interface LifeOsSessionResponse {
    workoutSessionIdentifier?: string;
    id?: string;
    [key: string]: unknown;
}

// ---------- public result type ----------

export type SyncResult =
    | { ok: true; lifeOsSessionId: string }
    | { ok: false; error: string };

// ---------- mapping ----------

function buildRequestBody(session: WorkoutSession): LifeOsSessionRequest {
    // Sort logs by the moment each set was completed so setSequenceNumber
    // reflects the real chronological order across all exercises.
    const sortedLogs = [...session.logs].sort((a, b) => a.timestamp - b.timestamp);

    const performedExercises: PerformedExercise[] = sortedLogs.map((log, index) => {
        const exercise = session.routineSnapshot.exercises.find(
            (e) => e.exerciseId === log.exerciseId
        );

        // Find the rest period that started immediately after this set for the
        // same exercise (nearest restData entry with timestamp >= log.timestamp).
        const restEntry = session.restData
            .filter((r) => r.exerciseId === log.exerciseId && r.timestamp >= log.timestamp)
            .sort((a, b) => a.timestamp - b.timestamp)[0];

        return {
            exerciseName: exercise?.name ?? log.exerciseId,
            weightInKilograms: log.weight, // already stored in kg
            repetitionCount: log.reps,
            setSequenceNumber: index + 1, // 1-based, never resets per exercise
            repsInReserve: log.rir ?? null,
            restDurationSeconds: restEntry?.actualSeconds ?? null,
        };
    });

    return {
        sessionStartTimestamp: new Date(session.startTime).toISOString(),
        sessionEndTimestamp: session.endTime ? new Date(session.endTime).toISOString() : null,
        sessionNotes: null,
        performedExercises,
    };
}

// ---------- main export ----------

export async function syncSessionToLifeOs(session: WorkoutSession): Promise<SyncResult> {
    const apiKey = import.meta.env.VITE_LIFE_OS_API_KEY;
    if (!apiKey) {
        return {
            ok: false,
            error: 'API key not configured. Add VITE_LIFE_OS_API_KEY to .env.local.',
        };
    }

    const body = buildRequestBody(session);

    let response: Response;
    try {
        response = await fetch(`${BASE_URL}/api/fitness/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch (err) {
        // Network-level failure — most likely Tailscale not connected
        if (err instanceof DOMException && err.name === 'TimeoutError') {
            return { ok: false, error: 'Request timed out. Is Tailscale connected?' };
        }
        return { ok: false, error: 'Network unreachable. Is Tailscale connected?' };
    }

    if (response.status === 201 || response.ok) {
        const data: LifeOsSessionResponse = await response.json().catch(() => ({}));
        const lifeOsSessionId =
            data.workoutSessionIdentifier ?? data.id ?? `synced-${session.id}`;
        return { ok: true, lifeOsSessionId };
    }

    if (response.status === 401) {
        return { ok: false, error: 'Invalid API key (401). Check VITE_LIFE_OS_API_KEY.' };
    }

    const detail = await response.text().catch(() => '');
    return {
        ok: false,
        error: `Sync failed (${response.status})${detail ? `: ${detail}` : '.'}`,
    };
}
