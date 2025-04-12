import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength, IsOptional } from 'class-validator';

/**
 * DTO para aceptar una invitación
 */
export class AcceptInvitationDto {
  /**
   * Token de la invitación
   * @example "abc123xyz456"
   */
  @ApiProperty({ description: 'Token de la invitación', example: 'abc123xyz456' })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  /**
   * Contraseña para la creación de la cuenta (si el usuario no existe)
   * @example "P@ssw0rd123"
   */
  @ApiProperty({ description: 'Contraseña para la creación de la cuenta', example: 'P@ssw0rd123' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  password?: string;

  /**
   * Nombre completo (solo requerido si es diferente al proporcionado en la invitación)
   * @example "Juan Carlos Pérez"
   */
  @ApiProperty({ description: 'Nombre completo', example: 'Juan Carlos Pérez' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsOptional()
  name?: string;
} 