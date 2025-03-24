# Permisos y Accesos de Usuario - Consentia

Este documento detalla los permisos y accesos que cada tipo de usuario debe tener en el sistema Consentia, basado en los flujos de usuario definidos en USER_JOURNEYS.md.

## Tipos de Usuario

### 1. Usuario Final (Titular de Datos)

**Descripción**: Usuario que otorga o gestiona sus consentimientos para el tratamiento de sus datos personales.

**Permisos**:
- **Autenticación**:
  - Registro de cuenta
  - Inicio de sesión
  - Recuperación de contraseña
  - Actualización de contraseña

- **Gestión de Consentimientos**:
  - Ver solicitudes de consentimiento pendientes
  - Aceptar/rechazar solicitudes de consentimiento
  - Ver historial de consentimientos propios
  - Revocar consentimientos otorgados
  - Modificar alcance de consentimientos existentes
  - Solicitar eliminación de datos personales

- **Acceso a Datos**:
  - Ver datos personales almacenados
  - Exportar datos personales
  - Ver historial de accesos a sus datos

### 2. Administrador de Empresa

**Descripción**: Usuario con control total sobre la cuenta de la empresa y sus configuraciones.

**Permisos**:
- **Gestión de Empresa**:
  - Configurar perfil de empresa
  - Gestionar planes de suscripción
  - Configurar notificaciones
  - Gestionar facturación

- **Gestión de Usuarios**:
  - Invitar nuevos usuarios
  - Asignar roles a usuarios
  - Desactivar/activar usuarios
  - Gestionar permisos de usuarios

- **Gestión de Políticas**:
  - Crear políticas legales
  - Editar políticas existentes
  - Eliminar políticas
  - Gestionar versiones de políticas

- **Gestión de Consentimientos**:
  - Crear solicitudes de consentimiento
  - Ver todos los consentimientos
  - Realizar operaciones masivas
  - Exportar datos de consentimientos

- **Reportes y Auditoría**:
  - Generar reportes de auditoría
  - Configurar reportes automáticos
  - Acceder a logs de auditoría
  - Exportar reportes

### 3. Operador de Empresa

**Descripción**: Usuario que gestiona las operaciones diarias relacionadas con consentimientos.

**Permisos**:
- **Gestión de Consentimientos**:
  - Ver consentimientos
  - Crear solicitudes de consentimiento
  - Enviar recordatorios
  - Realizar operaciones masivas básicas
  - Exportar datos de consentimientos

- **Gestión de Políticas**:
  - Ver políticas existentes
  - Sugerir cambios a políticas
  - No puede crear/eliminar políticas

- **Reportes**:
  - Ver reportes básicos
  - Exportar reportes básicos
  - No puede configurar reportes automáticos

### 4. Auditor

**Descripción**: Usuario especializado en revisar y auditar las operaciones de la empresa.

**Permisos**:
- **Auditoría**:
  - Acceder a logs completos
  - Generar reportes de auditoría
  - Exportar datos de auditoría
  - Configurar reportes automáticos

- **Consulta**:
  - Ver todas las políticas
  - Ver todos los consentimientos
  - Ver configuraciones de empresa
  - Ver reportes de actividad

- **Restricciones**:
  - No puede modificar configuraciones
  - No puede crear/editar políticas
  - No puede gestionar consentimientos
  - No puede realizar operaciones masivas

### 5. Manager

**Descripción**: Usuario con permisos intermedios entre Administrador y Operador.

**Permisos**:
- **Gestión de Operadores**:
  - Supervisar operadores
  - Asignar tareas
  - Revisar operaciones

- **Gestión de Consentimientos**:
  - Ver todos los consentimientos
  - Crear solicitudes de consentimiento
  - Realizar operaciones masivas
  - Exportar datos

- **Gestión de Políticas**:
  - Ver políticas
  - Sugerir cambios
  - No puede crear/eliminar políticas

- **Reportes**:
  - Generar reportes operativos
  - Configurar reportes básicos
  - Exportar datos

## Datos y Ciclo de Vida de Usuarios

### 1. Usuario Final (Titular de Datos)

**Datos Personales**:
- Información básica:
  - Nombre completo
  - Correo electrónico
  - Teléfono (opcional)
  - Fecha de nacimiento (opcional)
  - Dirección (opcional)
