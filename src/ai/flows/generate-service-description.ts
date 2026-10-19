'use server';

/**
 * @fileOverview A service description generator AI agent.
 *
 * - generateServiceDescription - A function that generates a service description.
 * - GenerateServiceDescriptionInput - The input type for the generateServiceDescription function.
 * - GenerateServiceDescriptionOutput - The return type for the generateServiceDescription function.
 */

import { generateGeminiText } from '@/lib/gemini';
import { z } from 'zod';

export type GenerateServiceDescriptionInput = {
  serviceName: string;
  serviceCategory: string;
  targetAudience: string;
  keyFeatures: string;
};

const GenerateServiceDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling description of the service.'),
});
export type GenerateServiceDescriptionOutput = z.infer<
  typeof GenerateServiceDescriptionOutputSchema
>;

export async function generateServiceDescription(
  input: GenerateServiceDescriptionInput
): Promise<GenerateServiceDescriptionOutput> {
  const description = await generateGeminiText(
    `You are an expert marketing copywriter specializing in service descriptions. Generate a compelling description for the following service, taking into account its target audience, category, and key features.\n\nService name: ${input.serviceName}\nService category: ${input.serviceCategory}\nTarget audience: ${input.targetAudience}\nKey features: ${input.keyFeatures}`
  );
  return GenerateServiceDescriptionOutputSchema.parse({ description });
}
