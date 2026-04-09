import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_SUFFIX = "\n\nYou are a senior academic writing consultant with 20+ years of experience in PhD supervision and journal publishing. You write with scholarly authority, natural rhythm, and field-specific precision. You never use robotic transitions, vague qualifiers, or repetitive sentence patterns. Every response reads like it was written by a tenured professor.";

// Models tried in order — falls back on quota/rate-limit errors
const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'] as const;

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (isQuotaError(err)) return 'Gemini API quota exceeded. Please wait a moment and try again, or upgrade your API plan.';
  if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')) return 'Invalid or missing GEMINI_API_KEY. Please check your environment variables.';
  if (msg.includes('fetch') || msg.includes('network')) return 'Network error — please check your internet connection.';
  return 'Gemini API error. Please try again.';
}

export async function generateAcademicResponse(
  systemInstruction: string,
  prompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  let lastErr: unknown;

  for (const model of MODELS) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction + SYSTEM_SUFFIX,
          temperature: 0.7,
        },
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk?.(text);
        }
      }
      return fullText;
    } catch (err) {
      lastErr = err;
      if (isQuotaError(err) && model !== MODELS[MODELS.length - 1]) {
        console.warn(`Model ${model} quota exceeded, trying next model…`);
        continue;
      }
      break;
    }
  }

  console.error('Gemini API Error:', lastErr);
  throw new Error(friendlyError(lastErr));
}

// Generates a structured JSON response (no streaming, no system suffix)
export async function generateJSON<T>(
  systemInstruction: string,
  prompt: string
): Promise<T> {
  let lastErr: unknown;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3, // Lower temp for reliable JSON
          responseMimeType: 'application/json',
        },
      });

      const raw = response.text ?? '';
      // Strip markdown fences if the model wraps in them despite responseMimeType
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      lastErr = err;
      if (isQuotaError(err) && model !== MODELS[MODELS.length - 1]) {
        console.warn(`Model ${model} quota exceeded, trying next model…`);
        continue;
      }
      break;
    }
  }

  console.error('Gemini JSON Error:', lastErr);
  throw new Error(friendlyError(lastErr));
}
