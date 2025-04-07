import { createSupabaseClient } from './config/supabase.config';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Función principal de prueba
async function testAuditLog() {
  console.log('Iniciando prueba de audit log...');
  
  try {
    // Crear cliente de Supabase
    const supabase = createSupabaseClient({ useServiceKey: true });
    console.log('Cliente Supabase creado correctamente');
    
    // Intentar insertar un registro de auditoría directamente
    const { data, error } = await supabase.from('audit_log').insert({
      action: 'test_action',
      company_user_id: null,
      data_subject_id: null,
      ip_address: '127.0.0.1',
      action_at: new Date().toISOString(),
      details: { test: true, message: 'Prueba de integración de audit service' }
    }).select();
    
    if (error) {
      console.error('Error al insertar registro de auditoría:', error);
    } else {
      console.log('Registro de auditoría insertado correctamente:', data);
    }
    
    // Intentar obtener registros de auditoría
    const { data: logs, error: fetchError } = await supabase
      .from('audit_log')
      .select('*')
      .order('action_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('Error al obtener registros de auditoría:', fetchError);
    } else {
      console.log('Últimos 5 registros de auditoría:');
      logs.forEach(log => {
        console.log(`ID: ${log.audit_id}, Acción: ${log.action}, Fecha: ${log.action_at}`);
        console.log(`Detalles:`, log.details);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutar la prueba
testAuditLog()
  .then(() => console.log('Prueba completada'))
  .catch(error => console.error('Error en la prueba:', error))
  .finally(() => process.exit(0)); 