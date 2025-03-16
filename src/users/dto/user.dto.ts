import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UserDto {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email?: string;
} 