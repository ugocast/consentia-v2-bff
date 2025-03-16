import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

/**
 * Pipe para validar que un parámetro sea un UUID válido
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException('ID inválido. Debe ser un UUID válido.');
    }
    return value;
  }
}
