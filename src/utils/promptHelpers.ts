import type { UserData } from '../types/user';
import type { WorkoutSession } from '../types/history';
import type { HydratedRoutine } from '../types/workout';

export type EnquiryType = 'routine' | 'exercises' | 'analysis';

export interface PromptOptions {
    enquiryType: EnquiryType;
    includeProfile: boolean;
    includeStats: boolean;
    includeHistory: boolean;
    includeObjectives: boolean;
    historyDays: number;
}

interface PromptContextData {
    user: UserData;
    history: WorkoutSession[];
    routines: HydratedRoutine[];
}

export const generateCoachPrompt = (data: PromptContextData, options: PromptOptions): string => {
    const sections: string[] = [];

    // 1. Introduction & Role
    let roleDescription = `Act as an expert Fitness Coach and Personal Trainer. You are "AI Coach".`;

    if (options.enquiryType === 'routine') {
        roleDescription += ` Your goal is to create a new Workout Routine (or modify an existing one) that perfectly matches the user's needs.`;
    } else if (options.enquiryType === 'exercises') {
        roleDescription += ` Your goal is to recommend new specific Exercises that would benefit the user, based on their equipment and history.`;
    } else if (options.enquiryType === 'analysis') {
        roleDescription += ` Your goal is to analyze the user's recent progression, consistency, and volume to provide actionable advice.`;
    }

    sections.push(roleDescription);

    // 2. User Profile
    if (options.includeProfile) {
        const { gender, height, weightHistory, weightUnit } = data.user;
        const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : 'Unknown';

        sections.push(`### User Profile
- Gender: ${gender || 'Not specified'}
- Height: ${height ? height + 'cm' : 'Not specified'}
- Current Weight: ${currentWeight} ${weightUnit}`);

        // Calculate Age if birthdate exists
        if (data.user.birthDate) {
            const birthDate = new Date(data.user.birthDate);
            const ageDiffJs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDiffJs);
            const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
            sections.push(`- Age: ${calculatedAge}`);
        }
    }

    // 3. User Stats & Equipment
    if (options.includeStats) {
        sections.push(`### Equipment & Experience
- Available Equipment: ${data.user.availableEquipment.join(', ') || 'None specified'}`);
    }

    // 4. Objectives & Considerations
    if (options.includeObjectives) {
        sections.push(`### Goals & Considerations
- Main Objective: ${data.user.objective || 'Not specified'}
- Special Considerations/Injuries: ${data.user.specialConsiderations || 'None'}`);
    }

    // 5. Recent History
    if (options.includeHistory) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.historyDays);

        const recentSessions = data.history.filter(s => new Date(s.startTime) >= cutoffDate);

        sections.push(`### Workout History (Last ${options.historyDays} days)
Found ${recentSessions.length} total sessions.`);

        // Summarize sessions briefly
        const historySummary = recentSessions.map(s => {
            const date = new Date(s.startTime).toLocaleDateString();

            // s.routineSnapshot needs to be used for the name and exercises
            const routineName = s.routineSnapshot ? s.routineSnapshot.name : "Unknown Workout";

            // Map exercises from the snapshot
            const exercises = s.routineSnapshot && s.routineSnapshot.exercises
                ? s.routineSnapshot.exercises.map(e => e.name).join(', ')
                : "No exercises recorded";

            return `- [${date}] ${routineName}: ${exercises}`;
        }).join('\n');

        if (historySummary) {
            sections.push(historySummary);
        } else {
            sections.push("No workouts recorded in this period.");
        }
    }

    // 6. Response Format (Varies by Enquiry Type)
    let responseInstructions = "";

    if (options.enquiryType === 'routine') {
        responseInstructions = `
### RESPONSE FORMAT REQUIRED
You MUST reply with a STRICT JSON object representing the new Routine.
Do not include markdown formatting (like \`\`\`json) inside the response if possible.
The JSON structure must match this:

interface Routine {
  id: string; // Generate a unique kebab-case ID
  name: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedDurationMinutes: number;
  exercises: {
    exerciseId: string; // Use standard IDs like 'barbell-bench-press' where possible
    targetSets: number;
    minimumRepetitions: number;
    maximumRepetitions: number;
    restTimeSeconds: number;
    targetRir?: number; // 1-5
    notes?: string;
  }[];
}

Please provide the JSON first, followed by a brief text explanation.`;
    }
    else if (options.enquiryType === 'exercises') {
        responseInstructions = `
### RESPONSE FORMAT REQUIRED
You MUST reply with a STRICT JSON array of NEW Exercises to add to the library.
Do not include markdown formatting (like \`\`\`json) inside the response if possible.
The JSON structure must match this:

interface Exercise {
  id: string; // Unique kebab-case ID (e.g., 'cable-fly-low-to-high')
  name: string;
  primaryMuscles: string[]; // e.g. ["Chest", "Front Delts"]
  secondaryMuscles: { muscle: string; impact: "High" | "Low" }[];
  equipment: string;
  description: string;
}[]

Please provide the JSON array first, followed by a brief reason for each recommendation.`;
    }
    else if (options.enquiryType === 'analysis') {
        responseInstructions = `
### RESPONSE FORMAT REQUIRED
Do NOT provide JSON. Provide a structured text response using Markdown.
Structure your analysis as follows:
1. **Consistency Score**: Evaluate adherence based on history.
2. **Volume & Intensity Analysis**: Are they training hard enough? Too much?
3. **Muscle Balance**: Neglected body parts? Overworked areas?
4. **Actionable Recommendations**: 3 concrete steps to improve.
`;
    }

    sections.push(responseInstructions);

    return sections.join('\n\n');
};
