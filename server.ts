import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ZeroGPT Proxy
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
          error: data.message || `ZeroGPT API returned status ${response.status}` 
        });
      }
      res.json(data);
    } catch (error) {
      console.error("ZeroGPT API Error:", error);
      res.status(500).json({ error: "Failed to connect to ZeroGPT API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
