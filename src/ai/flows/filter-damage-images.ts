
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
Ensure the output for filteredImageIds is a JSON array of strings. For example: {"filteredImageIds": ["id1", "id2"]}.
If no images match, return an empty array: {"filteredImageIds": []}.
`,
});

const filterDamageImagesFlow = ai.defineFlow(
  {
    name: 'filterDamageImagesFlow',
    inputSchema: FilterDamageImagesInputSchema,
    outputSchema: FilterDamageImagesOutputSchema,
  },
  async input => {
    const {output} = await filterDamageImagesPrompt(input);
    
    if (output && Array.isArray(output.filteredImageIds)) {
      return { filteredImageIds: output.filteredImageIds };
    }
    
    // Log an error or handle the case where the output is not as expected
    console.error('AI output for filteredImageIds was not in the expected format or was undefined:', output);
    // Return an empty array to prevent crashes and indicate no items were successfully filtered by AI
    return { filteredImageIds: [] };
  }
);

