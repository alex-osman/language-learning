import { Controller, Get, Param } from '@nestjs/common';
import { DataService } from '../services/data.service';
import {
  Set,
  Tone,
  Actor,
  RadicalProp,
  Character,
} from '../shared/interfaces/data.interface';

@Controller('api/data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('sets')
  getSets(): Set[] {
    return this.dataService.getSets();
  }

  @Get('tones')
  getTones(): Tone {
    return this.dataService.getTones();
  }

  @Get('actors')
  getActors(): Actor[] {
    return this.dataService.getActors();
  }

  @Get('actors/:initial')
  getActorByInitial(@Param('initial') initial: string): Actor | undefined {
    return this.dataService.getActorByInitial(initial);
  }

  @Get('radicalProps')
  getRadicalProps(): RadicalProp[] {
    return this.dataService.getRadicalProps();
  }

  @Get('radicalProps/:radical')
  getRadicalPropByRadical(
    @Param('radical') radical: string,
  ): RadicalProp | undefined {
    return this.dataService.getRadicalPropByRadical(radical);
  }

  @Get('characters')
  getCharacters(): Character[] {
    return this.dataService.getCharacters();
  }

  @Get('characters/:character')
  getCharacterByCharacter(
    @Param('character') character: string,
  ): Character | undefined {
    return this.dataService.getCharacterByCharacter(character);
  }
}
