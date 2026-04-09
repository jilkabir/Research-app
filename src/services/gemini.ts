import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_SUFFIX = "\n\nYou are a senior academic writing consultant with 20+ years of experience in PhD supervision and journal publishing. You write with scholarly authority, natural rhythm, and field-specific precision. You never use robotic transitions, vague qualifiers, or repetitive sentence patterns. Every response reads like it was written by a tenured professor.";

export async function generateAcademicResponse(
  systemInstruction: string,
  prompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction + SYSTEM_SUFFIX,
        temperature: 0.7,
      },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk?.(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
