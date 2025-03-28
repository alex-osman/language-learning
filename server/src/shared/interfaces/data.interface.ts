export const TONES_MAPPED_TO_LOCATION = {
  '1': 'Outside the entrance',
  '2': 'Kitchen or inside entrance',
  '3': 'Bedroom or living room',
  '4': 'Bathroom or outside/yard',
  '5': 'On the roof',
};
export interface SetDTO {
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

export interface Actor {
  initial: string;
  name: string;
  description?: string;
  type: 'male' | 'female' | 'fictional';
}

export interface RadicalProp {
  radical: string;
  prop?: string;
}

export interface CharacterDTO {
  character: string;
  pinyin: string;
  definition: string;
  movie?: string;
  imgUrl?: string;
  radicals?: string[];
}

export interface DataStructure {
  sets: SetDTO[];
  tones: Tone;
  actors: Actor[];
  radicalProps: RadicalProp[];
  characters: CharacterDTO[];
  movie?: string;
}
