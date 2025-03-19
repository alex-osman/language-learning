import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ConversationService } from './services/conversation.service';

@Module({
  controllers: [AiController],
  providers: [AiService, ConversationService],
})
export class AiModule {}
