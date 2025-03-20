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
