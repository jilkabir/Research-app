import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_SUFFIX =
  "\n\nYou are a senior academic writing consultant with 20+ years of experience in PhD supervision and journal publishing. You write with scholarly authority, natural rhythm, and field-specific precision. You never use robotic transitions, vague qualifiers, or repetitive sentence patterns. Every response reads like it was written by a tenured professor.";

const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // ── Gemini: streaming academic text ──────────────────────────────────────
  app.post("/api/academic", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on the server" });
    }

    const { systemInstruction = "", prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt field is required" });

    const errors: string[] = [];

    for (const model of MODELS) {
      try {
        const upstream = await fetch(
          `${BASE}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("Cache-Control", "no-cache");

        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
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

    console.error("[Gemini] academic route failed:", errors);
    if (!res.headersSent) res.status(500).json({ error: errors.join(" | ") });
    else res.end();
  });

  // ── Gemini: JSON AI detection ─────────────────────────────────────────────
  app.post("/api/detect-ai", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on the server" });
    }

    const { systemInstruction = "", prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt field is required" });

    const forcedPrompt =
      prompt +
      "\n\n--- IMPORTANT ---\nRespond with ONLY valid JSON. No markdown fences, no explanation, no extra text. Your entire response must be a single JSON object starting with { and ending with }.";

    const errors: string[] = [];

    for (const model of MODELS) {
      try {
        const upstream = await fetch(
          `${BASE}/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(text);
        return;
      } catch (err) {
        errors.push(`${model}: ${String(err)}`);
      }
    }

    console.error("[Gemini] detect-ai route failed:", errors);
    res.status(500).json({ error: errors.join(" | ") });
  });

  // ── ZeroGPT Proxy ─────────────────────────────────────────────────────────
  app.post("/api/detect", async (req, res) => {
    const { text } = req.body;
    const apiKey = process.env.ZEROGPT_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "ZEROGPT_API_KEY not configured" });
    }

    try {
      const response = await fetch("https://api.zerogpt.com/api/detect/detectText", {
        method: "POST",
        headers: {
          "ApiKey": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: (data as { message?: string }).message || `ZeroGPT API returned status ${response.status}`,
        });
      }
      res.json(data);
    } catch (error) {
      console.error("ZeroGPT API Error:", error);
      res.status(500).json({ error: "Failed to connect to ZeroGPT API" });
    }
  });

  // ── Vite middleware / static files ────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
