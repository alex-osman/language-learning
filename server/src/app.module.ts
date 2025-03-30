import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { Character } from './entities/character.entity';
import { RadicalProp } from './entities/radical-prop.entity';
import { Actor } from './entities/actor.entity';
import { Set } from './entities/set.entity';
import { CharacterService } from './services/character.service';
import { RadicalPropService } from './services/radical-prop.service';
import { ActorService } from './services/actor.service';
import { SetService } from './services/set.service';
import { DataController } from './controllers/data.controller';
import { AiController } from './ai/ai.controller';
import { TtsAiService } from './ai/services/tts-ai.service';
import { ChineseChatAiService } from './ai/services/chat-ai.service';
import { FrenchChatAiService } from './ai/services/french-chat-ai.service';
import { CritiqueAiService } from './ai/services/critique-ai.service';
import { ConversationService } from './ai/services/conversation.service';
import { MovieAiService } from './ai/services/movie.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist', 'browser'),
      exclude: ['/api'],
      serveStaticOptions: {
        index: false,
      },
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Character, RadicalProp, Actor, Set]),
  ],
  controllers: [DataController, AiController],
  providers: [
    AppService,
    CharacterService,
    RadicalPropService,
    ActorService,
    SetService,
    TtsAiService,
    ChineseChatAiService,
    FrenchChatAiService,
    CritiqueAiService,
    ConversationService,
    MovieAiService,
  ],
})
export class AppModule {}
