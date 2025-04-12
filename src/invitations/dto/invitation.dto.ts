import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsISO8601, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';
import { InvitationStatus } from '../enums/invitation-status.enum';

/**
 * DTO para representar una invitación
 */
export class InvitationDto {
  /**
   * ID único de la invitación
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({ description: 'ID único de la invitación', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  /**
   * Correo electrónico del usuario invitado
   * @example "usuario@ejemplo.com"
   */
  @ApiProperty({ description: 'Correo electrónico del usuario invitado', example: 'usuario@ejemplo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Nombre del usuario invitado
   * @example "Juan Pérez"
   */
  @ApiProperty({ description: 'Nombre del usuario invitado', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Rol asignado al usuario en la compañía
   * @example "OPERATOR"
   */
  @ApiProperty({ description: 'Rol asignado al usuario en la compañía', example: 'OPERATOR', enum: UserRole })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  /**
   * ID de la compañía a la que se invita al usuario
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({ description: 'ID de la compañía a la que se invita al usuario', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  /**
   * Estado actual de la invitación
   * @example "PENDING"
   */
  @ApiProperty({ description: 'Estado actual de la invitación', example: 'PENDING', enum: InvitationStatus })
  @IsEnum(InvitationStatus)
  @IsNotEmpty()
  status: InvitationStatus;

  /**
   * ID del usuario que creó la invitación
   * @example "123e4567-e89b-12d3-a456-426614174001"
   */
  @ApiProperty({ description: 'ID del usuario que creó la invitación', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsNotEmpty()
  createdBy: string;

  /**
   * Token único para la invitación
   * @example "abc123xyz456"
   */
  @ApiProperty({ description: 'Token único para la invitación', example: 'abc123xyz456' })
  @IsString()
  @IsNotEmpty()
  token: string;

  /**
   * Fecha de expiración de la invitación
   * @example "2023-12-31T23:59:59Z"
   */
  @ApiProperty({ description: 'Fecha de expiración de la invitación', example: '2023-12-31T23:59:59Z' })
  @IsISO8601()
  @IsNotEmpty()
  expiresAt: string;

  /**
   * Fecha de aceptación de la invitación (si ha sido aceptada)
   * @example "2023-12-20T15:30:45Z"
   */
  @ApiPropertyOptional({ description: 'Fecha de aceptación de la invitación', example: '2023-12-20T15:30:45Z' })
  @IsISO8601()
  @IsOptional()
  acceptedAt?: string;

  /**
   * ID del usuario que se creó al aceptar la invitación (si aplica)
   * @example "123e4567-e89b-12d3-a456-426614174002"
   */
  @ApiPropertyOptional({ description: 'ID del usuario creado al aceptar la invitación', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  /**
   * Mensaje personalizado de la invitación
   * @example "Te invito a unirte a nuestra plataforma de gestión de consentimientos"
   */
  @ApiPropertyOptional({ description: 'Mensaje personalizado de la invitación', example: 'Te invito a unirte a nuestra plataforma de gestión de consentimientos' })
  @IsString()
  @IsOptional()
  message?: string;

  /**
   * Metadatos adicionales de la invitación
   * @example { "source": "campaña_onboarding", "priority": "alta" }
   */
  @ApiPropertyOptional({ description: 'Metadatos adicionales de la invitación', example: { source: 'campaña_onboarding', priority: 'alta' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  /**
   * Fecha de creación de la invitación
   * @example "2023-12-15T10:00:00Z"
   */
  @ApiProperty({ description: 'Fecha de creación de la invitación', example: '2023-12-15T10:00:00Z' })
  @IsISO8601()
  @IsNotEmpty()
  createdAt: string;

  /**
   * Fecha de última actualización de la invitación
   * @example "2023-12-15T10:00:00Z"
   */
  @ApiProperty({ description: 'Fecha de última actualización de la invitación', example: '2023-12-15T10:00:00Z' })
  @IsISO8601()
  @IsNotEmpty()
  updatedAt: string;
} 