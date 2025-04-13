# Consentia Backend-For-Frontend (BFF)

Backend para aplicaciones frontend de Consentia, optimizado para integrarse con Supabase Auth.

## Descripción

Este servicio actúa como una capa intermedia entre las aplicaciones frontend y los servicios backend de Consentia, proporcionando:

- Endpoints complementarios para lógica de negocio específica
- Integración con Supabase Auth para autenticación
- Gestión de datos de usuario y onboarding
- Protección de endpoints mediante verificación de JWT

## Documentación

- [Guía de Integración Frontend-BFF](./FRONTEND_BFF_INTEGRATION.md) - Cómo integrar tu aplicación frontend con el BFF después de la migración a Supabase Auth
- [Documentación de Endpoints](./BFF_Endpoints.MD) - Lista completa de endpoints disponibles y obsoletos
- [Arquitectura de Autenticación](./docs/AUTH_ARCHITECTURE.md) - Detalles sobre el flujo de autenticación con Supabase

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/consentia

# Servicios externos
API_GATEWAY_URL=http://localhost:8000
```

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Ejecutar tests
npm test

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

## Migración a Supabase Auth

Este BFF ha sido actualizado para trabajar con Supabase Auth. Los principales cambios incluyen:

1. Eliminación de endpoints de autenticación básica (registro, login, etc.)
2. Verificación de tokens JWT generados por Supabase
3. Nuevos endpoints para complementar la funcionalidad de Supabase Auth

Para más detalles sobre la migración, consulta la [Guía de Integración Frontend-BFF](./FRONTEND_BFF_INTEGRATION.md).

## Desarrollo

### Estructura del Proyecto

```
/src
  /auth           # Controladores y middleware de autenticación
  /config         # Configuración de la aplicación
  /controllers    # Controladores de API
  /middleware     # Middleware personalizados
  /models         # Modelos de datos
  /routes         # Definición de rutas
  /services       # Servicios y lógica de negocio
  /types          # Definiciones de tipos TypeScript
  /utils          # Utilidades y helpers
  app.ts          # Aplicación Express
  server.ts       # Punto de entrada
```

### Scripts Disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo con hot-reload
- `npm run build`: Compila el proyecto para producción
- `npm start`: Inicia el servidor en modo producción
- `npm test`: Ejecuta pruebas
- `npm run lint`: Ejecuta ESLint
- `npm run format`: Formatea el código con Prettier

## Licencia

Propiedad de Consentia 