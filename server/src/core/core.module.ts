import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../entities/character.entity';
import { RadicalProp } from '../entities/radical-prop.entity';
import { Actor } from '../entities/actor.entity';
import { Set } from '../entities/set.entity';
import { Sentence } from '../entities/sentence.entity';
import { Word } from '../entities/word.entity';
import { CharacterService } from '../services/character.service';
import { RadicalPropService } from '../services/radical-prop.service';
import { ActorService } from '../services/actor.service';
import { SetService } from '../services/set.service';
import { SentenceService } from '../services/sentence.service';
import { WordService } from '../services/word.service';
import { FlashcardService } from '../services/flashcard.service';
import { SentenceAnalyzerService } from '../services/sentence-analyzer.service';
import { SentenceFlashcardService } from '../services/sentence-flashcard.service';
import { SceneService } from 'src/services/scene.service';
import { Scene } from 'src/entities/scene.entity';
import { Episode } from 'src/entities/episode.entity';
import { EpisodeService } from 'src/services/episode.service';
import { UserCharacterKnowledge } from 'src/entities/user-character-knowledge.entity';
import { UserCharacterKnowledgeService } from '../services/user-character-knowledge.service';
import { SRTParserService } from '../services/srt-parser.service';
import { YouTubeImportService } from '../services/youtube-import.service';
import { MovieAiService } from '../ai/services/movie.service';
import { Season } from 'src/entities/season.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Character,
      RadicalProp,
      Actor,
      Set,
      Sentence,
      Word,
      Scene,
      Episode,
      UserCharacterKnowledge,
      Season,
    ]),
  ],
  providers: [
    CharacterService,
    RadicalPropService,
    ActorService,
    SetService,
    SentenceService,
    WordService,
    FlashcardService,
    SentenceAnalyzerService,
    SentenceFlashcardService,
    SceneService,
    EpisodeService,
    UserCharacterKnowledgeService,
    SRTParserService,
    YouTubeImportService,
    MovieAiService,
  ],
  exports: [
    CharacterService,
    RadicalPropService,
    ActorService,
    SetService,
    SentenceService,
    WordService,
    FlashcardService,
    SentenceAnalyzerService,
    SentenceFlashcardService,
    SceneService,
    EpisodeService,
    UserCharacterKnowledgeService,
    SRTParserService,
    YouTubeImportService,
    MovieAiService,
  ],
})
export class CoreModule {}
