import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { DataController } from './controllers/data.controller';
import { AiController } from './ai/ai.controller';
import { SentenceController } from './controllers/sentence.controller';
import { WordsController } from './controllers/words.controller';
import { TtsAiService } from './ai/services/tts-ai.service';
import { ChineseChatAiService } from './ai/services/chat-ai.service';
import { FrenchChatAiService } from './ai/services/french-chat-ai.service';
import { CritiqueAiService } from './ai/services/critique-ai.service';
import { ConversationService } from './ai/services/conversation.service';
import { MovieAiService } from './ai/services/movie.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FlashcardController } from './controllers/flashcard.controller';
import { CharacterController } from './controllers/character.controller';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SentenceAnalyzerController } from './controllers/sentence-analyzer.controller';
import { SentenceFlashcardController } from './controllers/sentence-flashcard.controller';
import { RadioModule } from './radio/radio.module';
import { CoreModule } from './core/core.module';
import { SceneController } from './controllers/scene.controller';
import { EpisodeController } from './controllers/episode.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'client', 'dist', 'browser'),
    }),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
    TypeOrmModule.forRoot(databaseConfig),
    CoreModule,
    RadioModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [
    DataController,
    AiController,
    SceneController,
    EpisodeController,
    FlashcardController,
    SentenceController,
    WordsController,
    CharacterController,
    SentenceAnalyzerController,
    SentenceFlashcardController,
  ],
  providers: [
    AppService,
    TtsAiService,
    ChineseChatAiService,
    FrenchChatAiService,
    CritiqueAiService,
    ConversationService,
    MovieAiService,
  ],
})
export class AppModule {}
