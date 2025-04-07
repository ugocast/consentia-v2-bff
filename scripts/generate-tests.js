#!/usr/bin/env node

/**
 * Script para generar automáticamente archivos de prueba
 * para servicios y controladores.
 * 
 * Uso:
 * node scripts/generate-tests.js <path-to-file>
 * 
 * Ejemplo:
 * node scripts/generate-tests.js src/companies/companies.service.ts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Obtener argumentos
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Error: Se requiere la ruta del archivo como argumento.');
  console.error('Uso: node scripts/generate-tests.js <path-to-file>');
  process.exit(1);
}

const filePath = args[0];
const fileContent = fs.readFileSync(filePath, 'utf8');
const filename = path.basename(filePath);
const directory = path.dirname(filePath);
const fileBaseName = filename.replace(/\.(controller|service|guard|pipe|interceptor|filter)\.ts$/, '');
const fileType = filename.match(/\.(controller|service|guard|pipe|interceptor|filter)\.ts$/)?.[1];

// Verificar si el archivo ya tiene tests
const testFilePath = `${directory}/${fileBaseName}.${fileType}.spec.ts`;
if (fs.existsSync(testFilePath)) {
  console.error(`Error: El archivo de prueba ${testFilePath} ya existe.`);
  process.exit(1);
}

// Extraer nombre de la clase
const classNameMatch = fileContent.match(/export class (\w+)/);
if (!classNameMatch) {
  console.error('Error: No se pudo encontrar la clase en el archivo.');
  process.exit(1);
}

const className = classNameMatch[1];

// Extraer imports
const imports = [];
let match;
const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
while ((match = importRegex.exec(fileContent)) !== null) {
  const importedItems = match[1].split(',').map(item => item.trim());
  const importPath = match[2];
  
  importedItems.forEach(item => {
    imports.push({ name: item, path: importPath });
  });
}

// Extraer dependencias inyectadas
const constructorMatch = fileContent.match(/constructor\s*\(([^)]*)\)/s);
let dependencies = [];
if (constructorMatch) {
  const constructorParams = constructorMatch[1];
  // Extraer parámetros del constructor
  const paramRegex = /private\s+readonly\s+(\w+)\s*:\s*(\w+)|private\s+(\w+)\s*:\s*(\w+)|readonly\s+(\w+)\s*:\s*(\w+)|protected\s+(\w+)\s*:\s*(\w+)/g;
  let depMatch;
  while ((depMatch = paramRegex.exec(constructorParams)) !== null) {
    // Extraer el nombre y tipo de la dependencia
    const [, name1, type1, name2, type2, name3, type3, name4, type4] = depMatch;
    const name = name1 || name2 || name3 || name4;
    const type = type1 || type2 || type3 || type4;
    dependencies.push({ name, type });
  }
}

// Extraer métodos públicos
const methodRegex = /async\s+(\w+)\s*\(([^)]*)\)|\s+(\w+)\s*\(([^)]*)\)/g;
const methods = [];
let methodMatch;
while ((methodMatch = methodRegex.exec(fileContent)) !== null) {
  const methodName = methodMatch[1] || methodMatch[3];
  // Solo incluir métodos públicos (no privados o protegidos)
  if (methodName && !fileContent.includes(`private ${methodName}`) && !fileContent.includes(`protected ${methodName}`)) {
    methods.push(methodName);
  }
}

// Generar contenido del archivo de prueba
let testFileContent = '';

// Generar imports
testFileContent += `import { Test, TestingModule } from '@nestjs/testing';\n`;
testFileContent += `import { ${className} } from './${fileBaseName}.${fileType}';\n`;

// Importar dependencias
const uniqueDependencyTypes = [...new Set(dependencies.map(dep => dep.type))];
uniqueDependencyTypes.forEach(type => {
  const importItem = imports.find(item => item.name === type);
  if (importItem) {
    testFileContent += `import { ${type} } from '${importItem.path}';\n`;
  }
});

// Añadir importaciones adicionales basadas en el tipo de archivo
if (fileType === 'controller') {
  testFileContent += `import { mockCreateSupabaseClient } from '../common/mocks/supabase.mock';\n`;
  testFileContent += `import { jwtTestUtils } from '../common/testing/test-utils';\n`;
  
  // Buscar el nombre del servicio
  const serviceImport = imports.find(item => item.name.includes('Service'));
  if (serviceImport) {
    testFileContent += `// Usar el mock del servicio real\n`;
  }
}

if (fileType === 'service') {
  testFileContent += `import { mockSupabaseClient, mockCreateSupabaseClient } from '../common/mocks/supabase.mock';\n`;
  
  // Verificar si usa Drizzle
  if (fileContent.includes('drizzle(')) {
    testFileContent += `import { mockDrizzleClient, mockDrizzle, setupDrizzleResult } from '../common/mocks/drizzle.mock';\n`;
  }
}

testFileContent += `\n`;

// Generar mocks para dependencias
if (dependencies.length > 0) {
  testFileContent += `// Mocks para dependencias\n`;
  dependencies.forEach(dep => {
    testFileContent += `const mock${dep.type} = {\n`;
    // Generate mock methods based on how the dependency is used in the file
    const usageRegex = new RegExp(`${dep.name}\\.(\\w+)`, 'g');
    const usedMethods = new Set();
    let usageMatch;
    while ((usageMatch = usageRegex.exec(fileContent)) !== null) {
      usedMethods.add(usageMatch[1]);
    }
    
    if (usedMethods.size === 0) {
      testFileContent += `  // TODO: Agregar mocks según se necesite\n`;
    } else {
      usedMethods.forEach(method => {
        testFileContent += `  ${method}: jest.fn(),\n`;
      });
    }
    
    testFileContent += `};\n`;
  });
  testFileContent += `\n`;
}

// Inicio de la descripción de prueba
testFileContent += `describe('${className}', () => {\n`;
testFileContent += `  let ${fileType === 'controller' ? 'controller' : 'service'}: ${className};\n`;

// Agregar referencias a los servicios mockeados para controladores
if (fileType === 'controller' && dependencies.length > 0) {
  dependencies.forEach(dep => {
    if (dep.type.includes('Service')) {
      testFileContent += `  let ${dep.name}: ${dep.type};\n`;
    }
  });
}

testFileContent += `\n`;
testFileContent += `  beforeEach(async () => {\n`;
testFileContent += `    // Resetear todos los mocks antes de cada prueba\n`;
testFileContent += `    jest.clearAllMocks();\n\n`;
testFileContent += `    const module: TestingModule = await Test.createTestingModule({\n`;

// Configuración del módulo según el tipo
if (fileType === 'controller') {
  testFileContent += `      controllers: [${className}],\n`;
  testFileContent += `      providers: [\n`;
  
  // Añadir providers mockados
  dependencies.forEach(dep => {
    testFileContent += `        {\n`;
    testFileContent += `          provide: ${dep.type},\n`;
    testFileContent += `          useValue: mock${dep.type},\n`;
    testFileContent += `        },\n`;
  });
  
  testFileContent += `      ],\n`;
} else {
  testFileContent += `      providers: [\n`;
  testFileContent += `        ${className},\n`;
  
  // Añadir providers mockados
  dependencies.forEach(dep => {
    testFileContent += `        {\n`;
    testFileContent += `          provide: ${dep.type},\n`;
    testFileContent += `          useValue: mock${dep.type},\n`;
    testFileContent += `        },\n`;
  });
  
  testFileContent += `      ],\n`;
}

testFileContent += `    }).compile();\n\n`;

// Obtener referencias a los servicios
testFileContent += `    ${fileType === 'controller' ? 'controller' : 'service'} = module.get<${className}>(${className});\n`;

// Obtener referencias a los servicios mockeados para controladores
if (fileType === 'controller' && dependencies.length > 0) {
  dependencies.forEach(dep => {
    if (dep.type.includes('Service')) {
      testFileContent += `    ${dep.name} = module.get<${dep.type}>(${dep.type});\n`;
    }
  });
}

// Configuración adicional según el tipo
if (fileType === 'service') {
  // Configurar mocks de Supabase o Drizzle
  if (fileContent.includes('createSupabaseClient')) {
    testFileContent += `\n    // Configurar el mock para createSupabaseClient\n`;
    testFileContent += `    mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient);\n`;
  }
  
  if (fileContent.includes('drizzle(')) {
    testFileContent += `\n    // Configurar el mock para Drizzle\n`;
    testFileContent += `    mockDrizzle.mockReturnValue(mockDrizzleClient);\n`;
  }
}

testFileContent += `  });\n\n`;

// Test básico de existencia
testFileContent += `  it('should be defined', () => {\n`;
testFileContent += `    expect(${fileType === 'controller' ? 'controller' : 'service'}).toBeDefined();\n`;
testFileContent += `  });\n\n`;

// Generar esqueletos de prueba para cada método
methods.forEach(method => {
  testFileContent += `  describe('${method}', () => {\n`;
  testFileContent += `    it('should ${method} successfully', () => {\n`;
  testFileContent += `      // TODO: Implementar prueba\n`;
  testFileContent += `    });\n\n`;
  testFileContent += `    it('should handle errors correctly', () => {\n`;
  testFileContent += `      // TODO: Implementar prueba de manejo de errores\n`;
  testFileContent += `    });\n`;
  testFileContent += `  });\n\n`;
});

// Fin de la descripción de prueba
testFileContent += `});\n`;

// Escribir el archivo
fs.writeFileSync(testFilePath, testFileContent);
console.log(`Archivo de prueba generado: ${testFilePath}`);

// Formatear el archivo usando Prettier
try {
  execSync(`npx prettier --write ${testFilePath}`);
  console.log('Archivo formateado con Prettier.');
} catch (error) {
  console.log('Advertencia: No se pudo formatear el archivo con Prettier. Asegúrate de tenerlo instalado.');
}

console.log('✅ Generación de archivo de prueba completada con éxito.'); 