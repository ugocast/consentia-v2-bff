import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO para la verificación de acceso al portal de autogestión
 */
export class PortalVerificationDto {
  /**
   * Token de acceso para el portal
   * @example "abc123xyz456"
   */
  @IsString()
  @IsNotEmpty()
  token: string;
} 