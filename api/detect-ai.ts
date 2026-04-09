// Vercel serverless function — proxies AI-detection JSON requests to Gemini API
// The GEMINI_API_KEY is read at request time (not baked into the build),
// so updating the env var in Vercel takes effect immediately.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI } from '@google/genai';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'] as const;

function isQuotaError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

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
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const { systemInstruction, prompt } = body;
  if (!prompt || typeof prompt !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'prompt field is required' }));
    return;
  }

  const forcedPrompt =
    prompt +
    '\n\n--- IMPORTANT ---\nRespond with ONLY valid JSON. No markdown fences, no explanation, no extra text. Your entire response must be a single JSON object starting with { and ending with }.';

  const ai = new GoogleGenAI({ apiKey });
  let lastErr: unknown;

  for (const model of MODELS) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: forcedPrompt,
        config: {
          systemInstruction: systemInstruction || '',
          temperature: 0.2,
        },
      });

      let raw = '';
      for await (const chunk of responseStream) {
        if (chunk.text) raw += chunk.text;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(raw);
      return;
    } catch (err) {
      lastErr = err;
      if (isQuotaError(err) && model !== MODELS[MODELS.length - 1]) {
        console.warn(`[Gemini] ${model} quota hit, trying next model…`);
        continue;
      }
      break;
    }
  }

  console.error('[Gemini] detect-ai handler failed:', lastErr);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: String(lastErr) }));
}
