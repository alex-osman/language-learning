export class CreateSentenceDTO {
  sceneId: number;
  sentence: string;
  pinyin?: string;
  translation?: string;
  audioUrl?: string;
  source?: string;
  level?: number;
}

export class SentenceDTO {
  id: number;
  sceneId: number;
  sentence: string;
  pinyin?: string;
  translation?: string;
  audioUrl?: string;
  source?: string;
  level?: number;
  easinessFactor?: number;
  repetitions?: number;
  interval?: number;
  nextReviewDate?: Date;
  lastReviewDate?: Date;
}
