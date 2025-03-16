import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tipo para las opciones de creación del cliente
type ClientOptions = {
  useServiceKey?: boolean;
};

/**
 * Crea un cliente de Supabase
 * @param options Opciones para la creación del cliente
 * @param options.useServiceKey Si es true, usa la clave de servicio en lugar de la clave anónima
 * @returns Cliente de Supabase
 */
export const createSupabaseClient = (options: ClientOptions = {}): SupabaseClient => {
  const { useServiceKey = false } = options;
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = useServiceKey 
    ? process.env.SUPABASE_SERVICE_KEY 
    : process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key must be provided in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}; 