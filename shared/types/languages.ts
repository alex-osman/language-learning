export const TONES_MAPPED_TO_LOCATION = {
  '1': 'Outside the entrance',
  '2': 'Kitchen or inside entrance',
  '3': 'Bedroom or living room',
  '4': 'Bathroom or outside/yard',
  '5': 'On the roof',
};

export enum Language {
  CHINESE = 'Chinese',
  PINYIN = 'Pinyin',
  ENGLISH = 'English',
  FRENCH = 'French',
}

export enum LanguageCode {
  CHINESE = 'zh',
  ENGLISH = 'en',
  FRENCH = 'fr',
}

export const DEFAULT_CHINESE_LANGUAGES = [Language.CHINESE, Language.PINYIN, Language.ENGLISH];
export const DEFAULT_FRENCH_LANGUAGES = [Language.FRENCH, Language.ENGLISH];
