export interface LessonRoleplayLineDto {
  chinese: string;
  pinyin: string;
  english: string;
}

export interface LessonRoleplayTranscriptTurnDto {
  speaker: 'tutor' | 'learner';
  chinese?: string;
  pinyin?: string;
  english?: string;
  text?: string;
}

export interface LessonRoleplayContextDto {
  title: string;
  description: string;
  scenario: string;
  openingLine: LessonRoleplayLineDto;
  targetPatterns: string[];
  allowedVocabulary: string[];
  conversationGoals: string[];
}

export class LessonRoleplayRequestDto {
  lessonNumber: number;
  learnerMessage: string;
  conversationHistory: LessonRoleplayTranscriptTurnDto[];
  context: LessonRoleplayContextDto;
}
