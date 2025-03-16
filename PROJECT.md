# Consentia BFF - Documentación del Proyecto

## Descripción General

Este proyecto es un Backend for Frontend (BFF) desarrollado con NestJS que sirve como capa intermedia entre el frontend de Consentia y los servicios backend. Está diseñado específicamente para optimizar las necesidades de la interfaz de usuario y proporcionar una API coherente y segura.

## Arquitectura

El proyecto sigue una arquitectura modular típica de NestJS:

- **Módulo Principal (AppModule)**: Configura la aplicación e importa los módulos específicos.
- **Módulo de Autenticación (AuthModule)**: Gestiona todos los procesos relacionados con la autenticación de usuarios.
- **Módulo de Usuarios (UsersModule)**: Maneja las operaciones relacionadas con los perfiles de usuario.
- **Configuración**: Incluye la configuración para Supabase, que se utiliza como servicio de backend.

## Tecnologías Principales

- **NestJS**: Framework de Node.js para aplicaciones del lado del servidor
- **TypeScript**: Lenguaje de programación con tipado estático
- **Supabase**: Plataforma de backend como servicio (BaaS) utilizada para autenticación y almacenamiento de datos
- **class-validator**: Biblioteca para validación de datos basada en decoradores
- **Jest**: Framework de pruebas

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

## Funcionalidades Principales

### Autenticación

- **Registro de usuarios**: Permite a los usuarios crear una nueva cuenta
- **Inicio de sesión**: Autenticación de usuarios existentes
- **Cierre de sesión**: Finalización de sesiones activas
- **Restablecimiento de contraseña**: Proceso para recuperar acceso a cuentas
- **Actualización de contraseña**: Cambio de contraseña para usuarios autenticados
- **Renovación de tokens JWT**: Mecanismo para mantener sesiones activas

### Gestión de Usuarios

- **Obtener perfil del usuario actual**: Acceso a la información del usuario autenticado
- **Actualizar perfil de usuario**: Modificación de datos personales
- **Eliminar cuenta de usuario**: Proceso para dar de baja una cuenta

## Endpoints de la API

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

## Configuración

El proyecto utiliza variables de entorno para la configuración, incluyendo:

### Supabase
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Base de Datos
```
DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Almacenamiento S3
```
S3_URL=http://127.0.0.1:54321/storage/v1/s3
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_REGION=local
```

### Servidor
```
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

## Características de Implementación

- **Guardias JWT**: Protección de rutas que requieren autenticación
- **Validación global**: Implementación de pipes de validación para datos entrantes
- **Configuración CORS**: Permite peticiones desde el frontend configurado
- **Prefijo global**: Todas las rutas de la API utilizan el prefijo `api/v1`
- **Pruebas**: Configuración para pruebas unitarias y e2e con Jest

## Instalación y Ejecución

### Instalación
```bash
$ npm install
```

### Ejecución
```bash
# desarrollo
$ npm run start:dev

# producción
$ npm run start:prod
```

## Pruebas

```bash
# pruebas unitarias
$ npm run test

# pruebas e2e
$ npm run test:e2e

# cobertura de código
$ npm run test:cov
```

## Licencia

Este proyecto está licenciado bajo la licencia [UNLICENSED](LICENSE). 