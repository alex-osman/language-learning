import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { TtsAiService } from './services/tts-ai.service';
import { ChineseChatAiService } from './services/chat-ai.service';
import { FrenchChatAiService } from './services/french-chat-ai.service';
import { CritiqueAiService } from './services/critique-ai.service';
import { ConversationService } from './services/conversation.service';
import { MovieAiService } from './services/movie.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    TtsAiService,
    ChineseChatAiService,
    FrenchChatAiService,
    CritiqueAiService,
    ConversationService,
    MovieAiService,
  ],
})
export class AiModule {}
