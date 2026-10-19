import { z } from 'zod';
import { answerServiceQuestions } from '@/ai/flows/answer-service-questions';

export const runtime = 'nodejs';

const questionSchema = z.object({
  serviceDetails: z.string().trim().min(1).max(10000),
  question: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Enter a question and service details within the allowed length.' },
      { status: 400 }
    );
  }

  try {
    const result = await answerServiceQuestions(parsed.data);
    return Response.json({ answer: result.answer });
  } catch (error) {
    console.error('Failed to generate an answer for the service FAQ.', error);
    return Response.json(
      { error: 'Sorry, the AI assistant is unavailable right now. Please try again later.' },
      { status: 502 }
    );
  }
}
