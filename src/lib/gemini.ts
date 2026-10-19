import 'server-only';

import { z } from 'zod';

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string() })),
        }),
      })
    )
    .min(1),
});

export async function generateGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Gemini request failed with HTTP ${response.status}: ${detail}`);
  }

  const result = geminiResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('Gemini returned no usable text candidate.');
  }

  const text = result.data.candidates[0].content.parts
    .map((part) => part.text)
    .join('')
    .trim();
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return text;
}
