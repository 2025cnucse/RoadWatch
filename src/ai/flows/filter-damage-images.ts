'use server';

/**
 * @fileOverview A flow for filtering damaged facility images based on facility type and damage severity using natural language.
 *
 * - filterDamageImages - A function that filters the damaged facility images.
 * - FilterDamageImagesInput - The input type for the filterDamageImages function.
 * - FilterDamageImagesOutput - The return type for the filterDamageImages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterDamageImagesInputSchema = z.object({
  facilityType: z
    .string()
    .describe('The type of facility (e.g., bridge, road, sign).'),
  damageSeverity: z
    .string()
    .describe('The severity of the damage (e.g., low, medium, high).'),
  imageIds: z
    .array(z.string())
    .describe('The IDs of the images to filter based on the facility type and damage severity.'),
});

export type FilterDamageImagesInput = z.infer<typeof FilterDamageImagesInputSchema>;

const FilterDamageImagesOutputSchema = z.object({
  filteredImageIds: z
    .array(z.string())
    .describe('The IDs of the images that match the specified facility type and damage severity.'),
});

export type FilterDamageImagesOutput = z.infer<typeof FilterDamageImagesOutputSchema>;

export async function filterDamageImages(
  input: FilterDamageImagesInput
): Promise<FilterDamageImagesOutput> {
  return filterDamageImagesFlow(input);
}

const filterDamageImagesPrompt = ai.definePrompt({
  name: 'filterDamageImagesPrompt',
  input: {schema: FilterDamageImagesInputSchema},
  output: {schema: FilterDamageImagesOutputSchema},
  prompt: `You are an expert at filtering images of damaged facilities based on their type and damage severity.

You will receive a list of image IDs, the facility type, and the damage severity.
Your task is to determine which images from the list match the given facility type and damage severity.

Facility Type: {{{facilityType}}}
Damage Severity: {{{damageSeverity}}}
Image IDs: {{{imageIds}}}

Return only the IDs of the images that match both the facility type and damage severity.

Filtered Image IDs:`,
});

const filterDamageImagesFlow = ai.defineFlow(
  {
    name: 'filterDamageImagesFlow',
    inputSchema: FilterDamageImagesInputSchema,
    outputSchema: FilterDamageImagesOutputSchema,
  },
  async input => {
    const {output} = await filterDamageImagesPrompt(input);
    // Ensure the output is parsed as a JSON array of strings
    try {
      const parsedOutput = JSON.parse(output!.filteredImageIds) as string[];
      return {filteredImageIds: parsedOutput};
    } catch (error) {
      // If parsing fails, return an empty array to avoid crashing the application
      console.error('Failed to parse LLM output:', error);
      return {filteredImageIds: []};
    }
  }
);
