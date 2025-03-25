import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * DTO para la configuración de notificaciones de la empresa.
 */
export class NotificationSettingsDto {
  /**
   * Habilitar/deshabilitar notificaciones por email.
   */
  @IsBoolean()
  @IsOptional()
  email_notifications?: boolean;

  /**
   * Habilitar/deshabilitar notificaciones por SMS.
   */
  @IsBoolean()
  @IsOptional()
  sms_notifications?: boolean;

  /**
   * Frecuencia de envío de notificaciones.
   */
  @IsString()
  @IsOptional()
  notification_frequency?: string;
}

/**
 * DTO para la configuración de privacidad de la empresa.
 */
export class PrivacySettingsDto {
  /**
   * Período de retención de datos en días.
   */
  @IsNumber()
  @IsOptional()
  data_retention_period?: number;

  /**
   * Permitir compartir datos con terceros.
   */
  @IsBoolean()
  @IsOptional()
  allow_data_sharing?: boolean;

  /**
   * Requerir consentimiento explícito para el procesamiento de datos.
   */
  @IsBoolean()
  @IsOptional()
  require_explicit_consent?: boolean;
}

/**
 * DTO para la configuración de marca de la empresa.
 */
export class BrandingSettingsDto {
  /**
   * URL del logo de la empresa.
   */
  @IsString()
  @IsOptional()
  logo_url?: string;

  /**
   * Color primario en formato hexadecimal.
   */
  @IsString()
  @IsOptional()
  primary_color?: string;

  /**
   * Color secundario en formato hexadecimal.
   */
  @IsString()
  @IsOptional()
  secondary_color?: string;
}

/**
 * DTO para la configuración completa de una empresa.
 */
export class CompanyConfigDto {
  /**
   * Configuración de notificaciones.
   */
  @IsObject()
  @IsOptional()
  notification_settings?: NotificationSettingsDto;

  /**
   * Configuración de privacidad.
   */
  @IsObject()
  @IsOptional()
  privacy_settings?: PrivacySettingsDto;

  /**
   * Configuración de marca.
   */
  @IsObject()
  @IsOptional()
  branding_settings?: BrandingSettingsDto;
} 