import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '¡Hola Mundo desde el BFF de Consentia! Este es un Backend for Frontend construido con NestJS.';
  }
}
