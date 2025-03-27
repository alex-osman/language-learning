import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { CharacterService } from '../services/character.service';
import { Character } from '../entities/character.entity';
import { CharacterDTO } from '@shared/interfaces/data.interface';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get()
  async findAll(): Promise<CharacterDTO[]> {
    return this.characterService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Character> {
    const character = await this.characterService.findOne(id);
    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }
    return character;
  }

  @Post()
  async create(@Body() createCharacterDto: CharacterDTO): Promise<Character> {
    // Convert array of radicals to comma-separated string for storage
    const characterData = {
      ...createCharacterDto,
      radicals: createCharacterDto.radicals?.join(','),
    };
    return this.characterService.create(characterData);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateCharacterDto: CharacterDTO,
  ): Promise<Character> {
    const character = await this.characterService.update(id, {
      ...updateCharacterDto,
      radicals: updateCharacterDto.radicals?.join(','),
    });
    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }
    return character;
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    const character = await this.characterService.findOne(id);
    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }
    return this.characterService.delete(id);
  }
}
