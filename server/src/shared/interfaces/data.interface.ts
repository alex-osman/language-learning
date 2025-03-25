export interface Set {
  [key: string]: string;
}

export interface Tone {
  [key: string]: string;
}

export interface Actor {
  initial: string;
  name: string;
  type: 'male' | 'female' | 'fictional';
}

export interface RadicalProp {
  radical: string;
  prop?: string;
}

export interface Character {
  character: string;
  pinyin?: string;
  definition?: string;
  props?: string[];
  movie?: string;
  imgUrl?: string;
}

export interface DataStructure {
  sets: Set;
  tones: Tone;
  actors: Actor[];
  radicalProps: RadicalProp[];
  characters: Character[];
  movie?: string;
}
