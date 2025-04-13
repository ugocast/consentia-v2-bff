import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { Public } from './common/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener mensaje de bienvenida' })
  @ApiResponse({ status: 200, description: 'Mensaje de bienvenida' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('info')
  @ApiOperation({ summary: 'Obtener información de la API' })
  @ApiResponse({ status: 200, description: 'Información de la API' })
  getInfo(): object {
    return {
      name: appConfig.name,
      version: appConfig.version,
      description: appConfig.description,
      framework: 'NestJS',
      modules: [
        'Auth - Autenticación y autorización',
        'Users - Gestión de usuarios',
        'Policies - Gestión de políticas legales',
        'Consents - Gestión de consentimientos',
        'Reports - Generación de reportes',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  @Get('docs')
  @ApiOperation({ summary: 'Redireccionar a la documentación de la API' })
  @Redirect()
  getDocs() {
    return { url: `/${appConfig.server.docsPath}` };
  }

  /**
   * Endpoint de health-check
   * 
   * Esta ruta es pública (no requiere autenticación) y proporciona información
   * básica sobre el estado del sistema.
   */
  @ApiOperation({ summary: 'Verificar estado del sistema' })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio operativo',
    schema: {
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-08-01T12:00:00Z' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  @Public()
  @Get('health-check')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }
}
