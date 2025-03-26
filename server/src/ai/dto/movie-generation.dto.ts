import { Actor, SetDTO } from '@shared/interfaces/data.interface';

export interface RadicalProp {
  radical: string;
  prop: string;
}

export class MovieGenerationRequestDto {
  character!: string;
  pinyin!: string;
  definition!: string;
  actor: Actor;
  set: SetDTO;
  tone!: string;
  toneLocation: string;
  radicalProps!: RadicalProp[];
}

export class MovieGenerationResponseDto {
  movie!: string;
}
