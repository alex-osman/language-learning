export interface RadicalProp {
  radical: string;
  prop: string;
}

export class MovieGenerationRequestDto {
  character!: string;
  pinyin!: string;
  definition!: string;
  actor!: string;
  set!: string;
  tone!: string;
  toneLocation: string;
  radicalProps!: RadicalProp[];
}

export class MovieGenerationResponseDto {
  movie!: string;
}
