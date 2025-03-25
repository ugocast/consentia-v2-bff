import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * DTO para representar una entrada en el historial de actividad
 */
export class ActivityEntryDto {
  /**
   * Tipo de actividad realizada
   * @example "login"
   */
  @IsString()
  activityType: string;

  /**
   * Fecha y hora de la actividad
   * @example "2023-05-20T15:30:45Z"
   */
  @IsDateString()
  timestamp: string;

  /**
   * IP desde la que se realizó la actividad
   * @example "192.168.1.100"
   */
  @IsString()
  @IsOptional()
  ipAddress?: string;

  /**
   * Dispositivo desde el que se realizó la actividad
   * @example "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
   */
  @IsString()
  @IsOptional()
  userAgent?: string;

  /**
   * Metadatos adicionales según el tipo de actividad
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO para la respuesta con el historial de actividad de un usuario
 */
export class UserActivityDto {
  /**
   * ID del usuario
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsString()
  userId: string;

  /**
   * Lista de entradas de actividad
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityEntryDto)
  activities: ActivityEntryDto[];
} 