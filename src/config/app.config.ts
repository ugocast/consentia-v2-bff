/**
 * Configuración de la aplicación
 */
export const appConfig = {
  name: 'Consentia BFF',
  version: '1.0.0',
  description: 'Backend for Frontend para la aplicación Consentia',

  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    apiPrefix: 'api/v1',
    docsPath: 'api/docs',
  },

  // Configuración de Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'consentia-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  // Configuración de correo electrónico
  email: {
    from: process.env.EMAIL_FROM || 'no-reply@consentia.io',
    smtp: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    },
  },
};
