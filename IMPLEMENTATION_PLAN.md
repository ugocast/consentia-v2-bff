# Plan de Implementación: Aislamiento de Datos con Supabase y Drizzle

## 1. Visión General

Este documento detalla el plan de implementación para asegurar el aislamiento de datos entre usuarios empresariales y usuarios finales (titulares de datos) en el sistema Consentia, utilizando Supabase como plataforma principal y Drizzle como ORM.

### 1.1 Arquitectura de Supabase

#### Autenticación
- Supabase Auth para gestión de usuarios
- JWT con claims personalizados
- Proveedores sociales (opcional)
- MFA (opcional)

#### Base de Datos
- PostgreSQL con PostgREST
- Row Level Security (RLS)
- Políticas de acceso granulares
- Funciones y triggers nativos

#### Storage
- Almacenamiento de archivos
- Políticas de acceso por bucket
- URLs firmadas para acceso temporal

#### Realtime
- Suscripciones en tiempo real
- Cambios en consentimientos
- Notificaciones

### 1.2 Tipos de Usuarios

#### Usuario Empresarial
- Autenticación: Supabase Auth
- Roles: ADMINISTRATOR, OPERATOR, AUDITOR
- Acceso: Basado en `company_id`
- Permisos: Definidos por RLS
- Datos: Aislados por empresa

#### Usuario Final (Titular de Datos)
- Autenticación: Supabase Auth
- Acceso: Basado en `data_subject_id`
- Permisos: Limitados a datos personales
- Datos: Aislados por titular

## 2. Implementación de Base de Datos

### 2.1 Configuración de RLS

#### Políticas Base
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.company_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
```

#### Políticas por Tabla
```sql
-- company_user
CREATE POLICY "Company users can view their company users"
ON public.company_user
FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_id 
    FROM public.company_user 
    WHERE company_id = company_user.company_id
  )
);

-- consent
CREATE POLICY "Company users can view their company consents"
ON public.consent
FOR SELECT
USING (
  auth.uid() IN (
    SELECT cu.auth_id 
    FROM public.company_user cu
    WHERE cu.company_id = consent.company_id
  )
);

-- data_subject
CREATE POLICY "Data subjects can view their own data"
ON public.data_subject
FOR SELECT
USING (auth.uid() = auth_id);
```

### 2.2 Funciones de Base de Datos

#### Validación de Acceso
```sql
CREATE OR REPLACE FUNCTION validate_company_access(
  p_auth_id UUID,
  p_company_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_user
    WHERE auth_id = p_auth_id
    AND company_id = p_company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Auditoría
```sql
CREATE OR REPLACE FUNCTION log_audit(
  p_action TEXT,
  p_company_user_id UUID,
  p_data_subject_id UUID,
  p_details JSONB
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_log (
    company_user_id,
    data_subject_id,
    action,
    ip_address,
    details
  ) VALUES (
    p_company_user_id,
    p_data_subject_id,
    p_action,
    current_setting('request.jwt.claims', true)::json->>'ip',
    p_details
  ) RETURNING audit_id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. Implementación de Autenticación

### 3.1 Configuración de Supabase Auth

```typescript
// supabase.config.ts
export const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      type: 'localStorage',
      key: 'consentia_auth'
    }
  }
};
```

### 3.2 Servicio de Autenticación

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  private supabase = createSupabaseClient();
  private db = drizzle(/* configuración */);

  async register(registerDto: RegisterDto) {
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: registerDto.email,
      password: registerDto.password,
      options: {
        data: {
          userType: registerDto.userType,
          name: registerDto.name
        }
      }
    });

    if (authError) throw new Error(authError.message);

    // Crear registro específico según tipo
    if (registerDto.userType === 'COMPANY') {
      await this.createCompanyUser(authData.user.id, registerDto);
    } else {
      await this.createDataSubject(authData.user.id, registerDto);
    }

    return authData;
  }

  async login(loginDto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password
    });

    if (error) throw new UnauthorizedException(error.message);

    // Obtener datos adicionales según tipo
    const userType = data.user.user_metadata.userType;
    const additionalData = await this.getUserData(userType, data.user.id);

    return {
      ...data,
      user: {
        ...data.user,
        ...additionalData
      }
    };
  }
}
```

## 4. Implementación de Middleware y Guards

### 4.1 Middleware de Validación

