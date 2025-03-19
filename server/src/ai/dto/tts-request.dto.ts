export class TtsRequestDto {
  text: string;
  speed?: 'slow' | 'normal' = 'normal';
} 