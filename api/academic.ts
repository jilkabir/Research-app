// Vercel serverless function — proxies streaming requests to Gemini API
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

const SYSTEM_SUFFIX =
  '\n\nYou are a senior academic writing consultant with 20+ years of experience in PhD supervision and journal publishing. You write with scholarly authority, natural rhythm, and field-specific precision. You never use robotic transitions, vague qualifiers, or repetitive sentence patterns. Every response reads like it was written by a tenured professor.';

const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'] as const;

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

  const ai = new GoogleGenAI({ apiKey });
  const errors: string[] = [];

  for (const model of MODELS) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          systemInstruction: (systemInstruction || '') + SYSTEM_SUFFIX,
          temperature: 0.7,
        },
      });

      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      });

      for await (const chunk of responseStream) {
        if (chunk.text) res.write(chunk.text);
      }
      res.end();
      return;
    } catch (err) {
      const msg = `${model}: ${String(err)}`;
      errors.push(msg);
      console.warn(`[Gemini] ${msg}`);
      continue;
    }
  }

  console.error('[Gemini] all models failed:', errors);
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: errors.join(' || ') }));
  } else {
    res.end();
  }
}
