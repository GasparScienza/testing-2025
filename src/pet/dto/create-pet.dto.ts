import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePetDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  species: string;
  @IsString()
  @IsOptional()
  notes: string;
  @IsString()
  @IsOptional()
  breed: string;
}
