import { IsEmail, IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class SignUpDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  surname: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsNumberString()
  dni: string;

  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
