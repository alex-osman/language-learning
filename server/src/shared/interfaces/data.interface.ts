import { SentenceDTO } from './sentence.interface';

export const TONES_MAPPED_TO_LOCATION = {
  '1': 'Outside the entrance',
  '2': 'Kitchen or inside entrance',
  '3': 'Bedroom or living room',
  '4': 'Bathroom or outside/yard',
  '5': 'On the roof',
};
export interface SetDTO {
  id: number;
  final: string;
  name: string;
  description?: string;
  toneLocations: ToneLocation[];
}

export interface ToneLocation {
  name: string;
  description?: string;
  toneNumber: number;
}

export interface Tone {
  [key: string]: string;
}

export interface ActorDTO {
  id: number;
  initial: string;
  name: string;
  description?: string;
  type: 'male' | 'female' | 'fictional';
}

export interface PropDTO {
  id: number;
  radical: string;
  prop?: string;
}

export interface CharacterDTO {
  id: number;
  character: string;
  pinyin: string;
  definition: string;

  initial: string;
  initialActor?: ActorDTO;

  final: string;
  finalSet?: SetDTO;

  toneNumber: number;
  toneLocation?: ToneLocation;

  movie?: string;
  imgUrl?: string;
  radicals?: PropDTO[];
  freq?: number;

  // Spaced Repetition Fields
  easinessFactor?: number;
  repetitions?: number;
  interval?: number;
  nextReviewDate?: Date;
  lastReviewDate?: Date;
  learnedDate?: Date;
  firstSeenDate?: Date; // NEW: Track when character was first encountered
  dueForReview?: boolean;

  sentences?: SentenceDTO[];
}

export interface WordDTO {
  id: number;
  word: string;
  pinyin: string;
  definition: string;
  notes?: string;
  frequencyRank?: number;
  lessonNumber?: number | null;
  partOfSpeech?: string | null;
  isProperNoun?: boolean;
  createdAt: Date;
}

export type WordKnowledgeStatus = 'unknown' | 'seen' | 'learning' | 'learned';

export interface LessonWordDTO {
  id: number;
  word: string;
  pinyin: string;
  definition: string;
  partOfSpeech?: string | null;
  isProperNoun: boolean;
  knowledgeStatus: WordKnowledgeStatus;
}

export interface LessonSummaryDTO {
  lessonNumber: number;
  wordCount: number;
  seenCount: number;
  learningCount: number;
  learnedCount: number;
}

export type CharKnowledgeStatus = 'unknown' | 'seen' | 'learning' | 'learned';

export interface CharKnowledgeDTO {
  status: CharKnowledgeStatus;
  score: number; // 0–1, for learning/learned gradient (red → green)
  pinyin?: string;
  definition?: string;
  easinessFactor?: number;
  repetitions?: number;
}

export interface LessonSentenceDTO {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  dialogueNumber: number;
  sequenceOrder: number;
}

export interface LessonDetailDTO {
  lessonNumber: number;
  words: LessonWordDTO[];
  charKnowledge: Record<string, CharKnowledgeDTO>; // keyed by Chinese character
  dialogues: LessonSentenceDTO[][];  // dialogues[0] = Dialogue I, dialogues[1] = Dialogue II
}

export interface DataStructure {
  sets: SetDTO[];
  tones: Tone;
  actors: ActorDTO[];
  radicalProps: PropDTO[];
  characters: CharacterDTO[];
  movie?: string;
}
