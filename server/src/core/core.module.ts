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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Character,
      RadicalProp,
      Actor,
      Set,
      Sentence,
      Word,
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
  ],
})
export class CoreModule {}
