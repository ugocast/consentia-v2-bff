import { PartialType } from '@nestjs/mapped-types';
import { CreateDataSubjectDto } from './create-data-subject.dto';

/**
 * DTO para la actualización de titulares de datos
 */
export class UpdateDataSubjectDto extends PartialType(CreateDataSubjectDto) {} 