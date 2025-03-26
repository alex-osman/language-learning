import { ActorDTO } from '../services/data.service';

export interface MandarinBlueprint {
  sets: { [key: string]: string };
  tones: { [key: string]: string };
  actors: ActorDTO[];
  radicalProps: { radical: string; prop?: string }[];
  characters: {
    character: string;
    pinyin?: string;
    definition?: string;
    movie?: string;
    props?: { radical: string; prop?: string }[];
  }[];
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

export interface RadicalProp {
  radical: string;
  prop: string;
  description?: string;
}
