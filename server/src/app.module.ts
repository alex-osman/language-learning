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
import { FlashcardService } from './services/flashcard.service';
import { FlashcardController } from './controllers/flashcard.controller';
import { AppController } from './controllers/app.controller';

@Module({
  imports: [
    // First, set up the database connection
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Character, RadicalProp, Actor, Set]),

    // Then, the static file serving for normal static assets (excluding the index.html fallback)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist', 'browser'),
      exclude: ['/api*'],
      serveStaticOptions: {
        index: false, // Don't automatically serve index.html for directories
      },
    }),

    // Finally, the catch-all route for Angular's client-side routing
    // This should be evaluated last to ensure all API routes are matched first
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist', 'browser'),
      serveRoot: '/*', // This creates a catch-all route that will serve index.html for any unmatched routes
      exclude: ['/api*'],
      serveStaticOptions: {
        index: 'index.html', // Always serve index.html for client-side routing
      },
    }),
  ],
  // First list controllers that handle API endpoints, then the catch-all controller
  controllers: [
    DataController,
    AiController,
    FlashcardController,
    AppController,
  ],
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
    FlashcardService,
  ],
})
export class AppModule {}
