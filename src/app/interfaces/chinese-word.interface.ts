export interface ChineseWord {
  characters: string;
  pinyin: string;
  definition: string;
  audioUrls: string[];  // Array of URLs, one for each syllable
  groupIndex: number;
} 