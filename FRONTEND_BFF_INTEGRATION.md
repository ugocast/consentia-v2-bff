# Guía de Integración Frontend-BFF

Esta guía proporciona instrucciones para integrar aplicaciones frontend con el Backend-For-Frontend (BFF) de Consentia tras la migración a Supabase Auth.

## Resumen de Cambios

La migración a Supabase Auth introduce los siguientes cambios principales:

1. La autenticación ahora se realiza directamente con Supabase Auth en el frontend
2. El BFF verifica los tokens JWT emitidos por Supabase
3. Varios endpoints de autenticación han quedado obsoletos (ver [BFF_Endpoints.MD](./BFF_Endpoints.MD))
4. Se han añadido nuevos endpoints para complementar funcionalidades de Supabase

## Configuración del Frontend

### 1. Instalar el Cliente de Supabase

```bash
# Para React/Next.js
npm install @supabase/supabase-js

# Para Vue.js
npm install @supabase/supabase-js
```

### 2. Inicializar Supabase

```javascript
// config/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Implementar Autenticación

```javascript
// auth/authService.js

import { supabase } from '../config/supabase'

// Registro con email/password
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) throw error
  
  // Llamar al endpoint de onboarding del BFF si es necesario
  if (data?.user) {
    await syncUserData(data.user)
  }
  
  return data
}

// Login con email/password
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

// Cerrar sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Sincronizar datos con BFF
export const syncUserData = async (user) => {
  const { data: sessionData } = await supabase.auth.getSession()
  
  if (!sessionData?.session?.access_token) {
    throw new Error('No session token available')
  }

  // Llamar al BFF para sincronizar datos
  const response = await fetch('https://bff.consentia.com/auth/sync-user-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionData.session.access_token}`
    },
    body: JSON.stringify({ userId: user.id })
  })
  
  if (!response.ok) {
    throw new Error('Failed to sync user data with BFF')
  }
  
  return await response.json()
}
```

### 4. Crear un Cliente HTTP Autenticado

```javascript
// api/apiClient.js

import { supabase } from '../config/supabase'

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'https://bff.consentia.com'

export const apiClient = {
  get: async (endpoint) => {
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (!sessionData?.session?.access_token) {
      throw new Error('No authentication token available')
    }
    
    const response = await fetch(`${BFF_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  },
  
  post: async (endpoint, body = {}) => {
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (!sessionData?.session?.access_token) {
      throw new Error('No authentication token available')
    }
    
    const response = await fetch(`${BFF_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  },
  
  // Añadir métodos PUT, DELETE según sea necesario
}
```

## Ejemplo de Flujo de Integración

### Registro y Onboarding

1. El usuario se registra usando Supabase Auth en el frontend
2. Tras un registro exitoso, llamar a `syncUserData` para iniciar el proceso de onboarding
3. Usar `apiClient.get('/auth/onboarding-status')` para verificar el estado del onboarding
4. Guiar al usuario a través del proceso de onboarding basado en el estado devuelto

### Login y Acceso a Recursos Protegidos

1. El usuario inicia sesión usando Supabase Auth
2. Usar el cliente HTTP autenticado para acceder a los endpoints del BFF
3. El BFF verifica el token JWT de Supabase y procesa las solicitudes

```javascript
// Ejemplo de acceso a recurso protegido
const getUserProfile = async () => {
  try {
    const profile = await apiClient.get('/user/profile')
    return profile
  } catch (error) {
    console.error('Error fetching user profile:', error)
    // Manejar errores de autenticación o realizar logout si es necesario
    if (error.message.includes('authentication')) {
      await signOut()
      // Redirigir a login
    }
  }
}
```

## Manejo de Errores Comunes

### Token Expirado

Si el token JWT expira, Supabase se encargará automáticamente de la renovación. Sin embargo, si hay problemas:

```javascript
// Verificar y renovar sesión
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()
  
  if (error) {
    // Sesión no válida, redirigir a login
    await signOut()
    return false
  }
  
  return data.session !== null
}
```

### Errores HTTP Comunes

- **401 Unauthorized**: Token no válido o expirado
- **403 Forbidden**: Usuario no tiene permisos para el recurso
- **404 Not Found**: Endpoint no encontrado
- **500 Server Error**: Error interno del servidor

## Migración desde el Sistema Anterior

Si estás migrando una aplicación existente:

1. Reemplazar los endpoints de autenticación antiguos con las funciones de Supabase Auth
2. Actualizar las llamadas a los endpoints que ahora son obsoletos (ver [BFF_Endpoints.MD](./BFF_Endpoints.MD))
3. Asegurarse de que todas las solicitudes al BFF incluyan el token JWT de Supabase
4. Implementar el manejo de errores apropiado para los nuevos códigos de estado

## Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.io/docs/guides/auth)
- [BFF API Endpoints](./BFF_Endpoints.MD)
- [Arquitectura de Autenticación](./docs/AUTH_ARCHITECTURE.md) 