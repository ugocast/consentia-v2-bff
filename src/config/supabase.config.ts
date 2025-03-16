import { createClient } from '@supabase/supabase-js';
import { appConfig } from './app.config';
import * as dotenv from 'dotenv';

// Cargar variables de entorno manualmente
dotenv.config();

interface SupabaseOptions {
  useServiceKey?: boolean;
}

/**
 * Crea un cliente de Supabase con las credenciales configuradas
 */
export const createSupabaseClient = (options: SupabaseOptions = {}) => {
  const { useServiceKey = false } = options;
  
  // Intentar obtener las variables directamente del process.env
  const supabaseUrl = process.env.SUPABASE_URL || appConfig.supabase.url;
  const supabaseKey = useServiceKey
    ? (process.env.SUPABASE_SERVICE_KEY || appConfig.supabase.serviceKey)
    : (process.env.SUPABASE_KEY || appConfig.supabase.anonKey);
  
  console.log('Debug - supabaseUrl:', supabaseUrl);
  console.log('Debug - supabaseKey exists:', !!supabaseKey);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Variables de entorno faltantes:');
    console.error('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.error('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Definido' : 'No definido');
    console.error('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Definido' : 'No definido');
    console.error('appConfig.supabase:', JSON.stringify(appConfig.supabase));
    throw new Error('Faltan las variables de entorno de Supabase');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}; 