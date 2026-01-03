import type { UserData } from '../types/user';
import type { WorkoutSession } from '../types/history';


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
    allEquipment?: string[];
    availableExerciseIds?: string[];
}

export const generateCoachPrompt = (data: PromptContextData, options: PromptOptions): string => {
    const sections: string[] = [];

    // 1. Introduction & Role
    let roleDescription = `### Role
You are an expert Performance Data Analyst, Strength and Fitness Coach.`;

    if (options.enquiryType === 'routine') {
        roleDescription += ` Your goal is to create a new Workout Routine (or modify an existing one) that perfectly matches the user's needs.`;
    } else if (options.enquiryType === 'exercises') {
        roleDescription += ` Your goal is to recommend new specific Exercises that would benefit the user, based on their equipment and history.`;
    } else if (options.enquiryType === 'analysis') {
        roleDescription += ` Your goal is to analyze the user's recent progression, consistency, and volume to provide actionable advice.`;
    }

    sections.push(roleDescription);

    // 2. User Profile & Weight Evolution
    if (options.includeProfile) {
        const { gender, height, weightHistory, weightUnit } = data.user;
        const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : 'Unknown';

        let userProfile = `### User Profile
- Gender: ${gender || 'Not specified'}
- Height: ${height ? height + 'cm' : 'Not specified'}
- Current Weight: ${currentWeight} ${weightUnit}`;

        // Calculate Age if birthdate exists
        if (data.user.birthDate) {
            const birthDate = new Date(data.user.birthDate);
            const ageDiffJs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDiffJs);
            const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
            userProfile += (`\n- Age: ${calculatedAge}`);
        }

        // Full Weight Evolution
        if (weightHistory.length > 0) {
            userProfile += `\n\n### Weight Evolution (Newest to Oldest)
${weightHistory.map(w => `- ${new Date(w.date).toLocaleDateString()}: ${w.weight} ${weightUnit}`).join('\n')}`;
        }

        sections.push(userProfile);
    }

    // 3. User Stats & Equipment
    if (options.includeStats) {
        const { availableEquipment, equipmentSelectionMode } = data.user;
        let equipmentStr = "";

        if (equipmentSelectionMode === 'full_gym' && data.allEquipment) {
            const exceptions = data.allEquipment.filter(eq => !availableEquipment.includes(eq));
            if (exceptions.length > 0) {
                equipmentStr = `Full Gym EXCEPT: ${exceptions.join(', ')}`;
            } else {
                equipmentStr = "Full Gym (All equipment available)";
            }
        } else if (equipmentSelectionMode === 'home_gym') {
            equipmentStr = `Home Gym INCLUDING: ${availableEquipment.join(', ') || 'Only bodyweight/None'}`;
        } else {
            // Fallback
            equipmentStr = availableEquipment.join(', ') || 'None specified';
        }

        let sectionContent = `### Equipment & Experience
- Available Equipment: ${equipmentStr}`;

        if (data.availableExerciseIds && data.availableExerciseIds.length > 0) {
            sectionContent += `\n\n### Current Exercise Library (IDs)
Use these IDs when creating routines if applicable. Do not invent new IDs unless recommending NEW exercises.
${data.availableExerciseIds.join(', ')}`;
        }

        sections.push(sectionContent);
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

        // Detailed session summary
        const historySummary = recentSessions.map(s => {
            const date = new Date(s.startTime).toLocaleDateString();
            const durationMin = Math.round(s.durationSeconds / 60);

            // s.routineSnapshot needs to be used for the name and exercises
            const routineName = s.routineSnapshot ? s.routineSnapshot.name : "Unknown Workout";

            let sessionDetails = `#### [${date}] ${routineName} (Duration: ${durationMin} min)`;

            if (s.routineSnapshot && s.routineSnapshot.exercises) {
                const exerciseDetails = s.routineSnapshot.exercises.map(e => {
                    const eId = e.exerciseId || e.id; // basic fallback if structure varies

                    // Filter logs and rest data for this exercise
                    const eLogs = s.logs.filter(l => l.exerciseId === eId);
                    const eRests = s.restData.filter(r => r.exerciseId === eId);

                    const setsDone = eLogs.length;

                    // Calculations
                    const avgWeight = setsDone > 0
                        ? (eLogs.reduce((acc, l) => acc + l.weight, 0) / setsDone).toFixed(1)
                        : 0;

                    const avgWorkTime = setsDone > 0
                        ? (eLogs.reduce((acc, l) => acc + (l.duration || 0), 0) / setsDone).toFixed(1)
                        : 0;

                    const avgRestTime = eRests.length > 0
                        ? (eRests.reduce((acc, r) => acc + r.actualSeconds, 0) / eRests.length).toFixed(1)
                        : 0;

                    const avgRir = setsDone > 0
                        ? (eLogs.reduce((acc, l) => acc + (l.rir ?? 0), 0) / setsDone).toFixed(1)
                        : 0;

                    const unit = data.user.weightUnit || 'kg';

                    return `- ${e.name}: ${setsDone} Sets | Avg Weight: ${avgWeight}${unit} | Avg RIR: ${avgRir} | Avg Work: ${avgWorkTime}s | Avg Rest: ${avgRestTime}s`;
                }).join('\n');

                sessionDetails += `\n${exerciseDetails}`;
            }

            return sessionDetails;
        }).join('\n\n');

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
You MUST reply with a STRICT JSON object using the following "Envelope" structure.
DO NOT include any text outside the JSON object.
DO NOT use markdown formatting (like \`\`\`json).

{
  "type": "routine",
  "data": {
      "id": "string (kebab-case)",
      "name": "string",
      "description": "string",
      "category": "string", // e.g., "Strength", "Hypertrophy", "Cardio"
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "estimatedDurationMinutes": number,
      "tags": ["string"], // e.g., ["Full Body", "Home", "No Equipment"]
      "exercises": [
        {
          "exerciseId": "string", // Crucial: Use exact ID if known, or kebab-case unique ID for new ones
          "targetSets": number,
          "minimumRepetitions": number,
          "maximumRepetitions": number,
          "restTimeSeconds": number,
          "targetRir": number, // 0-5 (Reps In Reserve)
          "notes": "string"
        }
      ]
  },
  "message": "Brief explanation of changes and conclusions. Ensure this is helpful for the user."
}`;
    }
    else if (options.enquiryType === 'exercises') {
        responseInstructions = `
### RESPONSE FORMAT REQUIRED
You MUST reply with a STRICT JSON object using the following "Envelope" structure.
DO NOT include any text outside the JSON object.
DO NOT use markdown formatting (like \`\`\`json).

{
  "type": "exercises",
  "data": [
      {
        "id": "string (kebab-case)",
        "name": "string",
        "aliases": ["string"],
        "exerciseType": "Strength" | "Cardio" | "Power" | "Plyometric",
        "mechanics": "Compound" | "Isolation",
        "forceType": "Push" | "Pull" | "Static",
        "experienceLevel": "Beginner" | "Intermediate" | "Advanced",
        "targetMuscles": {
          "primary": ["string"],
          "secondary": ["string"]
        },
        "equipmentList": ["string"],
        "instructions": {
            "setup": "string",
            "execution": ["string"],
            "tips": ["string"]
        },
        "description": "string"
      }
  ],
  "message": "Brief reason for each recommendation and summary."
}`;
    }
    else if (options.enquiryType === 'analysis') {
        responseInstructions = `
### RESPONSE FORMAT REQUIRED
You MUST reply with a STRICT JSON object using the following "Envelope" structure.
DO NOT include any text outside the JSON object.
DO NOT use markdown formatting (like \`\`\`json).

{
  "type": "analysis",
  "data": {
    "consistencyScore": number, // 0-100
    "volumeAnalysis": "string (markdown allowed)",
    "muscleBalance": "string (markdown allowed)",
    "recommendations": ["string", "string", "string"]
  },
  "message": "Summary of analysis and key takeaways."
}`;
    }

    sections.push(responseInstructions);

    return sections.join('\n\n');
};
