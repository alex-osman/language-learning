import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCharacterDTO {
  @IsString()
  @IsNotEmpty()
  character: string;

  @IsString()
  @IsNotEmpty()
  pinyin: string;

  @IsString()
  @IsNotEmpty()
  definition: string;

  @IsString()
  @IsOptional()
  radicals?: string;
}
