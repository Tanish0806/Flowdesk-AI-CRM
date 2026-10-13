import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS handling if invoked cross-origin
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, summary } = req.body || {};
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
    console.error('Vercel AI chat endpoint error:', error?.message);
    return res.status(200).json({
      text: null,
      error: error?.message,
    });
  }
}
