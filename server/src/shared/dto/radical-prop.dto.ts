import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRadicalPropDTO {
  @IsString()
  @IsNotEmpty()
  radical: string;

  @IsString()
  @IsNotEmpty()
  prop: string;
}
