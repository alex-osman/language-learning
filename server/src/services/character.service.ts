import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../entities/character.entity';
import { CharacterDTO } from '@shared/interfaces/data.interface';

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
  ) {}

  async findAll(): Promise<CharacterDTO[]> {
    const all = await this.characterRepository.find();
    return all.map((c) => ({
      ...c,
      radicals: c.radicals?.split(',') ?? [],
    }));
  }

  async findOne(id: number): Promise<Character | null> {
    return this.characterRepository.findOne({ where: { id } });
  }

  async findByCharacter(char: string): Promise<Character | null> {
    return this.characterRepository.findOne({ where: { character: char } });
  }

  async create(character: Partial<Character>): Promise<Character> {
    const newCharacter = this.characterRepository.create(character);
    return this.characterRepository.save(newCharacter);
  }

  async update(
    id: number,
    character: Partial<Character>,
  ): Promise<Character | null> {
    await this.characterRepository.update(id, character);
    return this.characterRepository.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.characterRepository.delete(id);
  }

  // Method to import data from JSON
  async importFromJson(characters: Partial<Character>[]): Promise<void> {
    // Clear existing data
    await this.characterRepository.clear();

    // Create new characters
    const newCharacters = this.characterRepository.create(characters);
    await this.characterRepository.save(newCharacters);
  }
}
