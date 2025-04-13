import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { appConfig } from './config/app.config';
import * as dotenv from 'dotenv';

// Cargar variables de entorno manualmente
dotenv.config();

// Verificar las variables de entorno de Supabase en modo desarrollo
if (process.env.NODE_ENV !== 'production') {
  console.log('Verificando variables de entorno esenciales:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('PORT:', process.env.PORT || '3001');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  
  // Variables de Supabase
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log(
    'SUPABASE_KEY:',
    process.env.SUPABASE_KEY ? 'Definido' : 'No definido',
  );
  console.log(
    'SUPABASE_SERVICE_KEY:',
    process.env.SUPABASE_SERVICE_KEY ? 'Definido' : 'No definido',
  );
  console.log(
    'SUPABASE_JWT_SECRET:',
    process.env.SUPABASE_JWT_SECRET ? 'Definido' : 'No definido',
  );
  
  // Advertencia si faltan variables críticas
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_JWT_SECRET) {
    console.warn('⚠️ ADVERTENCIA: Faltan variables de entorno esenciales para Supabase. Verifica tu archivo .env');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: appConfig.server.frontendUrl,
    credentials: true,
  });

  // Añadir un prefijo global a todas las rutas de la API
  app.setGlobalPrefix(appConfig.server.apiPrefix);

  // Aplicar filtro de excepciones global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Aplicar interceptores globales
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    // Se actualizará después de resolver las dependencias del interceptor
  );

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no decoradas
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no decoradas
      transform: true, // Transforma los datos a los tipos definidos
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Consentia API')
    .setDescription(
      'API para la gestión de consentimientos y políticas legales',
    )
    .setVersion(appConfig.version)
    .addTag('auth', 'Endpoints de autenticación')
    .addTag('users', 'Endpoints de usuarios')
    .addTag('policies', 'Endpoints de políticas legales')
    .addTag('consents', 'Endpoints de consentimientos')
    .addTag('reports', 'Endpoints de reportes')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(appConfig.server.docsPath, app, document);

  // Obtener el puerto de las variables de entorno o usar 3000 por defecto
  const port = appConfig.server.port;

  await app.listen(port);
  console.log(
    `Aplicación ${appConfig.name} v${appConfig.version} iniciada en el puerto ${port}`,
  );
  console.log(
    `Documentación de la API disponible en: http://localhost:${port}/${appConfig.server.docsPath}`,
  );
}
bootstrap();
