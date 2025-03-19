export const TONE_MAP: { [key: string]: number } = {
  ā: 1,
  ē: 1,
  ī: 1,
  ō: 1,
  ū: 1,
  ǖ: 1,
  á: 2,
  é: 2,
  í: 2,
  ó: 2,
  ú: 2,
  ǘ: 2,
  ǎ: 3,
  ě: 3,
  ǐ: 3,
  ǒ: 3,
  ǔ: 3,
  ǚ: 3,
  à: 4,
  è: 4,
  ì: 4,
  ò: 4,
  ù: 4,
  ǜ: 4,
};

export const TONE_MARKS: { [key: string]: string[] } = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

// Common Pinyin initials (consonants)
export const PINYIN_INITIALS = 'zh|ch|sh|b|p|m|f|d|t|n|l|g|k|h|j|q|x|r|z|c|s|y|w';

// Common Pinyin finals (vowels and endings) with optional tone marks
export const PINYIN_FINALS = [
  // First handle syllables ending in 'n' with tone marks
  'i[āáǎàa]n|u[āáǎàa]n|[īíǐìi]an|[ūúǔùu]an|[āáǎàa]ng|[ēéěèe]ng|[īíǐìi]ng|[ōóǒòo]ng|[ūúǔùu]ng',
  // Then handle special cases with compound finals
  'i[āáǎàa]o|u[āáǎàa]o|[īíǐìi]ao|[ūúǔùu]ai',
  // Handle compound vowels with tone marks on either vowel
  'u[āáǎàa]|u[ōóǒòo]|i[āáǎàa]|i[ēéěèe]|[uü][ēéěèe]|[üǖǘǚǜ]e',
  // Handle compound vowels and diphthongs
  'ian|uan|[āáǎàa]n|[ēéěèe]n|[īíǐìi]n|[ōóǒòo]n|[ūúǔùu]n',
  'iao|uai|[āáǎàa]o|[āáǎàa]i|[ēéěèe]i|[ōóǒòo]u|[uü]o|[uü]i|[uü]a|ia|ie|ua|uo|üe',
  // Common endings
  'men',
  // Then single vowels with tone marks
  '[āáǎàa]|[ēéěèe]|[īíǐìi]|[ōóǒòo]|[ūúǔùu]|[üǖǘǚǜ]',
  // Special cases
  'er',
].join('|');

export const CHINESE_PUNCTUATION = [
  '。',
  '，',
  '！',
  '？',
  '、',
  '；',
  '：',
  '"',
  '"',
  "'",
  "'",
  '（',
  '）',
  '《',
  '》',
];
