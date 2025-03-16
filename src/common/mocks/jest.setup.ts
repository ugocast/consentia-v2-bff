// Configuración global para Jest

// Configurar el mock para console.log y otros métodos de console
global.console = {
  ...console,
  // Silenciar los logs durante las pruebas
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configurar el mock para process.env
process.env = {
  ...process.env,
  // Variables de entorno para pruebas
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_KEY: 'test-anon-key',
  SUPABASE_SERVICE_KEY: 'test-service-key',
  JWT_SECRET: 'test-jwt-secret',
  FRONTEND_URL: 'http://localhost:3001',
};
