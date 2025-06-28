import { SentenceDTO } from './sentence.interface';

export const TONES_MAPPED_TO_LOCATION = {
  '1': 'Outside the entrance',
  '2': 'Kitchen or inside entrance',
  '3': 'Bedroom or living room',
  '4': 'Bathroom or outside/yard',
  '5': 'On the roof',
};
export interface SetDTO {
  id: number;
  final: string;
  name: string;
  description?: string;
  toneLocations: ToneLocation[];
}

export interface ToneLocation {
  name: string;
  description?: string;
  toneNumber: number;
}

export interface Tone {
  [key: string]: string;
}

export interface ActorDTO {
  id: number;
  initial: string;
  name: string;
  description?: string;
  type: 'male' | 'female' | 'fictional';
}

export interface PropDTO {
  id: number;
  radical: string;
  prop?: string;
}

export interface CharacterDTO {
  id: number;
  character: string;
  pinyin: string;
  definition: string;

  initial: string;
  initialActor?: ActorDTO;

  final: string;
  finalSet?: SetDTO;

  toneNumber: number;
  toneLocation?: ToneLocation;

  movie?: string;
  imgUrl?: string;
  radicals?: PropDTO[];
  freq?: number;

  // Spaced Repetition Fields
  easinessFactor?: number;
  repetitions?: number;
  interval?: number;
  nextReviewDate?: Date;
  lastReviewDate?: Date;
  dueForReview?: boolean;

  sentences?: SentenceDTO[];
}

export interface WordDTO {
  id: number;
  word: string;
  pinyin: string;
  definition: string;
  notes?: string;
  frequencyRank?: number;
  createdAt: Date;
}

export interface DataStructure {
  sets: SetDTO[];
  tones: Tone;
  actors: ActorDTO[];
  radicalProps: PropDTO[];
  characters: CharacterDTO[];
  movie?: string;
}
