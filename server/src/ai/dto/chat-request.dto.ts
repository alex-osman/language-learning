export class ChatRequestDto {
  text: string;
  conversationId?: string; // Optional - if not provided, a new conversation will be created
  // We can add more parameters here later if needed, like:
  // language?: string;
  // context?: string;
}