```typescript
// user-type-validation.middleware.ts
@Injectable()
export class UserTypeValidationMiddleware implements NestMiddleware {
  private supabase = createSupabaseClient();
  private db = drizzle(/* configuración */);

  async use(req: Request, res: Response, next: Function) {
    try {
      const token = this.extractTokenFromHeader(req);
      if (!token) throw new UnauthorizedException();

      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      if (error) throw new UnauthorizedException();

      const userType = user.user_metadata.userType;
      const context = await this.getUserContext(userType, user.id);

      req['userContext'] = {
        userId: user.id,
        userType,
        ...context
      };

      next();
    } catch (error) {
      next(error);
    }
  }
}
```

### 4.2 Guards

```typescript
// company.guard.ts
@Injectable()
export class CompanyGuard implements CanActivate {
  private db = drizzle(/* configuración */);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userContext = request.userContext;

    if (userContext.userType !== 'COMPANY') {
      throw new ForbiddenException('Acceso solo para usuarios empresariales');
    }

    return true;
  }
}
```

## 5. Implementación de Servicios

### 5.1 Servicio de Consentimientos

```typescript
// consents.service.ts
@Injectable()
export class ConsentsService {
  private db = drizzle(/* configuración */);
  private supabase = createSupabaseClient();

  async createConsent(createConsentDto: CreateConsentDto) {
    // Validar acceso
    await this.validateAccess(createConsentDto.companyId);

    // Crear consentimiento
    const consent = await this.db.insert(consent).values({
      ...createConsentDto,
      status: 'PENDING'
    }).returning();

    // Registrar auditoría
    await this.logAudit('CREATE_CONSENT', consent[0]);

    // Notificar cambios en tiempo real
    this.supabase
      .channel('consents')
      .send({
        type: 'broadcast',
        event: 'consent_created',
        payload: consent[0]
      });

    return consent[0];
  }
}
```

## 6. Plan de Implementación

### Fase 1: Configuración de Supabase (1 semana)
1. Configurar proyecto en Supabase
2. Implementar esquema de base de datos
3. Configurar políticas RLS
4. Crear funciones de base de datos
5. Configurar autenticación
6. Probar configuración básica

### Fase 2: Autenticación y Autorización (1 semana)
1. Implementar AuthService
2. Configurar middleware de validación
3. Crear guards
4. Implementar decoradores
5. Probar flujos de autenticación
6. Validar políticas de acceso

### Fase 3: Servicios y Lógica (1 semana)
1. Implementar servicios base
2. Integrar con RLS
3. Implementar auditoría
4. Configurar realtime
5. Probar funcionalidad
6. Optimizar consultas

### Fase 4: Testing y Seguridad (1 semana)
1. Implementar pruebas unitarias
2. Probar políticas RLS
3. Validar aislamiento de datos
4. Probar realtime
5. Revisar seguridad
6. Optimizar rendimiento

## 7. Estructura de Archivos

```
src/
├── config/
│   ├── supabase.config.ts
│   └── drizzle.config.ts
├── auth/
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── dto/
│       ├── register.dto.ts
│       └── login.dto.ts
├── common/
│   ├── guards/
│   │   ├── company.guard.ts
│   │   └── data-subject.guard.ts
│   ├── decorators/
│   │   ├── company.decorator.ts
│   │   └── data-subject.decorator.ts
│   └── middleware/
│       └── user-type-validation.middleware.ts
├── services/
│   ├── consents.service.ts
│   ├── companies.service.ts
│   └── data-subjects.service.ts
└── supabase/
    ├── policies/
    │   ├── company.policies.sql
    │   └── data-subject.policies.sql
    ├── functions/
    │   ├── validate-company.sql
    │   └── log-audit.sql
    └── triggers/
        └── audit-logger.sql
```

## 8. Métricas de Éxito

### 8.1 Funcionales
- Tiempo de respuesta < 200ms
- Disponibilidad > 99.9%
- Cobertura de pruebas > 80%
- Tasa de errores < 1%
- Latencia de realtime < 100ms

### 8.2 No Funcionales
- Seguridad de datos
- Escalabilidad
- Mantenibilidad
- Documentación

## 9. Riesgos y Mitigaciones

### 9.1 Riesgos
1. Complejidad de RLS
2. Rendimiento de consultas
3. Sincronización de datos
4. Escalabilidad de realtime

### 9.2 Mitigaciones
1. Pruebas exhaustivas
2. Optimización de consultas
3. Caché estratégico
4. Monitoreo continuo

## 10. Próximos Pasos

### 10.1 Inmediatos
1. Configurar proyecto Supabase
2. Implementar esquema base
3. Configurar autenticación
4. Probar configuración

### 10.2 Corto Plazo
1. Implementar servicios base
2. Configurar RLS
3. Implementar auditoría
4. Probar funcionalidad

### 10.3 Mediano Plazo
1. Optimizar rendimiento
2. Implementar realtime
3. Mejorar seguridad
4. Documentar sistema 