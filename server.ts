import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Flow AI Backend Proxy Route
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, summary } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        text: null,
        message: 'No GEMINI_API_KEY configured; utilizing local CRM reasoning engine.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are Flow AI, the intelligent sales copilot inside Flowdesk CRM.
You analyze B2B pipeline velocity, deal health, contact history, and draft high-converting, professional B2B outreach.
Always be concise, strategic, executive-friendly, and actionable. Never invent fake results or pretend an email was sent.
Current Workspace context: ${JSON.stringify(summary || {})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.status(200).json({
      text: response.text,
      source: 'gemini',
    });
  } catch (error: any) {
    console.error('AI chat endpoint error:', error?.message);
    return res.status(200).json({
      text: null,
      error: error?.message,
    });
  }
});

// Vite Middleware for Dev or Static serving for Production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Flowdesk CRM running at http://localhost:${PORT}`);
  });
}

startServer();
