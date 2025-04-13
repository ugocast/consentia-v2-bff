# BFF Endpoints

Este documento detalla los endpoints disponibles en el Backend-For-Frontend (BFF) de Consentia, su propósito y los cambios realizados tras la migración a Supabase Auth.

## Endpoints Actuales

### Endpoints de Autenticación y Usuario

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/auth/onboarding-status` | GET | JWT | Obtiene el estado de onboarding del usuario actual y sus empresas asociadas |
| `/auth/sync-user-data` | POST | JWT | Sincroniza datos del usuario entre Supabase y la base de datos interna |
| `/auth/verify-token` | POST | - | Verifica la validez de un token JWT de Supabase |
| `/user/profile` | GET | JWT | Obtiene el perfil completo del usuario actual |
| `/user/profile` | PUT | JWT | Actualiza el perfil del usuario actual |
| `/user/preferences` | GET | JWT | Obtiene las preferencias del usuario |
| `/user/preferences` | PUT | JWT | Actualiza las preferencias del usuario |

### Endpoints de Empresas

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/companies` | GET | JWT | Lista todas las empresas asociadas al usuario |
| `/companies` | POST | JWT | Crea una nueva empresa |
| `/companies/:id` | GET | JWT | Obtiene detalles de una empresa específica |
| `/companies/:id` | PUT | JWT | Actualiza información de una empresa |
| `/companies/:id` | DELETE | JWT | Elimina una empresa |
| `/companies/:id/users` | GET | JWT | Lista usuarios asociados a una empresa |
| `/companies/:id/users` | POST | JWT | Añade un usuario a una empresa |
| `/companies/:id/users/:userId` | DELETE | JWT | Elimina un usuario de una empresa |

### Endpoints de Documentos

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/documents` | GET | JWT | Lista documentos disponibles para el usuario |
| `/documents` | POST | JWT | Crea un nuevo documento |
| `/documents/:id` | GET | JWT | Obtiene un documento específico |
| `/documents/:id` | PUT | JWT | Actualiza un documento |
| `/documents/:id` | DELETE | JWT | Elimina un documento |
| `/documents/:id/share` | POST | JWT | Comparte un documento con otros usuarios |
| `/documents/search` | GET | JWT | Busca documentos por criterios específicos |

### Endpoints de Notificaciones

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/notifications` | GET | JWT | Obtiene notificaciones para el usuario actual |
| `/notifications/count` | GET | JWT | Cuenta de notificaciones no leídas |
| `/notifications/:id/read` | PUT | JWT | Marca una notificación como leída |
| `/notifications/read-all` | PUT | JWT | Marca todas las notificaciones como leídas |
| `/notifications/settings` | GET | JWT | Obtiene configuración de notificaciones |
| `/notifications/settings` | PUT | JWT | Actualiza configuración de notificaciones |

## Endpoints Obsoletos (Eliminados tras migración a Supabase Auth)

Los siguientes endpoints han sido eliminados tras la migración a Supabase Auth, ya que estas funcionalidades ahora se realizan directamente con Supabase en el frontend:

| Endpoint | Método | Descripción | Alternativa |
|----------|--------|-------------|-------------|
| `/auth/register` | POST | Registro de usuario | `supabase.auth.signUp()` |
| `/auth/login` | POST | Login de usuario | `supabase.auth.signInWithPassword()` |
| `/auth/logout` | POST | Cerrar sesión | `supabase.auth.signOut()` |
| `/auth/reset-password` | POST | Solicitar reseteo de contraseña | `supabase.auth.resetPasswordForEmail()` |
| `/auth/verify-email` | GET | Verificar email | Manejado automáticamente por Supabase |
| `/auth/refresh-token` | POST | Renovar token de acceso | Manejado automáticamente por Supabase |

## Notas sobre Autenticación

- Todos los endpoints protegidos esperan un token JWT válido en el encabezado `Authorization` con el formato `Bearer <token>`
- Los tokens JWT son emitidos y validados por Supabase Auth
- El BFF verifica los tokens JWT y extrae la información del usuario para autorización

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 201 | Recurso creado exitosamente |
| 400 | Solicitud incorrecta (datos inválidos) |
| 401 | No autorizado (token inválido o expirado) |
| 403 | Prohibido (sin permisos para el recurso) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (por ejemplo, recurso duplicado) |
| 500 | Error interno del servidor |

## Formato de Respuestas

### Respuesta Exitosa

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación completada exitosamente"
}
```

### Respuesta de Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error"
  }
}
```

## Límites de Tasa y Paginación

- **Límite de Tasa**: 100 solicitudes por minuto por usuario
- **Paginación**: Endpoints que devuelven listas soportan los parámetros `page` y `limit`
  - Ejemplo: `/documents?page=2&limit=20`
  - Por defecto: `page=1, limit=10`

## Entorno de Desarrollo y Pruebas

