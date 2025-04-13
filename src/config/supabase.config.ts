import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

interface CreateClientOptions {
  useServiceKey?: boolean;
}

/**
 * Crea y devuelve un cliente de Supabase configurado
 * @param options Opciones de configuración del cliente
 * @returns Cliente Supabase configurado
 */
export function createSupabaseClient(options: CreateClientOptions = {}): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL no está definida en las variables de entorno');
  }
  
  let supabaseKey;
  
  if (options.useServiceKey) {
    // Usar service key para operaciones administrativas
    supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_KEY no está definida en las variables de entorno');
    }
  } else {
    // Usar anon key para operaciones normales
    supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseKey) {
      throw new Error('SUPABASE_KEY no está definida en las variables de entorno');
    }
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Devuelve el secreto JWT para verificación de tokens
 * @returns String con el secreto JWT
 */
export function getSupabaseJwtSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET no está definida en las variables de entorno');
  }
  
  return secret;
}
