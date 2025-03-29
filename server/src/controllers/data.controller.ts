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
import { CreateActorDTO } from '../shared/dto/actor.dto';
import { CreateCharacterDTO } from '../shared/dto/character.dto';
import { CharacterService } from 'src/services/character.service';
import { RadicalPropService } from 'src/services/radical-prop.service';
import { ActorService } from 'src/services/actor.service';

@Controller('api/data')
export class DataController {
  constructor(
    private readonly dataService: DataService,
    private readonly characterService: CharacterService,
    private readonly radicalPropService: RadicalPropService,
    private readonly actorService: ActorService,
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
  getActors(): Promise<Actor[]> {
    return this.actorService.findAll();
  }

  @Get('actors/:initial')
  async getActorByInitial(
    @Param('initial') initial: string,
  ): Promise<Actor | undefined> {
    const result = await this.actorService.findByInitial(initial);
    return result || undefined;
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

  @Post('actors')
  addActor(@Body() createActorDto: CreateActorDTO): Promise<Actor> {
    return this.actorService.create(createActorDto);
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
