import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { appConfig } from './config/app.config';
import * as dotenv from 'dotenv';

// Cargar variables de entorno manualmente
dotenv.config();

// Verificar las variables de entorno de Supabase
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log(
  'SUPABASE_KEY:',
  process.env.SUPABASE_KEY ? 'Definido' : 'No definido',
);
console.log(
  'SUPABASE_SERVICE_KEY:',
  process.env.SUPABASE_SERVICE_KEY ? 'Definido' : 'No definido',
);
console.log('appConfig.supabase:', appConfig.supabase);

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

  // Aplicar interceptor de transformación global
  app.useGlobalInterceptors(new TransformInterceptor());

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