- Datos de autenticación:
  - Contraseña (hasheada)
  - Tokens de recuperación
  - Historial de inicios de sesión
- Datos de consentimiento:
  - Historial de consentimientos
  - Preferencias de comunicación
  - Estado de consentimientos

**Ciclo de Vida**:
1. **Registro**:
   - Creación de cuenta
   - Verificación de correo electrónico
   - Configuración inicial de preferencias

2. **Activo**:
   - Gestión de consentimientos
   - Actualización de datos personales
   - Cambio de preferencias

3. **Inactivo**:
   - Desactivación por inactividad (30 días)
   - Desactivación manual
   - Suspensión por violación de términos

4. **Eliminación**:
   - Solicitud de eliminación de cuenta
   - Período de gracia (30 días)
   - Eliminación definitiva o anonimización

### 2. Administrador de Empresa

**Datos del Perfil**:
- Información personal:
  - Nombre completo
  - Correo electrónico corporativo
  - Teléfono de contacto
  - Cargo
- Datos de autenticación:
  - Credenciales de acceso
  - Tokens de recuperación
  - Historial de accesos
- Datos de empresa:
  - Información de facturación
  - Configuraciones de empresa
  - Plan de suscripción

**Ciclo de Vida**:
1. **Registro**:
   - Creación de cuenta empresarial
   - Verificación de identidad
   - Configuración inicial de empresa

2. **Activo**:
   - Gestión de empresa
   - Administración de usuarios
   - Configuración de políticas

3. **Inactivo**:
   - Suspensión por falta de pago
   - Desactivación manual
   - Suspensión por violación de términos

4. **Eliminación**:
   - Solicitud de cierre de cuenta
   - Período de gracia (60 días)
   - Eliminación o archivado de datos

### 3. Operador de Empresa

**Datos del Perfil**:
- Información personal:
  - Nombre completo
  - Correo electrónico corporativo
  - Teléfono de contacto
  - Cargo
- Datos de autenticación:
  - Credenciales de acceso
  - Tokens de recuperación
  - Historial de operaciones
- Datos de trabajo:
  - Asignaciones
  - Historial de acciones
  - Métricas de rendimiento

**Ciclo de Vida**:
1. **Registro**:
   - Invitación por administrador
   - Creación de cuenta
   - Asignación de permisos

2. **Activo**:
   - Operaciones diarias
   - Actualización de perfil
   - Gestión de tareas

3. **Inactivo**:
   - Desactivación por administrador
   - Suspensión temporal
   - Cambio de rol

4. **Eliminación**:
   - Eliminación por administrador
   - Archivado de historial
   - Limpieza de datos personales

### 4. Auditor

**Datos del Perfil**:
- Información personal:
  - Nombre completo
  - Correo electrónico corporativo
  - Teléfono de contacto
  - Especialidad
- Datos de autenticación:
  - Credenciales de acceso
  - Tokens de recuperación
  - Historial de auditorías
- Datos de auditoría:
  - Reportes generados
  - Alertas configuradas
  - Historial de revisiones

**Ciclo de Vida**:
1. **Registro**:
   - Creación por administrador
   - Verificación de credenciales
   - Asignación de alcance

2. **Activo**:
   - Realización de auditorías
   - Generación de reportes
   - Configuración de alertas

3. **Inactivo**:
   - Suspensión temporal
   - Cambio de rol
   - Desactivación por administrador

4. **Eliminación**:
   - Eliminación por administrador
   - Archivado de reportes
   - Limpieza de datos personales

### 5. Manager

**Datos del Perfil**:
- Información personal:
  - Nombre completo
  - Correo electrónico corporativo
  - Teléfono de contacto
  - Cargo
- Datos de autenticación:
  - Credenciales de acceso
  - Tokens de recuperación
  - Historial de operaciones
- Datos de gestión:
  - Equipos asignados
  - Métricas de rendimiento
  - Historial de decisiones

**Ciclo de Vida**:
1. **Registro**:
   - Creación por administrador
   - Asignación de equipos
   - Configuración de permisos

2. **Activo**:
   - Gestión de operadores
   - Supervisión de operaciones
   - Generación de reportes

3. **Inactivo**:
   - Suspensión temporal
   - Cambio de rol
   - Desactivación por administrador

