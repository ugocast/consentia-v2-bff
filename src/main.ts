import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors();
  
  // Añadir un prefijo global a todas las rutas de la API
  app.setGlobalPrefix('api/v1');
  
  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no decoradas
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no decoradas
      transform: true, // Transforma los datos a los tipos definidos
    }),
  );
  
  // Obtener el puerto de las variables de entorno o usar 3000 por defecto
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  console.log(`Aplicación BFF iniciada en el puerto ${port}`);
}
bootstrap();
