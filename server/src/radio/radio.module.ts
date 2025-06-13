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
import { CharacterService } from '../services/character.service';
import { ActorService } from '../services/actor.service';
import { SetService } from '../services/set.service';
import { RadicalPropService } from '../services/radical-prop.service';
import { Actor } from '../entities/actor.entity';
import { Set } from '../entities/set.entity';
import { RadicalProp } from '../entities/radical-prop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Character, Actor, Set, RadicalProp])],
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
    CharacterService,
    ActorService,
    SetService,
    RadicalPropService,
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
