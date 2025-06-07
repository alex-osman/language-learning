import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { Character } from './entities/character.entity';
import { RadicalProp } from './entities/radical-prop.entity';
import { Actor } from './entities/actor.entity';
import { Set } from './entities/set.entity';
import { Sentence } from './entities/sentence.entity';
import { Word } from './entities/word.entity';
import { CharacterService } from './services/character.service';
import { RadicalPropService } from './services/radical-prop.service';
import { ActorService } from './services/actor.service';
import { SetService } from './services/set.service';
import { SentenceService } from './services/sentence.service';
import { WordService } from './services/word.service';
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
import { FlashcardService } from './services/flashcard.service';
import { FlashcardController } from './controllers/flashcard.controller';
import { CharacterController } from './controllers/character.controller';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist', 'browser'),
    }),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([
      Character,
      RadicalProp,
      Actor,
      Set,
      Sentence,
      Word,
    ]),
  ],
  controllers: [
    DataController,
    AiController,
    FlashcardController,
    SentenceController,
    WordsController,
    CharacterController,
  ],
  providers: [
    AppService,
    CharacterService,
    RadicalPropService,
    ActorService,
    SetService,
    SentenceService,
    WordService,
    TtsAiService,
    ChineseChatAiService,
    FrenchChatAiService,
    CritiqueAiService,
    ConversationService,
    MovieAiService,
    FlashcardService,
  ],
})
export class AppModule {}
