import { z } from 'zod';

export const TranslationSchema = z.object({
  chinese: z.string(),
  pinyin: z.string(),
  english: z.string(),
});

export type Translation = z.infer<typeof TranslationSchema>;

export const ChatResponseSchema = z.object({
  chinese: z.string(),
  pinyin: z.string(),
  english: z.string(),
  conversationId: z.string(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
