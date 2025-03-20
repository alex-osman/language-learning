import { Language } from '@shared/types/languages';

export class ChatRequestDto {
  language: Language;
  text: string;
  conversationId?: string; // Optional - if not provided, a new conversation will be created
  // We can add more parameters here later if needed, like:
  // language?: string;
  // context?: string;
}
