import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { TtsAiService } from './services/tts-ai.service';
import { ChatAiService } from './services/chat-ai.service';
import { CritiqueAiService } from './services/critique-ai.service';
import { ConversationService } from './services/conversation.service';

@Module({
  controllers: [AiController],
  providers: [
    TtsAiService,
    ChatAiService,
    CritiqueAiService,
    ConversationService,
  ],
})
export class AiModule {}
