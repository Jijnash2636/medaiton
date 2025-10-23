import { GoogleGenAI, Type } from "@google/genai";
import { Patient, TriageSuggestion, Appointment } from '../types';

const getAge = (dobString: string): number => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const triageSchema = {
    type: Type.OBJECT,
    properties: {
        classification: {
            type: Type.STRING,
            enum: ['Stable', 'Moderate', 'Critical'],
            description: "Classify the patient's condition as 'Stable', 'Moderate', or 'Critical' based on their symptoms and vitals."
        },
        summary: {
            type: Type.STRING,
            description: "A brief summary of the reasoning for the triage classification."
        },
        potentialSpecialist: {
            type: Type.STRING,
            description: "The type of specialist to consult, e.g., 'Cardiologist', 'Neurologist', 'General Practitioner'."
        }
    },
    required: ['classification', 'summary', 'potentialSpecialist']
};

const soapSchema = {
    type: Type.OBJECT,
    properties: {
        subjective: { type: Type.STRING, description: "Patient's description of their symptoms and medical history." },
        objective: { type: Type.STRING, description: "Doctor's objective findings from vitals, physical exams, and lab results." },
        assessment: { type: Type.STRING, description: "Doctor's primary diagnosis or differential diagnoses." },
        plan: { type: Type.STRING, description: "Doctor's treatment plan, including prescriptions, therapies, and follow-ups." }
    },
    required: ['subjective', 'objective', 'assessment', 'plan']
};


export const getTriageSuggestion = async (patient: Patient): Promise<TriageSuggestion> => {
    try {
        if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const age = getAge(patient.dob);

        const prompt = `
            Analyze the following patient information for triage at SRM Trichy Hospital.
            - Name: ${patient.name}
            - Age: ${age}
            - Gender: ${patient.gender}
            ${patient.department ? `- Department Selected: ${patient.department}` : ''}
            - Symptoms: ${patient.symptoms}
            ${patient.vitals ? `- Vitals: BP ${patient.vitals.bloodPressure}, HR ${patient.vitals.heartRate} bpm, Temp ${patient.vitals.temperature}°C, SpO2 ${patient.vitals.spo2}%` : ''}
            - Urgent Request: ${patient.isUrgentRequest ? 'Yes' : 'No'}
            
            Based on this, provide a triage classification, a brief summary, and suggest a potential specialist. The patient selected the '${patient.department}' department; consider this when suggesting a specialist.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert medical triage assistant AI. Your role is to analyze patient information to suggest a triage classification ('Stable', 'Moderate', 'Critical'). Your analysis is for informational purposes and is not a diagnosis. Respond in JSON format according to the provided schema.",
                responseMimeType: "application/json",
                responseSchema: triageSchema,
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as TriageSuggestion;
    } catch (error) {
        console.error("Error getting triage suggestion from Gemini API:", error);
        throw new Error("Failed to get AI triage suggestion.");
    }
};

export const generateSOAPNotes = async (patient: Patient, appointment: Appointment): Promise<string> => {
    try {
        if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const age = getAge(patient.dob);
        
        const prompt = `
            Generate SOAP notes for the following patient consultation.
            
            Patient Details:
            - Name: ${patient.name}, Age: ${age}, Gender: ${patient.gender}
            - Symptoms/Reason for Visit: ${appointment.reason}
            - Vitals: BP ${patient.vitals?.bloodPressure}, HR ${patient.vitals?.heartRate} bpm, Temp ${patient.vitals?.temperature}°C, SpO2 ${patient.vitals?.spo2}%
            
            Based on this information, create a structured SOAP note.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                systemInstruction: "You are a Doctor Copilot AI. Your task is to assist physicians by generating structured clinical documentation like SOAP notes based on provided patient data. Ensure the notes are concise, professional, and well-organized. Respond in JSON format according to the provided schema.",
                responseMimeType: "application/json",
                responseSchema: soapSchema,
            }
        });
        
        const jsonString = response.text.trim();
        const soapData = JSON.parse(jsonString);
        
        return `
### Subjective
${soapData.subjective}

### Objective
${soapData.objective}

### Assessment
${soapData.assessment}

### Plan
${soapData.plan}
        `.trim();

    } catch (error) {
        console.error("Error generating SOAP notes:", error);
        throw new Error("Failed to generate SOAP notes.");
    }
};