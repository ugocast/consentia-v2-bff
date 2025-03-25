import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyUserDto } from './create-company-user.dto';

/**
 * DTO para la actualización de usuarios de compañía
 */
export class UpdateCompanyUserDto extends PartialType(CreateCompanyUserDto) {} 