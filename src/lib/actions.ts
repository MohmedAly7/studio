'use server';

import { suggestReorderQuantity } from '@/ai/flows/reorder-suggestion';
import type { SuggestReorderQuantityInput } from '@/ai/flows/reorder-suggestion';
import { z } from 'zod';

const ReorderInputSchema = z.object({
  productName: z.string(),
  pastSalesData: z.string(),
  pastPurchaseData: z.string(),
  currentStockLevel: z.number(),
});

export async function getReorderSuggestion(input: SuggestReorderQuantityInput) {
  const parsedInput = ReorderInputSchema.safeParse(input);

  if (!parsedInput.success) {
    console.error('Invalid input for reorder suggestion:', parsedInput.error);
    return { error: 'Invalid input provided.' };
  }

  try {
    const result = await suggestReorderQuantity(parsedInput.data);
    return result;
  } catch (error) {
    console.error('Error getting reorder suggestion:', error);
    return { error: 'Failed to get reorder suggestion from AI.' };
  }
}
