import { PartialType } from '@nestjs/mapped-types';
import { CreateConsentDataTypeDto } from './create-consent-data-type.dto';

/**
 * DTO para la actualización de tipos de datos de consentimiento
 */
export class UpdateConsentDataTypeDto extends PartialType(CreateConsentDataTypeDto) {} 