import { GoogleGenAI } from "@google/genai";
import { Group } from '../types';

const apiKey = process.env.API_KEY || '';
// Note: In a real secure env, this comes from backend or secure env var.
// Here we assume it's injected via bundler/environment.

export const analyzeFullDraw = async (groups: Group[]): Promise<string> => {
  if (!apiKey) return "APIキーが設定されていません。";

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash'; // Using 2.5 flash for speed/efficiency

  const groupSummary = groups.map(g => `グループ${g.name}: ${g.teams.map(t => t.name).join(', ')}`).join('\n');
  const prompt = `
    2026年FIFAワールドカップの抽選が完了しました！以下がグループ分けです：
    ${groupSummary}

    以下を日本語で分析してください：
    1. 死の組（最も厳しいグループ）
    2. 最も楽なグループ
    3. ダークホース（番狂わせを起こしそうなチーム）

    簡潔なマークダウン形式のリストで出力してください。エネルギッシュで、サッカーファンが興奮するような解説を！
  `;

  try {
     const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "分析が利用できません。";
  } catch (error) {
    console.error(error);
    return "分析に失敗しました。";
  }
}