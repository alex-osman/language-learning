export interface MandarinBlueprint {
  sets: { [key: string]: string };
  tones: { [key: string]: string };
  actors: Actor[];
  radicalProps: { radical: string; prop?: string }[];
  characters: { character: string; pinyin?: string; definition?: string }[];
}

export interface PhoneticSet {
  final: string;
  location: string;
  description?: string;
}

export interface ToneLocation {
  tone: string;
  location: string;
  description?: string;
}

export interface Actor {
  initial: string;
  name: string;
  type?: string;
}

export interface RadicalProp {
  radical: string;
  prop: string;
  description?: string;
}
