import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  Set,
  Tone,
  Actor,
  RadicalProp,
  Character,
  DataStructure,
} from '../shared/interfaces/data.interface';

@Injectable()
export class DataService {
  private data: DataStructure;

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      // Try to find the file in both development and production paths
      let filePath = join(__dirname, '..', 'data.json');
      if (!existsSync(filePath)) {
        // If not found, try the development path
        filePath = join(__dirname, '..', '..', 'src', 'data.json');
      }
      const fileContent = readFileSync(filePath, 'utf-8');
      this.data = JSON.parse(fileContent) as DataStructure;
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = {
        sets: {},
        tones: {},
        actors: [],
        radicalProps: [],
        characters: [],
      };
    }
  }

  getSets(): Set {
    return this.data.sets;
  }

  getTones(): Tone {
    return this.data.tones;
  }

  getActors(): Actor[] {
    return this.data.actors;
  }

  getRadicalProps(): RadicalProp[] {
    return this.data.radicalProps;
  }

  getCharacters(): Character[] {
    return this.data.characters;
  }

  // Additional utility methods
  getCharacterByCharacter(character: string): Character | undefined {
    return this.data.characters.find((char) => char.character === character);
  }

  getActorByInitial(initial: string): Actor | undefined {
    return this.data.actors.find((actor) => actor.initial === initial);
  }

  getRadicalPropByRadical(radical: string): RadicalProp | undefined {
    return this.data.radicalProps.find((prop) => prop.radical === radical);
  }
}
