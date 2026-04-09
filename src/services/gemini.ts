import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_SUFFIX =
  "\n\nYou are a senior academic writing consultant with 20+ years of experience in PhD supervision and journal publishing. You write with scholarly authority, natural rhythm, and field-specific precision. You never use robotic transitions, vague qualifiers, or repetitive sentence patterns. Every response reads like it was written by a tenured professor.";

// Models tried in order on quota / rate-limit errors
const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'] as const;

function isQuotaError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

export function friendlyError(err: unknown): string {
  const msg = String(err);
  if (isQuotaError(err))
    return 'Gemini API quota exceeded. Please wait a moment and try again, or check your API plan.';
  if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403') || msg.includes('invalid'))
    return 'Invalid or missing GEMINI_API_KEY. Please check your environment variables.';
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch'))
    return 'Network error — please check your internet connection.';
  return 'Something went wrong. Please try again.';
}

// Extracts the first complete JSON object from a string (handles markdown fences)
function extractJSON(raw: string): string {
  const text = raw.trim();

  // 1. Try direct parse
  try { JSON.parse(text); return text; } catch { /* try next */ }

  // 2. Strip ```json ... ``` fences
  const fenced = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { JSON.parse(fenced); return fenced; } catch { /* try next */ }

  // 3. Grab outermost { … }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const slice = text.slice(start, end + 1);
    try { JSON.parse(slice); return slice; } catch { /* try next */ }
  }

  throw new Error(`Could not parse JSON from model response. Raw: ${text.slice(0, 200)}`);
}

// ── Streaming text generation (academic tools) ───────────────────────────────
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
        console.warn(`[Gemini] ${model} quota hit, trying next model…`);
        continue;
      }
      break;
    }
  }

  console.error('[Gemini] generateAcademicResponse failed:', lastErr);
  throw new Error(friendlyError(lastErr));
}

// ── Non-streaming JSON generation (AI Score Checker) ─────────────────────────
export async function generateJSON<T>(
  systemInstruction: string,
  prompt: string
): Promise<T> {
  // Append a hard instruction to guarantee raw JSON output
  const forcedPrompt =
    prompt +
    '\n\n--- IMPORTANT ---\nRespond with ONLY valid JSON. No markdown fences, no explanation, no extra text. Your entire response must be a single JSON object starting with { and ending with }.';

  let lastErr: unknown;

  for (const model of MODELS) {
    try {
      // Use streaming so we capture the complete response reliably
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: forcedPrompt,
        config: {
          systemInstruction,
          temperature: 0.2, // Low temp for consistent JSON
        },
      });

      let raw = '';
      for await (const chunk of responseStream) {
        if (chunk.text) raw += chunk.text;
      }

      const jsonStr = extractJSON(raw);
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      lastErr = err;
      if (isQuotaError(err) && model !== MODELS[MODELS.length - 1]) {
        console.warn(`[Gemini] ${model} quota hit, trying next model…`);
        continue;
      }
      break;
    }
  }

  console.error('[Gemini] generateJSON failed:', lastErr);
  throw new Error(friendlyError(lastErr));
}
