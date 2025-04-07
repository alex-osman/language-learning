export interface SentenceDTO {
  id: number;
  sentence: string;
  pinyin: string;
  translation: string;
  audioUrl?: string;
  source?: string;
  level?: number;

  // Spaced Repetition Fields
  easinessFactor?: number;
  repetitions?: number;
  interval?: number;
  nextReviewDate?: Date;
  lastReviewDate?: Date;
  dueForReview?: boolean;
}
