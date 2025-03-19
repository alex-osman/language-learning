export interface CharacterMapping {
  char: string;
  pinyin: string;
  groupIndex: number;
}

export interface Sentence {
  chinese: string;
  pinyin: string;
  english: string;
  french: string;
  characterMappings: CharacterMapping[];
  id: number;
}