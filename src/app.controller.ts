import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('info')
  getInfo(): object {
    return {
      name: 'Consentia BFF',
      version: '1.0.0',
      description: 'Backend for Frontend para la aplicación Consentia',
      framework: 'NestJS',
      timestamp: new Date().toISOString()
    };
  }
}
