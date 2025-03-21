import { Language } from '@shared/types/languages';

export class CritiqueRequestDto {
  text: string;
  conversationId?: string;
  mainConversationId?: string; // ID of the conversation being critiqued
  isFollowup?: boolean;
  language?: Language;
}
