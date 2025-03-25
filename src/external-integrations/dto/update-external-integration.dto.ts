import { IsString, IsEnum, IsOptional, IsUrl, IsObject } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateExternalIntegrationDto } from './create-external-integration.dto';
import { ExternalIntegrationStatus } from './external-integration-status.enum';

/**
 * DTO para la actualización de integraciones externas
 */
export class UpdateExternalIntegrationDto extends PartialType(CreateExternalIntegrationDto) {} 