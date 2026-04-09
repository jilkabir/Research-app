// Vercel serverless function — streams academic text from Gemini REST API directly.
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

const SYSTEM_SUFFIX =
  '\n\nYou are a senior academic writing consultant with 20+ years of experience in PhD supervision and journal publishing. You write with scholarly authority, natural rhythm, and field-specific precision. You never use robotic transitions, vague qualifiers, or repetitive sentence patterns. Every response reads like it was written by a tenured professor.';

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

  const errors: string[] = [];

  for (const model of MODELS) {
    try {
      const upstream = await fetch(
        `${BASE}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction + SYSTEM_SUFFIX }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 },
          }),
        }
      );

      if (!upstream.ok) {
        const errBody = await upstream.text();
        errors.push(`${model} HTTP ${upstream.status}: ${errBody}`);
        continue;
      }

      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      });

      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            const text: string | undefined = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) res.write(text);
          } catch { /* skip malformed SSE chunks */ }
        }
      }

      res.end();
      return;
    } catch (err) {
      errors.push(`${model}: ${String(err)}`);
    }
  }

  console.error('[Gemini] all models failed:', errors);
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: errors.join(' | ') }));
  } else {
    res.end();
  }
}
