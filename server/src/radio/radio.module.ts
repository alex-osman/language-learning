import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../entities/character.entity';
import { HardWordsQueryService } from './services/hardWordsQuery.service';
import { TemplateHardService } from './services/templateHard.service';
import { RadioTtsService } from './services/tts.service';
import { SilenceService } from './services/silence.service';
import { ConcatService } from './services/concat.service';
import { DjScriptService } from './services/djScript.service';
import { NextCharacterQueryService } from './services/nextCharacterQuery.service';
import { TemplatePreviewService } from './services/templatePreview.service';
import { RadioBuilderService } from './services/radioBuilder.service';
import { RadioController } from './radio.controller';
import { Actor } from '../entities/actor.entity';
import { Set } from '../entities/set.entity';
import { RadicalProp } from '../entities/radical-prop.entity';
import { Sentence } from '../entities/sentence.entity';
import { CoreModule } from '../core/core.module';
import { UserCharacterKnowledge } from 'src/entities/user-character-knowledge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Character,
      Actor,
      Set,
      RadicalProp,
      Sentence,
      UserCharacterKnowledge,
    ]),
    CoreModule,
  ],
  providers: [
    HardWordsQueryService,
    TemplateHardService,
    RadioTtsService,
    SilenceService,
    ConcatService,
    DjScriptService,
    NextCharacterQueryService,
    TemplatePreviewService,
    RadioBuilderService,
  ],
  controllers: [RadioController],
  exports: [
    HardWordsQueryService,
    TemplateHardService,
    RadioTtsService,
    SilenceService,
    ConcatService,
    DjScriptService,
    NextCharacterQueryService,
    TemplatePreviewService,
    RadioBuilderService,
  ],
})
export class RadioModule {}
