import { Injectable } from '@nestjs/common';
import { appConfig } from './config/app.config';

@Injectable()
export class AppService {
  getHello(): string {
    return `¡Hola Mundo desde ${appConfig.name} v${appConfig.version}! Este es un Backend for Frontend construido con NestJS.`;
  }
}
