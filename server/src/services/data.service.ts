import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  SetDTO,
  Tone,
  CharacterDTO,
  DataStructure,
} from '../shared/interfaces/data.interface';

@Injectable()
export class DataService {
  private data: DataStructure;
  private dataFilePath: string;

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      // Try to find the file in both development and production paths
      this.dataFilePath = join(__dirname, '..', 'data.json');
      if (!existsSync(this.dataFilePath)) {
        // If not found, try the development path
        this.dataFilePath = join(__dirname, '..', '..', 'src', 'data.json');
      }
      const fileContent = readFileSync(this.dataFilePath, 'utf-8');
      this.data = JSON.parse(fileContent) as DataStructure;
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = {
        sets: [],
        tones: {},
        actors: [],
        radicalProps: [],
        characters: [],
      };
    }
  }

  private saveData(): void {
    try {
      const jsonData = JSON.stringify(this.data, null, 2);
      writeFileSync(this.dataFilePath, jsonData, 'utf-8');
    } catch (error) {
      console.error('Error saving data:', error);
      throw new Error('Failed to save data');
    }
  }

  getSets(): SetDTO[] {
    return this.data.sets;
  }

  getTones(): Tone {
    return this.data.tones;
  }

  getCharacters(): CharacterDTO[] {
    return this.data.characters;
  }

  // Additional utility methods
  getCharacterByCharacter(character: string): CharacterDTO | undefined {
    return this.data.characters.find((char) => char.character === character);
  }

  // Method to add or update a movie for a character
  addMovieToCharacter(character: string, movie: string): void {
    this.loadData();

    const characterIndex = this.data.characters.findIndex(
      (char) => char.character === character,
    );

    if (characterIndex === -1) {
      throw new Error(`Character ${character} not found`);
    }

    this.data.characters[characterIndex].movie = movie;
    this.saveData();
  }

  addCharacter(
    character: string,
    pinyin: string,
    definition: string,
    radicals?: string,
  ): CharacterDTO {
    const newCharacter: CharacterDTO = {
      character,
      pinyin,
      definition,
      radicals: radicals
        ? radicals.split(' ').filter((r) => r.length > 0)
        : undefined,
    };

    // Check if character already exists
    const existingIndex = this.data.characters.findIndex(
      (char) => char.character === character,
    );

    if (existingIndex !== -1) {
      // Update existing character
      this.data.characters[existingIndex] = {
        ...this.data.characters[existingIndex],
        ...newCharacter,
      };
    } else {
      // Add new character
      this.data.characters.push(newCharacter);
    }

    this.saveData();
    return newCharacter;
  }
}
