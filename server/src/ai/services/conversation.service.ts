import { Injectable } from '@nestjs/common';
import { Conversation, ChatMessage } from '../models/conversation.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConversationService {
  private conversations: Map<string, Conversation> = new Map();
  private readonly CONVERSATION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CONVERSATIONS = 1000; // Maximum number of conversations to store
  private readonly MAX_MESSAGES_TO_INCLUDE = 10; // Maximum number of previous messages to include

  constructor() {
    // Start the cleanup interval
    setInterval(() => this.cleanupOldConversations(), 5 * 60 * 1000); // Run every 5 minutes
  }

  createConversation(): string {
    // Clean up if we're at the limit
    if (this.conversations.size >= this.MAX_CONVERSATIONS) {
      this.cleanupOldConversations();
    }

    const id = uuidv4();
    this.conversations.set(id, new Conversation(id));
    return id;
  }

  getConversation(id: string): Conversation | undefined {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.lastUpdated = new Date(); // Update the last access time
    }
    return conversation;
  }

  addMessageToConversation(
    conversationId: string,
    role: ChatMessage['role'],
    content: string,
  ): void {
    const conversation = this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    conversation.addMessage(role, content);
  }

  getRecentMessages(conversationId: string): ChatMessage[] {
    const conversation = this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    return conversation.getLastMessages(this.MAX_MESSAGES_TO_INCLUDE);
  }

  private cleanupOldConversations(): void {
    const now = Date.now();
    for (const [id, conversation] of this.conversations.entries()) {
      if (
        now - conversation.lastUpdated.getTime() >
        this.CONVERSATION_TIMEOUT
      ) {
        this.conversations.delete(id);
      }
    }
  }
}
