// Two-letter initials in pinyin
export const TWO_LETTER_INITIALS = ['zh', 'ch', 'sh', 'ji', 'qi', 'xi', 'du', 'ru', 'shu'];

// Mapping for finals to their correct form
export const FINAL_MAPPINGS: { [key: string]: string } = {
  i: 'e',
  ie: 'e',
  r: 'er',
  u: 'ou',
  ü: 'ou',
};

// Mapping for special initial cases
export const INITIAL_MAPPINGS: { [key: string]: string } = {
  n: 'ni',
  j: 'ji',
  q: 'qi',
  x: 'xi',
};

// Mapping for tone marks to tone numbers
export const TONE_MAP: { [key: string]: string } = {
  ā: '1',
  á: '2',
  ǎ: '3',
  à: '4',
  ē: '1',
  é: '2',
  ě: '3',
  è: '4',
  ī: '1',
  í: '2',
  ǐ: '3',
  ì: '4',
  ō: '1',
  ó: '2',
  ǒ: '3',
  ò: '4',
  ū: '1',
  ú: '2',
  ǔ: '3',
  ù: '4',
  ǖ: '1',
  ǘ: '2',
  ǚ: '3',
  ǜ: '4',
};

// Mapping for tone-marked vowels to their plain versions
export const VOWEL_MAP: { [key: string]: string } = {
  ā: 'a',
  á: 'a',
  ǎ: 'a',
  à: 'a',
  ē: 'e',
  é: 'e',
  ě: 'e',
  è: 'e',
  ī: 'i',
  í: 'i',
  ǐ: 'i',
  ì: 'i',
  ō: 'o',
  ó: 'o',
  ǒ: 'o',
  ò: 'o',
  ū: 'u',
  ú: 'u',
  ǔ: 'u',
  ù: 'u',
  ǖ: 'ü',
  ǘ: 'ü',
  ǚ: 'ü',
  ǜ: 'ü',
};
