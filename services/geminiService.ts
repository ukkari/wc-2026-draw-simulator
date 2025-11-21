import { GoogleGenAI } from "@google/genai";
import { Group } from '../types';

const apiKey = process.env.API_KEY || ''; 
// Note: In a real secure env, this comes from backend or secure env var. 
// Here we assume it's injected via bundler/environment.

export const analyzeGroup = async (group: Group): Promise<string> => {
  if (!apiKey) return "API Key is missing. Cannot generate analysis.";

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';

  const teamNames = group.teams.map(t => t.name).join(', ');
  const prompt = `
    Analyze Group ${group.name} for the 2026 World Cup.
    The teams are: ${teamNames}.
    Provide a short, witty, and insightful commentary (max 3 sentences) on who is the favorite, the "group of death" potential, or a fun fact.
    Keep it exciting like a sports commentator.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Could not generate commentary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The commentator is having technical difficulties (API Error).";
  }
};

export const analyzeFullDraw = async (groups: Group[]): Promise<string> => {
  if (!apiKey) return "API Key is missing.";

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash'; // Using 2.5 flash for speed/efficiency

  const groupSummary = groups.map(g => `Group ${g.name}: ${g.teams.map(t => t.name).join(', ')}`).join('\n');
  const prompt = `
    The 2026 World Cup Draw is complete! Here are the groups:
    ${groupSummary}

    Identify:
    1. The Group of Death.
    2. The easiest group.
    3. A potential dark horse.
    
    Format the output as a concise markdown list. Be energetic!
  `;

  try {
     const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error(error);
    return "Analysis failed.";
  }
}