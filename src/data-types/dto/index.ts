import { IsString, IsEnum, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export enum DataType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  FILE = 'file',
  IMAGE = 'image',
  DOCUMENT = 'document',
  CUSTOM = 'custom'
}

export enum DataTypeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted'
}

/**
 * DTO para la respuesta de tipos de datos
 */
export class DataTypeDto {
  /**
   * ID único del tipo de datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * ID de la compañía
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  companyId: string;

  /**
   * Nombre del tipo de datos
   * @example "Email"
   */
  name: string;

  /**
   * Código único del tipo de datos
   * @example "EMAIL"
   */
  code: string;

  /**
   * Descripción del tipo de datos
   * @example "Dirección de correo electrónico"
   */
  description?: string;

  /**
   * Tipo de datos
   * @example "EMAIL"
   */
  type: DataType;

  /**
   * Configuración específica del tipo de datos
   * @example { "maxLength": 100, "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" }
   */
  config?: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
    multiple?: boolean;
    allowedTypes?: string[];
    maxSize?: number;
    customValidation?: string;
  };

  /**
   * Indica si el tipo de datos es requerido
   * @example true
   */
  required: boolean;

  /**
   * Indica si el tipo de datos es único
   * @example false
   */
  unique: boolean;

  /**
   * Indica si el tipo de datos es sensible
   * @example true
   */
  sensitive: boolean;

  /**
   * Indica si el tipo de datos está activo
   * @example true
   */
  active: boolean;

  /**
   * Versión del tipo de datos
   * @example 1
   */
  version: number;

  /**
   * Validación del tipo de datos
   * @example { "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" }
   */
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    custom?: string;
  };

  /**
   * Estado del tipo de datos
   * @example "active"
   */
  status: DataTypeStatus;

  /**
   * Metadatos adicionales
   * @example { "category": "contact", "tags": ["personal", "communication"] }
   */
  metadata?: Record<string, any>;

  /**
   * ID del usuario que creó el tipo de datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  createdBy: string;

  /**
   * ID del usuario que actualizó por última vez el tipo de datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  updatedBy: string;

  /**
   * Fecha de creación
   * @example "2024-03-20T12:00:00Z"
   */
  createdAt: string;

  /**
   * Fecha de última actualización
   * @example "2024-03-20T12:00:00Z"
   */
  updatedAt: string;
}

/**
 * DTO para la creación de tipos de datos
 */
export class CreateDataTypeDto {
  /**
   * Nombre del tipo de datos
   * @example "Email"
   */
  @IsString()
  name: string;

  /**
   * Código único del tipo de datos
   * @example "EMAIL"
   */
  @IsString()
  code: string;

  /**
   * Descripción del tipo de datos
   * @example "Dirección de correo electrónico"
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Tipo de datos
   * @example "EMAIL"
   */
  @IsEnum(DataType)
  type: DataType;

  /**
   * Configuración específica del tipo de datos
   * @example { "maxLength": 100, "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" }
   */
  @IsObject()
  @IsOptional()
  config?: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
    multiple?: boolean;
    allowedTypes?: string[];
    maxSize?: number;
    customValidation?: string;
  };

  /**
   * Indica si el tipo de datos es requerido
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  required?: boolean = false;

  /**
   * Indica si el tipo de datos es único
   * @example false
   */
  @IsBoolean()
  @IsOptional()
  unique?: boolean = false;

  /**
   * Indica si el tipo de datos es sensible
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  sensitive?: boolean = false;

  /**
   * Estado del tipo de datos
   * @example "active"
   */
  @IsEnum(DataTypeStatus)
  @IsOptional()
  status?: DataTypeStatus = DataTypeStatus.ACTIVE;

  /**
   * Metadatos adicionales
   * @example { "category": "contact", "tags": ["personal", "communication"] }
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDataTypeDto extends PartialType(CreateDataTypeDto) {} 