'use server';

/**
 * @fileOverview AI-powered FAQ for service-related questions.
 *
 * - answerServiceQuestions - A function that answers user questions about a specific service.
 * - AnswerServiceQuestionsInput - The input type for the answerServiceQuestions function.
 * - AnswerServiceQuestionsOutput - The return type for the answerServiceQuestions function.
 */

import { generateGeminiText } from '@/lib/gemini';
import { z } from 'zod';

export type AnswerServiceQuestionsInput = {
  serviceDetails: string;
  question: string;
};

const AnswerServiceQuestionsOutputSchema = z.object({
  answer: z
    .string()
    .describe('The AI-generated answer to the user question, based on the service details.'),
});
export type AnswerServiceQuestionsOutput = z.infer<typeof AnswerServiceQuestionsOutputSchema>;

export async function answerServiceQuestions(
  input: AnswerServiceQuestionsInput
): Promise<AnswerServiceQuestionsOutput> {
  const answer = await generateGeminiText(
    `You are an AI assistant that answers questions about a specific service. Answer only from the supplied service details. If the details do not contain the answer, say so instead of inventing information.\n\nService details:\n${input.serviceDetails}\n\nQuestion:\n${input.question}`
  );
  return AnswerServiceQuestionsOutputSchema.parse({ answer });
}
