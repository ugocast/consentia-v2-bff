# Documentación de Seguridad - Módulo de Autenticación

## Descripción General

El módulo de autenticación es una parte crítica de la aplicación Consentia que maneja la seguridad y el control de acceso. Está diseñado para proporcionar autenticación segura a través de JWT (JSON Web Tokens) con Supabase Auth como proveedor de identidad subyacente.

## Arquitectura de Seguridad

### Flujo de Autenticación

1. **Registro**: Los usuarios se registran proporcionando email, contraseña y nombre.
2. **Login**: Los usuarios inician sesión con email y contraseña, recibiendo un token JWT.
3. **Verificación**: Cada solicitud protegida es verificada a través de Guards de JWT.
4. **Refresh Token**: Se proporciona un mecanismo para renovar tokens expirados sin requerir nuevo login.
5. **Cierre de Sesión**: Proceso para invalidar tokens activos.

### Tokens JWT

- **Access Token**: Token de corta duración (por defecto 1 hora) para autenticar solicitudes.
- **Refresh Token**: Token de larga duración (por defecto 7 días) para obtener nuevos access tokens.
- **Información del Token**: Contiene ID de usuario, roles, y otros claims relevantes.

## Componentes Clave

### Guards

1. **JwtGuard**: Verifica la presencia y validez del token JWT en las solicitudes.
2. **RolesGuard**: Asegura que el usuario tenga los roles necesarios para acceder a un recurso.

### Decoradores

1. **Roles**: Establece los roles requeridos para acceder a un endpoint o controlador.

### Estrategias de Autenticación

1. **JWT Strategy**: Implementa la estrategia de autenticación basada en JWT para Passport.

## Manejo de Errores

Se ha implementado un sistema robusto de manejo de errores que:

1. **Tipificación de Errores**: Todos los errores tienen un código específico (ErrorCode).
2. **Mensajes Claros**: Los mensajes de error son descriptivos y consistentes.
3. **Detalles Estructurados**: Los errores incluyen detalles adicionales cuando es apropiado.
4. **Logging**: Todos los errores de seguridad son registrados con niveles apropiados.

## Auditoría

Todas las acciones relacionadas con la autenticación son auditadas:

1. **Registros**: Creación de nuevas cuentas.
2. **Inicios de Sesión**: Intentos exitosos y fallidos.
3. **Cierre de Sesión**: Cuándo un usuario cierra sesión.
4. **Cambios de Contraseña**: Solicitudes de restablecimiento y actualizaciones.
5. **Refresh Token**: Renovaciones de token.

Los registros de auditoría incluyen:
- Tipo de acción
- ID del usuario
- Timestamp
- Resultado (éxito/fracaso)
- Detalles adicionales según la operación

## Consideraciones de Seguridad

### Protección contra Ataques Comunes

1. **Inyección de Dependencias Seguras**: Uso de módulos NestJS para evitar inyecciones maliciosas.
2. **Validación de Entradas**: Implementada con class-validator en DTOs.
3. **Protección contra Timing Attacks**: Delegado a Supabase Auth para comparación segura de contraseñas.
4. **Protección de Rutas**: Todas las rutas sensibles requieren autenticación y autorización apropiada.

### Mejores Prácticas Implementadas

1. **Contraseñas Seguras**: Se requiere un mínimo de 6 caracteres (configuración de Supabase Auth).
2. **Tokens de Duración Limitada**: Los tokens de acceso expiran después de un período configurado.
3. **Registro de Eventos**: Todos los eventos críticos de seguridad son registrados.
4. **Manejo de Errores Seguro**: Los errores no revelan información sensible.
5. **Mensajes de Error Consistentes**: Los mensajes de error son estandarizados.

## Integración con Sistemas Externos

### Supabase Auth

El módulo utiliza Supabase Auth como proveedor de identidad, delegando:
- Almacenamiento seguro de contraseñas (hashing)
- Generación y verificación de tokens JWT
- Renovación de tokens
- Restablecimiento de contraseñas

## Pruebas de Seguridad

El módulo incluye pruebas unitarias que verifican:
- Validación apropiada de tokens
- Verificación correcta de roles
- Manejo adecuado de errores
- Renovación adecuada de tokens

## Mejoras Recientes

1. **Respuestas Estandarizadas**: Implementación de DTOs consistentes para todas las respuestas.
2. **Registro de Auditoría Mejorado**: Registro detallado de todas las acciones relacionadas con autenticación.
3. **Manejo de Errores Estructurado**: Códigos de error y mensajes estandarizados.
4. **Documentación Swagger**: Documentación completa de todos los endpoints.

## Próximas Mejoras

1. **Implementación de 2FA**: Autenticación de dos factores para mayor seguridad.
2. **Integración de RBAC más Granular**: Mejoras en el sistema de roles y permisos.
3. **Mejora de Protección contra Bots**: Implementación de reCAPTCHA o similar.
4. **Política de Contraseñas más Robusta**: Requisitos más estrictos para contraseñas.
5. **Análisis de Actividad Sospechosa**: Detección de patrones de inicio de sesión anómalos. 