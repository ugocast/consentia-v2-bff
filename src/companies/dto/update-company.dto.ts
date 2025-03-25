import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';

/**
 * DTO para actualizar una empresa existente.
 * Extiende de CreateCompanyDto pero hace todos los campos opcionales.
 */
export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {} 