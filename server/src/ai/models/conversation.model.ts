export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class Conversation {
  id: string;
  messages: ChatMessage[];
  lastUpdated: Date;

  constructor(id: string) {
    this.id = id;
    this.messages = [];
    this.lastUpdated = new Date();
  }

  addMessage(role: ChatMessage['role'], content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: new Date(),
    });
    this.lastUpdated = new Date();
  }

  getMessages(): ChatMessage[] {
    return this.messages;
  }

  // Get last n messages, useful for token management
  getLastMessages(n: number): ChatMessage[] {
    return this.messages.slice(-n);
  }
}
