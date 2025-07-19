import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ActorService } from '../services/actor.service';
import { CharacterService } from '../services/character.service';
import { RadicalPropService } from '../services/radical-prop.service';
import { SetService } from '../services/set.service';
import { CreateActorDTO } from '../shared/dto/actor.dto';
import { CreateCharacterDTO } from '../shared/dto/character.dto';
import { CreateRadicalPropDTO } from '../shared/dto/radical-prop.dto';
import {
  ActorDTO,
  CharacterDTO,
  PropDTO,
  SetDTO,
  Tone,
} from '../shared/interfaces/data.interface';
import { UserID } from 'src/decorators/user.decorator';
import { UserCharacterKnowledgeService } from 'src/services/user-character-knowledge.service';

@Controller('api/data')
export class DataController {
  constructor(
    private readonly characterService: CharacterService,
    private readonly radicalPropService: RadicalPropService,
    private readonly actorService: ActorService,
    private readonly setService: SetService,
    private readonly userCharacterKnowledgeService: UserCharacterKnowledgeService,
  ) {}

  @Get('sets')
  getSets(): Promise<SetDTO[]> {
    return this.setService.findAll();
  }

  @Get('tones')
  getTones(): Tone {
    return {
      '1': 'Outside the entrance',
      '2': 'Kitchen or inside entrance',
      '3': 'Bedroom or living room',
      '4': 'Bathroom or outside/yard',
      '5': 'On the roof',
    };
  }

  @Get('actors')
  getActors(): Promise<ActorDTO[]> {
    return this.actorService.findAll();
  }

  @Get('actors/:initial')
  async getActorByInitial(
    @Param('initial') initial: string,
  ): Promise<ActorDTO | undefined> {
    const result = await this.actorService.findByInitial(initial);
    return result || undefined;
  }

  @Get('radicalProps')
  getRadicalProps(): Promise<PropDTO[]> {
    return this.radicalPropService.findAll();
  }

  @Get('radicalProps/:radical')
  async getRadicalPropByRadical(
    @Param('radical') radical: string,
  ): Promise<PropDTO | undefined> {
    const result = await this.radicalPropService.findByRadical(radical);
    return result || undefined;
  }

  @Get('characters')
  getCharacters(@UserID() userId: number): Promise<CharacterDTO[]> {
    return this.characterService.getAllCharacterDTOs(userId);
  }

  @Post('actors')
  addActor(@Body() createActorDto: CreateActorDTO): Promise<ActorDTO> {
    return this.actorService.create(createActorDto);
  }

  @Post('radicalProps')
  addRadicalProp(
    @Body() createRadicalPropDto: CreateRadicalPropDTO,
  ): Promise<PropDTO> {
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
