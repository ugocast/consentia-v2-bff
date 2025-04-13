# Módulo de Autenticación (Auth)

Este módulo maneja la autenticación y autorización en Consentia BFF, utilizando Supabase Auth como proveedor principal de autenticación.

## Descripción

El módulo Auth se encarga de:

1. Verificar los tokens JWT generados por Supabase Auth
2. Proporcionar endpoints para operaciones complementarias como estado de onboarding y sincronización de datos de usuario
3. Gestionar la autorización a través de guards y decoradores

## Arquitectura

Después de la migración a Supabase Auth, la arquitectura se ha simplificado:

- El frontend se comunica directamente con Supabase Auth para operaciones de autenticación (registro, login, logout, etc.)
- El backend (BFF) verifica los tokens generados por Supabase Auth y proporciona servicios complementarios

## Componentes principales

### Guards

- **JwtAuthGuard**: Verifica los tokens JWT de Supabase. Este guard se utiliza para proteger rutas que requieren autenticación.
- **RolesGuard**: Verifica que el usuario tenga los roles necesarios para acceder a un recurso.

### Decoradores

- **@CurrentUser()**: Obtiene el usuario autenticado desde la request.
- **@Roles()**: Especifica los roles requeridos para acceder a un endpoint.
- **@Public()**: Marca un endpoint como público (no requiere autenticación).

### Servicios

- **AuthService**: Proporciona métodos para verificar tokens, obtener estado de onboarding y sincronizar datos de usuario.

## Flujo de autenticación

1. El usuario se autentica con Supabase Auth en el frontend
2. Supabase Auth genera un token JWT
3. El frontend envía este token en el header Authorization en cada solicitud al BFF
4. El JwtAuthGuard verifica el token usando el método verifyToken de AuthService
5. Si el token es válido, se añade el usuario a la request y se continúa con la solicitud
6. Si el token no es válido, se retorna un error 401 Unauthorized

## Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| /auth/onboarding-status | GET | Obtiene el estado de onboarding del usuario actual |
| /auth/sync-user-data | POST | Sincroniza los datos del usuario entre Supabase y el BFF |

## Configuración

El módulo requiere las siguientes variables de entorno:

- `SUPABASE_URL`: URL de la instancia de Supabase
- `SUPABASE_ANON_KEY`: Clave anónima de Supabase (para autenticación pública)
- `SUPABASE_SERVICE_KEY`: Clave de servicio de Supabase (para operaciones administrativas)
- `SUPABASE_JWT_SECRET`: Secreto para verificar los tokens JWT de Supabase 