// use server'

/**
 * @fileOverview Suggests optimal reorder quantities for products using historical sales and purchase data.
 *
 * - suggestReorderQuantity - A function that suggests the optimal reorder quantity for a product.
 * - SuggestReorderQuantityInput - The input type for the suggestReorderQuantity function.
 * - SuggestReorderQuantityOutput - The return type for the suggestReorderQuantity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestReorderQuantityInputSchema = z.object({
  productName: z.string().describe('The name of the product to reorder.'),
  pastSalesData: z.string().describe('Historical sales data for the product.'),
  pastPurchaseData: z.string().describe('Historical purchase data for the product.'),
  currentStockLevel: z.number().describe('The current stock level of the product.'),
});
export type SuggestReorderQuantityInput = z.infer<typeof SuggestReorderQuantityInputSchema>;

const SuggestReorderQuantityOutputSchema = z.object({
  reorderQuantity: z.number().describe('The suggested reorder quantity for the product.'),
  reasoning: z.string().describe('The reasoning behind the suggested reorder quantity.'),
});
export type SuggestReorderQuantityOutput = z.infer<typeof SuggestReorderQuantityOutputSchema>;

export async function suggestReorderQuantity(input: SuggestReorderQuantityInput): Promise<SuggestReorderQuantityOutput> {
  return suggestReorderQuantityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReorderQuantityPrompt',
  input: {schema: SuggestReorderQuantityInputSchema},
  output: {schema: SuggestReorderQuantityOutputSchema},
  prompt: `You are an expert inventory management system.

You will be provided with the historical sales data, purchase data, and current stock level of a product. Based on this information, you will suggest an optimal reorder quantity for the product.

Product Name: {{{productName}}}
Past Sales Data: {{{pastSalesData}}}
Past Purchase Data: {{{pastPurchaseData}}}
Current Stock Level: {{{currentStockLevel}}}

Consider factors such as demand trends, lead times, and storage capacity to determine the reorder quantity. Explain your reasoning.
`,
});

const suggestReorderQuantityFlow = ai.defineFlow(
  {
    name: 'suggestReorderQuantityFlow',
    inputSchema: SuggestReorderQuantityInputSchema,
    outputSchema: SuggestReorderQuantityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
