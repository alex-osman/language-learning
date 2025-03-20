import { z } from 'zod';

export const TranslationSchema = z.object({
  base: z.string(),
  target: z.string(),
  transliteration: z.string().optional(),
});

export const ChineseTranslationSchema = z.object({
  chinese: z.string(),
  pinyin: z.string().optional(),
  english: z.string(),
});

export type Translation = z.infer<typeof TranslationSchema>;

export const ChatResponseSchema = z.object({
  base: z.string(),
  target: z.string(),
  transliteration: z.string().optional(),
  conversationId: z.string(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
