export class ChatResponseDto {
  base: string; // English (base language)
  target: string; // Chinese or French (target language)
  transliteration?: string; // Pinyin (only for Chinese)
  conversationId: string;
}
