import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateActorDTO {
  @IsString()
  @IsNotEmpty()
  initial: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description?: string;

  @IsEnum(['male', 'female', 'fictional'])
  @IsNotEmpty()
  type: 'male' | 'female' | 'fictional';
}
