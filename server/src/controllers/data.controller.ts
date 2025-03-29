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
import { RadicalPropService } from 'src/services/radical-prop.service';

@Controller('api/data')
export class DataController {
  constructor(
    private readonly dataService: DataService,
    private readonly characterService: CharacterService,
    private readonly radicalPropService: RadicalPropService,
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
  getRadicalProps(): Promise<RadicalProp[]> {
    return this.radicalPropService.findAll();
  }

  @Get('radicalProps/:radical')
  async getRadicalPropByRadical(
    @Param('radical') radical: string,
  ): Promise<RadicalProp | undefined> {
    const result = await this.radicalPropService.findByRadical(radical);
    return result || undefined;
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
  ): Promise<RadicalProp> {
    return this.radicalPropService.create({
      radical: createRadicalPropDto.radical,
      prop: createRadicalPropDto.prop,
    });
  }

  @Post('characters')
  async addCharacter(@Body() createCharacterDto: CreateCharacterDTO) {
    return this.characterService.create({
      character: createCharacterDto.character,
      pinyin: createCharacterDto.pinyin,
      definition: createCharacterDto.definition,
      radicals: createCharacterDto.radicals?.replaceAll(' ', ','),
    });
  }
}
