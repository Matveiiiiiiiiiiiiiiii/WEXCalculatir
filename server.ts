import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));

// Initialize GoogleGenAI server client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Photo Math Recognition Endpoint
app.post('/api/recognize-math', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `You are an expert mathematical OCR and equation solver.
Analyze this image carefully to extract the handwritten or printed mathematical expression or problem.
Rules:
1. Return clean, standardized expression readable by a calculator (use standard arithmetic operators: +, -, *, /, ^, sqrt(), parentheses).
2. For fractions, format as "a/b" or "w a/b" (e.g. "3/4" or "1 1/2").
3. Determine mode: "standard" for normal arithmetic, "fractions" for fraction operations, "scientific" for trigonometry/roots/powers, or "finance" for financial receipts/percentages.
4. Output JSON matching the schema.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expression: {
              type: Type.STRING,
              description: 'The clean mathematical expression extracted from the image',
            },
            mode: {
              type: Type.STRING,
              description: 'One of standard, fractions, scientific, programmer, or finance',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0 and 1',
            },
            explanation: {
              type: Type.STRING,
              description: 'Brief explanation of what was detected',
            },
          },
          required: ['expression', 'mode'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      ...parsed,
    });
  } catch (err: unknown) {
    console.error('Error in /api/recognize-math:', err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during recognition',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
