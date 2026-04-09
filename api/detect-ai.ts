// Vercel serverless function — AI detection via Gemini REST API directly.
// Uses fetch() instead of the @google/genai SDK to avoid v1beta model availability issues.

import type { IncomingMessage, ServerResponse } from 'node:http';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured on the server' }));
    return;
  }

  let body: { systemInstruction?: string; prompt?: string };
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const { systemInstruction = '', prompt } = body;
  if (!prompt) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'prompt field is required' }));
    return;
  }

  const forcedPrompt =
    prompt +
    '\n\n--- IMPORTANT ---\nRespond with ONLY valid JSON. No markdown fences, no explanation, no extra text. Your entire response must be a single JSON object starting with { and ending with }.';

  const errors: string[] = [];

  for (const model of MODELS) {
    try {
      const upstream = await fetch(
        `${BASE}/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: forcedPrompt }] }],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );

      if (!upstream.ok) {
        const errBody = await upstream.text();
        errors.push(`${model} HTTP ${upstream.status}: ${errBody}`);
        continue;
      }

      const data = await upstream.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(text);
      return;
    } catch (err) {
      errors.push(`${model}: ${String(err)}`);
    }
  }

  console.error('[Gemini] all models failed:', errors);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: errors.join(' | ') }));
}