4. **Eliminación**:
   - Eliminación por administrador
   - Archivado de historial
   - Limpieza de datos personales

## Políticas de Retención de Datos

### 1. Datos Personales
- **Activos**: Mantenidos mientras la cuenta esté activa
- **Inactivos**: Retenidos por 30 días
- **Eliminados**: Archivados por 1 año antes de eliminación definitiva

### 2. Datos de Auditoría
- **Logs de Acceso**: Retenidos por 2 años
- **Historial de Cambios**: Retenido por 5 años
- **Reportes de Auditoría**: Retenidos por 7 años

### 3. Datos de Operación
- **Consentimientos**: Retenidos por 10 años
- **Políticas**: Retenidas por 10 años
- **Configuraciones**: Retenidas por 5 años

### 4. Datos de Facturación
- **Facturas**: Retenidas por 7 años
- **Transacciones**: Retenidas por 7 años
- **Documentos fiscales**: Retenidos por 7 años

## Consideraciones de Privacidad

1. **Datos Sensibles**:
   - Encriptación en reposo
   - Encriptación en tránsito
   - Acceso restringido

2. **Exportación de Datos**:
   - Formato estándar (JSON/CSV)
   - Inclusión de metadatos
   - Verificación de integridad

3. **Eliminación de Datos**:
   - Proceso automatizado
   - Verificación de eliminación
   - Certificado de eliminación

4. **Cumplimiento Legal**:
   - GDPR
   - LGPD
   - Regulaciones locales

## Matriz de Permisos por Endpoint

| Endpoint | Método | Titular | Admin | Operador | Auditor | Manager |
|----------|--------|---------|-------|----------|---------|---------|
| `/api/v1/auth/register` | POST | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/api/v1/auth/login` | POST | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/companies/:id/config` | GET | ❌ | ✅ | ❌ | ✅ | ❌ |
| `/api/v1/companies/:id/config` | PUT | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/api/v1/companies/:id/subscription` | GET | ❌ | ✅ | ❌ | ✅ | ❌ |
| `/api/v1/companies/:id/subscription` | PUT | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/api/v1/companies/:companyId/data-types` | GET | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/companies/:companyId/data-types` | POST | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/api/v1/consents/bulk` | POST | ❌ | ✅ | ✅ | ❌ | ✅ |
| `/api/v1/consents/bulk/:id` | GET | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/consents/bulk/:id` | DELETE | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/api/v1/reports/audit` | GET | ❌ | ✅ | ❌ | ✅ | ❌ |
| `/api/v1/reports/consents` | GET | ❌ | ✅ | ✅ | ✅ | ✅ |

## Implementación de Permisos

### 1. Guardias de Autenticación

```typescript
// auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### 2. Decoradores de Roles

```typescript
// auth/decorators/roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### 3. Uso en Controladores

```typescript
@Controller('companies')
export class CompaniesController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put(':id/config')
  async updateConfig() {
    // Implementación
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'MANAGER')
  @Get(':id/data-types')
  async getDataTypes() {
    // Implementación
  }
}
```

## Consideraciones de Seguridad

1. **Principio de Mínimo Privilegio**:
   - Cada rol debe tener solo los permisos necesarios para su función
   - Evitar la acumulación de permisos innecesarios

2. **Validación en Múltiples Capas**:
   - Frontend: Mostrar/ocultar elementos según permisos
   - BFF: Validar permisos en cada endpoint
   - Supabase: Políticas RLS como última capa de seguridad

3. **Auditoría de Accesos**:
   - Registrar todos los intentos de acceso
   - Mantener historial de cambios en permisos
   - Alertar sobre accesos sospechosos

4. **Gestión de Sesiones**:
   - Tiempo de expiración de sesiones
   - Inicio de sesión desde múltiples dispositivos
   - Revocación de accesos

## Próximos Pasos

1. **Implementación de Roles Intermedios**:
   - Desarrollar sistema de roles personalizados
   - Permitir creación de roles específicos por empresa

2. **Mejoras en Auditoría**:
   - Implementar sistema de alertas
   - Mejorar visualización de logs
   - Automatizar reportes de seguridad

3. **Optimización de Permisos**:
   - Revisar y ajustar matriz de permisos
   - Implementar permisos granulares
   - Mejorar UX en gestión de permisos 