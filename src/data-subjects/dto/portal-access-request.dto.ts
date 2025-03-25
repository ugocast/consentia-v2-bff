import { IsEmail, IsString } from 'class-validator';

/**
 * DTO para la solicitud de acceso al portal de autogestión
 */
export class PortalAccessRequestDto {
  /**
   * Correo electrónico del titular de datos
   * @example "juan.perez@example.com"
   */
  @IsEmail()
  email: string;
} 