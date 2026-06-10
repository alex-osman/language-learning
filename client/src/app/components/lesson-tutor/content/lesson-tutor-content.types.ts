import { LessonSentenceDTO, LessonWordDTO } from '../../../services/lesson.service';

export type TutorMode = 'dialogue' | 'roleplay' | 'vocab' | 'patterns' | 'family' | 'review';

export interface TutorLine extends LessonSentenceDTO {
  keyVocab: string[];
}

export interface TutorWord extends LessonWordDTO {
  sourceOrder: number;
}

export interface ChoiceDrill {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  selected: string;
  explanation: string;
}

export interface PatternCard {
  title: string;
  example: string;
  explanation: string;
}

export interface PersonalSelection {
  key: string;
  label: string;
  chinese: string;
  selected: boolean;
  detailText: string;
}

export interface PersonalProfile {
  firstNumber: number;
  secondNumber: number;
  firstText: string;
  secondText: string;
  selections: PersonalSelection[];
}

export interface PersonalFieldConfig {
  key: keyof Pick<PersonalProfile, 'firstNumber' | 'secondNumber' | 'firstText' | 'secondText'>;
  label: string;
  inputType: 'number' | 'text';
  min?: number;
  max?: number;
}

export type PersonalSentencePart =
  | { kind: 'literal'; value: string }
  | { kind: 'profile'; key: keyof Pick<PersonalProfile, 'firstNumber' | 'secondNumber' | 'firstText' | 'secondText'>; fallback?: string }
  | { kind: 'selection'; field: 'chinese' | 'detailText'; fallback?: string }
  | { kind: 'selectedValue'; key?: string; chineseIncludes?: string; field: 'chinese' | 'detailText'; fallback: string };

export type PersonalSentenceTemplate =
  | { kind: 'single'; parts: PersonalSentencePart[] }
  | { kind: 'forEachSelection'; selected: boolean; limit?: number; parts: PersonalSentencePart[]; fallbackParts?: PersonalSentencePart[] };

export interface PersonalPracticeConfig {
  title: string;
  description: string;
  fields: PersonalFieldConfig[];
  selectionHeading: string;
  selectionDetailLabel?: string;
  selectionDetailPlaceholder?: string;
  generatedLabel: string;
  storageKey: string;
  defaultProfile: PersonalProfile;
  sentenceTemplates: PersonalSentenceTemplate[];
}

export interface RoleplayLine {
  chinese: string;
  pinyin: string;
  english: string;
}

export interface RoleplayConfig {
  title: string;
  description: string;
  scenario: string;
  openingLine: RoleplayLine;
  targetPatterns: string[];
  allowedVocabulary: string[];
  conversationGoals: string[];
}

export interface RoleplayTranscriptTurn {
  speaker: 'tutor' | 'learner';
  chinese?: string;
  pinyin?: string;
  english?: string;
  text?: string;
  showPinyin?: boolean;
  showEnglish?: boolean;
}

export interface RoleplayTurnRequest {
  lessonNumber: number;
  learnerMessage: string;
  conversationHistory: RoleplayTranscriptTurn[];
  context: RoleplayConfig;
}

export interface RoleplayTurnResponse extends RoleplayLine {}

export interface TutorContent {
  lessonNumber: number;
  title: string;
  chineseTitle: string;
  pinyinTitle: string;
  heroCopy: string;
  sourceNote: string;
  detailRoute: string;
  dialogueTitle: string;
  dialogueGuide: string;
  vocabNote: string;
  words: Array<Pick<TutorWord, 'word' | 'pinyin' | 'partOfSpeech' | 'definition' | 'isProperNoun' | 'sourceOrder'>>;
  dialogues: TutorLine[][];
  patterns: PatternCard[];
  drills: ChoiceDrill[];
  personalPractice: PersonalPracticeConfig;
  roleplay?: RoleplayConfig;
}

export interface TutorContentValidationResult {
  errors: string[];
  warnings: string[];
}

export interface TutorCharSpan {
  char: string;
  color: string;
}

export interface TutorLineState {
  pinyin: boolean;
  english: boolean;
  practiced: boolean;
}

export function cloneDrills(drills: ChoiceDrill[]): ChoiceDrill[] {
  return drills.map((drill) => ({ ...drill, choices: [...drill.choices], selected: '' }));
}

export function cloneProfile(profile: PersonalProfile): PersonalProfile {
  return {
    firstNumber: profile.firstNumber,
    secondNumber: profile.secondNumber,
    firstText: profile.firstText,
    secondText: profile.secondText,
    selections: profile.selections.map((selection) => ({ ...selection })),
  };
}

export function generatePersonalSentences(config: PersonalPracticeConfig, profile: PersonalProfile): string[] {
  const sentences: string[] = [];

  for (const template of config.sentenceTemplates) {
    if (template.kind === 'single') {
      sentences.push(renderParts(template.parts, profile));
      continue;
    }

    const selections = profile.selections
      .filter((selection) => selection.selected === template.selected)
      .slice(0, template.limit);

    for (const selection of selections) {
      const detail = selection.detailText.trim();
      const parts = detail ? template.parts : template.fallbackParts ?? template.parts;
      sentences.push(renderParts(parts, profile, selection));
    }
  }

  return sentences.filter(Boolean);
}

function renderParts(parts: PersonalSentencePart[], profile: PersonalProfile, selection?: PersonalSelection): string {
  return parts.map((part) => renderPart(part, profile, selection)).join('');
}

function renderPart(part: PersonalSentencePart, profile: PersonalProfile, selection?: PersonalSelection): string {
  switch (part.kind) {
    case 'literal':
      return part.value;
    case 'profile': {
      const value = profile[part.key];
      return `${value || part.fallback || ''}`;
    }
    case 'selection': {
      const value = selection?.[part.field]?.trim();
      return value || part.fallback || '';
    }
    case 'selectedValue': {
      const match = profile.selections.find((item) => {
        if (!item.selected) return false;
        if (part.key && item.key !== part.key) return false;
        if (part.chineseIncludes && !item.chinese.includes(part.chineseIncludes)) return false;
        return true;
      });
      return match?.[part.field]?.trim() || part.fallback;
    }
  }
}
