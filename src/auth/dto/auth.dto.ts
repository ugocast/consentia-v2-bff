import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email: string;

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({ description: 'Contraseña del usuario (mínimo 6 caracteres)', example: 'Abc123*!' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'Abc123*!' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: 'Nueva contraseña del usuario (mínimo 6 caracteres)', example: 'Abc123*!' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token de verificación de email', example: 'abc123xyz' })
  @IsString()
  @IsNotEmpty({ message: 'El token de verificación es requerido' })
  token: string;
}

export class CompanyBasicInfoDto {
  @ApiProperty({ description: 'ID de la compañía', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4')
  id: string;

  @ApiProperty({ description: 'Nombre de la compañía', example: 'Acme Inc.' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Rol del usuario en la compañía', example: 'ADMIN' })
  @IsString()
  role: string;
}

export class OnboardingStatusResponseDto {
  @ApiProperty({ description: 'Indica si el email ha sido verificado', example: true })
  hasVerifiedEmail: boolean;

  @ApiProperty({ description: 'Indica si el usuario pertenece a alguna compañía', example: false })
  hasCompany: boolean;

  @ApiProperty({ description: 'Lista de compañías a las que pertenece el usuario', type: [CompanyBasicInfoDto] })
  @IsArray()
  companies: CompanyBasicInfoDto[];
}
