import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_SUFFIX =
  "\n\nYou are a senior academic writing consultant with 20+ years of experience in PhD supervision and journal publishing. You write with scholarly authority, natural rhythm, and field-specific precision. You never use robotic transitions, vague qualifiers, or repetitive sentence patterns. Every response reads like it was written by a tenured professor.";

const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"] as const;

function isQuotaError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
}

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

    const ai = new GoogleGenAI({ apiKey });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    let lastErr: unknown;
    for (const model of MODELS) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction + SYSTEM_SUFFIX,
            temperature: 0.7,
          },
        });
        for await (const chunk of stream) {
          if (chunk.text) res.write(chunk.text);
        }
        res.end();
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

    console.error("[Gemini] academic route failed:", lastErr);
    if (!res.headersSent) res.status(500).json({ error: String(lastErr) });
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

    const ai = new GoogleGenAI({ apiKey });
    let lastErr: unknown;

    for (const model of MODELS) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: forcedPrompt,
          config: { systemInstruction, temperature: 0.2 },
        });
        let raw = "";
        for await (const chunk of stream) {
          if (chunk.text) raw += chunk.text;
        }
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(raw);
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

    console.error("[Gemini] detect-ai route failed:", lastErr);
    res.status(500).json({ error: String(lastErr) });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
