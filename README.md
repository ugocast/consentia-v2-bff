# Consentia BFF

Este proyecto es un Backend for Frontend (BFF) desarrollado con NestJS para la aplicación Consentia, integrado con Supabase.

## Descripción

El BFF actúa como una capa intermedia entre el frontend y los servicios backend, proporcionando una API optimizada para las necesidades específicas de la interfaz de usuario. Utiliza Supabase como servicio de autenticación.

## Configuración de Supabase

Para utilizar este proyecto, necesitas configurar las siguientes variables de entorno:

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3001
```

Puedes copiar el archivo `.env.example` a `.env` y actualizar los valores con tus credenciales de Supabase.

## Instalación

```bash
$ npm install
```

## Ejecución

```bash
# desarrollo
$ npm run start:dev

# producción
$ npm run start:prod
```

## Endpoints

### Autenticación

- `POST /api/v1/auth/register` - Registrar un nuevo usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/logout` - Cerrar sesión (requiere autenticación)
- `POST /api/v1/auth/reset-password` - Solicitar restablecimiento de contraseña
- `POST /api/v1/auth/update-password` - Actualizar contraseña (requiere autenticación)
- `POST /api/v1/auth/refresh-token` - Refrescar token JWT

### Usuarios

- `GET /api/v1/users/me` - Obtener perfil del usuario actual (requiere autenticación)
- `PATCH /api/v1/users/me` - Actualizar perfil del usuario (requiere autenticación)
- `DELETE /api/v1/users/me` - Eliminar cuenta de usuario (requiere autenticación)

### General

- `GET /api/v1/` - Mensaje de bienvenida
- `GET /api/v1/info` - Información sobre el BFF

## Tecnologías

- NestJS - Framework de Node.js para construir aplicaciones del lado del servidor
- TypeScript - Superset de JavaScript con tipado estático
- Express - Framework web para Node.js
- Supabase - Alternativa de código abierto a Firebase
- class-validator - Validación de datos basada en decoradores

## Estructura del Proyecto

```
src/
├── app.controller.ts    # Controlador principal
├── app.module.ts        # Módulo principal
├── app.service.ts       # Servicio principal
├── auth/                # Módulo de autenticación
│   ├── auth.controller.ts  # Controlador de autenticación
│   ├── auth.module.ts      # Módulo de autenticación
│   ├── auth.service.ts     # Servicio de autenticación
│   ├── dto/                # DTOs para autenticación
│   └── jwt/                # Guard JWT
├── config/              # Configuraciones
│   └── supabase.config.ts # Configuración de Supabase
├── users/               # Módulo de usuarios
│   ├── users.controller.ts # Controlador de usuarios
│   ├── users.module.ts     # Módulo de usuarios
│   ├── users.service.ts    # Servicio de usuarios
│   ├── dto/                # DTOs para usuarios
│   └── decorators/         # Decoradores personalizados
└── main.ts              # Punto de entrada de la aplicación
```

## Licencia

Este proyecto está licenciado bajo la licencia [UNLICENSED](LICENSE).
