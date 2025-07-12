export interface SentenceDTO {
  id: number;
  sentence: string;
  pinyin: string;
  translation: string;
  audioUrl?: string;
  source?: string;
  level?: number;

  // Spaced Repetition Fields
  easinessFactor: number;
  repetitions: number;
  interval: number;
  nextReviewDate?: Date;
  lastReviewDate?: Date;
  dueForReview: boolean;

  // Scene context
  sceneId?: string;
  startMs?: number;
  endMs?: number;
}

export interface SceneProgressStats {
  totalSentences: number;
  practicedSentences: number;
  averageEasiness: number;
  averageInterval: number;
  completionPercentage: number;
}
