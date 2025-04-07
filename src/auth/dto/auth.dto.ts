import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
  
  @IsOptional()
  @IsUUID('4', { message: 'El ID de compañía debe ser un UUID válido' })
  companyId?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email: string;
}

export class UpdatePasswordDto {
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
