// All Gemini API calls are proxied through Vercel serverless functions (/api/*).
// The API key is read server-side at request time, so changing it in Vercel
// takes effect immediately without a rebuild.

export function friendlyError(err: unknown): string {
  const msg = String(err);
  if (msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED'))
    return 'Gemini API quota exceeded. Please wait a moment and try again, or check your API plan.';
  if (msg.includes('GEMINI_API_KEY') || msg.includes('not configured'))
    return 'Gemini API key not configured. Please add GEMINI_API_KEY to your Vercel environment variables and redeploy.';
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
  let response: Response;
  try {
    response = await fetch('/api/academic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction, prompt }),
    });
  } catch (err) {
    throw new Error(`Network error: ${String(err)}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${body || '(empty response)'}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body from server.');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk?.(chunk);
  }

  return fullText;
}

// ── Non-streaming JSON generation (AI Score Checker) ─────────────────────────
export async function generateJSON<T>(
  systemInstruction: string,
  prompt: string
): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/detect-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction, prompt }),
    });
  } catch (err) {
    throw new Error(`Network error: ${String(err)}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${body || '(empty response)'}`);
  }

  const raw = await response.text();
  const jsonStr = extractJSON(raw);
  return JSON.parse(jsonStr) as T;
}
