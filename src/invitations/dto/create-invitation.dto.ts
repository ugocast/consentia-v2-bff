import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';

/**
 * DTO para la creación de invitaciones de usuario
 */
export class CreateInvitationDto {
  /**
   * Correo electrónico del usuario a invitar
   * @example "usuario@ejemplo.com"
   */
  @ApiProperty({ description: 'Correo electrónico del usuario a invitar', example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  /**
   * Nombre del usuario a invitar
   * @example "Juan Pérez"
   */
  @ApiProperty({ description: 'Nombre del usuario a invitar', example: 'Juan Pérez' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  /**
   * Rol que tendrá el usuario en la compañía
   * @example "OPERATOR"
   */
  @ApiProperty({ description: 'Rol que tendrá el usuario en la compañía', example: 'OPERATOR', enum: UserRole })
  @IsEnum(UserRole, { message: 'El rol debe ser válido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  role: UserRole;

  /**
   * ID de la compañía a la que se invita al usuario
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({ description: 'ID de la compañía a la que se invita al usuario', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4', { message: 'El ID de compañía debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de compañía es requerido' })
  companyId: string;

  /**
   * Mensaje personalizado opcional para la invitación
   * @example "Te invito a unirte a nuestra plataforma de gestión de consentimientos"
   */
  @ApiPropertyOptional({ description: 'Mensaje personalizado para la invitación', example: 'Te invito a unirte a nuestra plataforma de gestión de consentimientos' })
  @IsString({ message: 'El mensaje debe ser una cadena de texto' })
  @IsOptional()
  message?: string;

  /**
   * Metadatos adicionales para la invitación
   * @example { "source": "campaña_onboarding", "priority": "alta" }
   */
  @ApiPropertyOptional({ description: 'Metadatos adicionales para la invitación', example: { source: 'campaña_onboarding', priority: 'alta' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 