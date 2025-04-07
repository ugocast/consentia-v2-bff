# Módulo de Autenticación

## Descripción

El módulo de autenticación de Consentia proporciona un sistema seguro y robusto para el registro de usuarios, inicio de sesión, cierre de sesión, y gestión de contraseñas. Utiliza JWT (JSON Web Tokens) como mecanismo principal de autenticación y Supabase Auth como proveedor de identidad subyacente.

## Características Principales

- **Autenticación basada en JWT**: Implementación segura de autenticación mediante tokens JWT.
- **Registro de usuarios**: Proceso de registro con validación de datos.
- **Gestión de sesiones**: Inicio de sesión, cierre de sesión y renovación de tokens.
- **Restablecimiento de contraseñas**: Flujo completo para recuperación de contraseñas.
- **Control de acceso basado en roles**: Sistema RBAC para autorización a nivel de endpoint.
- **Auditoría detallada**: Registro completo de todas las operaciones de autenticación.
- **Manejo estructurado de errores**: Sistema coherente para manejo y presentación de errores.

## Estructura Técnica

El módulo está estructurado siguiendo un enfoque de capas:

### Controladores

- `auth.controller.ts`: Define los endpoints REST para todas las operaciones de autenticación.

### Servicios

- `auth.service.ts`: Implementa la lógica de negocio para todas las operaciones de autenticación.

### DTOs (Data Transfer Objects)

- `auth.dto.ts`: Define los objetos de transferencia de datos para las solicitudes.
- `standard-response.dto.ts`: Define respuestas estandarizadas para todos los endpoints.

### Componentes de Seguridad

- **Guards**: Protegen rutas asegurando autenticación y autorización adecuadas.
  - `jwt.guard.ts`: Verifica tokens JWT.
  - `roles.guard.ts`: Verifica roles de usuario.

- **Decoradores**: Proporcionan metadatos para autorización.
  - `roles.decorator.ts`: Define los roles requeridos para acceder a un endpoint.

- **Estrategias**: Implementan lógica para validar credenciales.
  - `jwt.strategy.ts`: Estrategia para validar tokens JWT.

### Documentación

- `docs/security-overview.md`: Documentación técnica detallada sobre la seguridad del módulo.

## Endpoints de la API

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| POST | `/auth/register` | Registra un nuevo usuario | No requerida |
| POST | `/auth/login` | Inicia sesión | No requerida |
| POST | `/auth/logout` | Cierra sesión | JWT |
| POST | `/auth/reset-password` | Solicita restablecimiento de contraseña | No requerida |
| POST | `/auth/update-password` | Actualiza la contraseña | JWT |
| POST | `/auth/refresh-token` | Renueva un token JWT | No requerida (requiere refresh token) |

## Flujos de Autenticación

### Registro de Usuario

1. El cliente envía datos de registro (email, contraseña, nombre).
2. El servidor valida los datos y crea una cuenta en Supabase Auth.
3. El servidor registra el evento en el sistema de auditoría.
4. El servidor devuelve información del usuario creado y tokens de sesión.

### Inicio de Sesión

1. El cliente envía credenciales (email, contraseña).
2. El servidor valida credenciales con Supabase Auth.
3. El servidor registra el evento en el sistema de auditoría.
4. El servidor devuelve información del usuario y tokens de sesión.

### Cierre de Sesión

1. El cliente envía un token JWT válido.
2. El servidor invalida el token en Supabase Auth.
3. El servidor registra el evento en el sistema de auditoría.
4. El servidor confirma el cierre de sesión exitoso.

### Restablecimiento de Contraseña

1. El cliente solicita restablecer contraseña con email.
2. El servidor envía correo con enlace de restablecimiento.
3. El usuario hace clic en el enlace y establece nueva contraseña.
4. El servidor valida y actualiza la contraseña.
5. El servidor registra el evento en el sistema de auditoría.

## Ejemplos de Uso

### Registro de Usuario

```typescript
// Cliente
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123',
    name: 'Usuario Ejemplo'
  })
});

const data = await response.json();
// Almacenar tokens para uso futuro
localStorage.setItem('access_token', data.session.access_token);
localStorage.setItem('refresh_token', data.session.refresh_token);
```

### Inicio de Sesión

```typescript
// Cliente
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123'
  })
});

const data = await response.json();
// Almacenar tokens para uso futuro
localStorage.setItem('access_token', data.session.access_token);
localStorage.setItem('refresh_token', data.session.refresh_token);
```

### Protección de Rutas en el Backend

```typescript
// Controlador NestJS
@Controller('recurso-protegido')
export class RecursoProtegidoController {
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  crearRecurso(@Body() datos: RecursoDto) {
    // Solo accesible para usuarios autenticados con rol ADMIN
    return this.recursoService.crear(datos);
  }
}
```

## Integración con Frontend

Para integrar este módulo de autenticación con un frontend:

1. **Almacenamiento de Tokens**: Guardar tokens en localStorage o sessionStorage.
2. **Interceptores HTTP**: Configurar interceptores para incluir tokens en solicitudes.
3. **Renovación de Tokens**: Implementar lógica de renovación cuando expire el access token.
4. **Manejo de Estado**: Mantener estado de autenticación en la aplicación.

## Documentación Técnica

Para información técnica detallada sobre seguridad y mejores prácticas, consulte:

- [Documentación de Seguridad](./docs/security-overview.md)

## Mejoras Recientes

- Implementación de respuestas DTO estandarizadas
- Mejora del registro de auditoría
- Documentación Swagger completa
- Manejo estructurado de errores

## Próximos Pasos

- Implementación de autenticación de dos factores (2FA)
- Mejora del sistema de roles y permisos
- Integración con proveedores de identidad externos (OAuth)
- Implementación de protección contra ataques de fuerza bruta 