- **URL de Desarrollo**: `https://dev-bff.consentia.com`
- **URL de Producción**: `https://bff.consentia.com`
- **Colección Postman**: Disponible en `/docs/postman`

## Migración a Supabase Auth

La migración a Supabase Auth representa un cambio significativo en la arquitectura de autenticación de Consentia. A continuación, se detallan los aspectos clave de esta migración:

### Cambios Principales

1. **Autenticación Directa**: Las operaciones de autenticación básica (registro, login, logout) ahora se realizan directamente con Supabase desde el frontend.
2. **Verificación de Tokens**: El BFF ahora verifica los tokens JWT emitidos por Supabase en lugar de emitir sus propios tokens.
3. **Sincronización de Datos**: Se mantiene sincronización entre Supabase Auth y la base de datos interna del BFF.

### Proceso de Migración para Aplicaciones Existentes

1. Actualizar las dependencias del frontend para incluir el cliente de Supabase
2. Modificar los flujos de autenticación para usar Supabase Auth directamente
3. Actualizar el cliente HTTP para incluir el token JWT de Supabase en las solicitudes al BFF
4. Probar exhaustivamente todos los flujos de autenticación y autorización

### Beneficios de la Migración

- Mayor seguridad con manejo de tokens JWT estándar
- Reducción de carga en el BFF al delegar autenticación a Supabase
- Mejor escalabilidad y mantenibilidad
- Acceso a características avanzadas de autenticación de Supabase

## Ejemplos de Uso

### Autenticación y Sincronización

**Sincronizar datos de usuario después del login**:

```javascript
// En el frontend, después de un login exitoso con Supabase
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'contraseña'
});

// Obtener el token JWT
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Sincronizar datos con el BFF
const response = await fetch('https://bff.consentia.com/auth/sync-user-data', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: user.user_metadata.full_name,
    phoneNumber: user.user_metadata.phone,
    onboardingStatus: 'STARTED'
  })
});

const data = await response.json();
console.log('Sincronización completada:', data);
```

**Verificar estado de onboarding**:

```javascript
// Obtener el token JWT de Supabase
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Consultar estado de onboarding
const response = await fetch('https://bff.consentia.com/auth/onboarding-status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Estado de onboarding:', data);

// Redirigir según el estado
if (data.onboardingStatus === 'PENDING') {
  router.push('/onboarding');
} else {
  router.push('/dashboard');
}
```

### Manejo de Empresas

**Listar empresas del usuario**:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

const response = await fetch('https://bff.consentia.com/companies', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { success, data: companies } = await response.json();

if (success) {
  console.log('Empresas del usuario:', companies);
} else {
  console.error('Error al obtener empresas');
}
```

**Crear una nueva empresa**:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

const response = await fetch('https://bff.consentia.com/companies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Nueva Empresa S.L.',
    taxId: 'B12345678',
    address: 'Calle Ejemplo 123',
    city: 'Madrid',
    postalCode: '28001',
    country: 'España'
  })
});

const { success, data: newCompany } = await response.json();

if (success) {
  console.log('Empresa creada:', newCompany);
} else {
  console.error('Error al crear empresa');
}
```

### Gestión de Documentos

**Buscar documentos**:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

const response = await fetch('https://bff.consentia.com/documents/search?query=factura&page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { success, data: documents } = await response.json();

if (success) {
  console.log('Documentos encontrados:', documents);
} else {
  console.error('Error en la búsqueda');
}
```

**Compartir un documento**:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

const documentId = '123e4567-e89b-12d3-a456-426614174000';

const response = await fetch(`https://bff.consentia.com/documents/${documentId}/share`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userIds: ['789e4567-e89b-12d3-a456-426614174001'],
    permissions: 'READ'
  })
});

const { success, message } = await response.json();

if (success) {
  console.log(message);
} else {
  console.error('Error al compartir documento');
}
```

### Manejo de Errores

**Ejemplo de manejo de errores comunes**:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

try {
  const response = await fetch('https://bff.consentia.com/documents/123', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado o inválido, renovar sesión
      await supabase.auth.refreshSession();
      // Reintentar la solicitud...
    } else if (response.status === 403) {
      console.error('No tienes permisos para acceder a este documento');
    } else if (response.status === 404) {
      console.error('El documento no existe');
    } else {
      const errorData = await response.json();
      console.error(`Error: ${errorData.error.message}`);
    }
    return;
  }
  
  const { success, data } = await response.json();
  console.log('Documento:', data);
} catch (error) {
  console.error('Error de red:', error);
}
```

## Notas Adicionales

- Los tokens JWT de Supabase Auth tienen una duración predeterminada de 1 hora.
- La renovación del token es gestionada automáticamente por el cliente de Supabase.
- Consulta la [documentación completa de la API](./src/auth/README.md) para más detalles sobre implementación. 