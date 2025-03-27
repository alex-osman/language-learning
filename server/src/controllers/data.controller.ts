import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { DataService } from '../services/data.service';
import {
  SetDTO,
  Tone,
  Actor,
  RadicalProp,
  CharacterDTO,
} from '../shared/interfaces/data.interface';
import { CreateRadicalPropDTO } from '../shared/dto/radical-prop.dto';
import { CreateCharacterDTO } from '../shared/dto/character.dto';
import { CharacterService } from 'src/services/character.service';

@Controller('api/data')
export class DataController {
  constructor(
    private readonly dataService: DataService,
    private readonly characterService: CharacterService,
  ) {}

  @Get('sets')
  getSets(): SetDTO[] {
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
  getCharacters(): Promise<CharacterDTO[]> {
    return this.characterService.findAll();
  }

  @Get('characters/:character')
  getCharacterByCharacter(
    @Param('character') character: string,
  ): CharacterDTO | undefined {
    return this.dataService.getCharacterByCharacter(character);
  }

  @Post('radicalProps')
  addRadicalProp(
    @Body() createRadicalPropDto: CreateRadicalPropDTO,
  ): RadicalProp {
    return this.dataService.addRadicalProp(
      createRadicalPropDto.radical,
      createRadicalPropDto.prop,
    );
  }

  @Post('characters')
  addCharacter(@Body() createCharacterDto: CreateCharacterDTO): CharacterDTO {
    return this.dataService.addCharacter(
      createCharacterDto.character,
      createCharacterDto.pinyin,
      createCharacterDto.definition,
      createCharacterDto.radicals,
    );
  }
}
