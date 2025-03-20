import { z } from 'zod';

export const CritiqueResponseSchema = z.object({
  text: z.string(),
  conversationId: z.string(),
});

export type CritiqueResponse = z.infer<typeof CritiqueResponseSchema>;
