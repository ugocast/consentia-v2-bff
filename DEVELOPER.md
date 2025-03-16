# Guía para Desarrolladores

## Flujo de Trabajo con Ramas

Este proyecto utiliza un flujo de trabajo basado en dos ramas principales:

### Rama `main`

- Es la rama de producción
- Contiene código estable y listo para desplegar
- No se debe hacer commits directamente en esta rama
- Los cambios se incorporan mediante Pull Requests desde la rama `developer`

### Rama `developer`

- Es la rama de desarrollo
- Contiene las últimas características en desarrollo
- Los desarrolladores trabajan principalmente en esta rama
- Cuando las características están completas y probadas, se fusionan en `main`

## Proceso de Desarrollo

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/ugocast/consentia-v2-bff.git
   cd consentia-v2-bff
   ```

2. **Cambiar a la rama developer**:
   ```bash
   git checkout developer
   ```

3. **Desarrollar nuevas características**:
   - Para características grandes, crear una rama feature:
     ```bash
     git checkout -b feature/nombre-caracteristica
     ```
   - Para cambios pequeños, trabajar directamente en `developer`

4. **Hacer commits de los cambios**:
   ```bash
   git add .
   git commit -m "Descripción clara del cambio"
   ```

5. **Subir los cambios**:
   ```bash
   git push origin developer
   # O si estás en una rama feature:
   git push origin feature/nombre-caracteristica
   ```

6. **Crear Pull Request**:
   - Para fusionar `feature` en `developer`: crear PR en GitHub
   - Para fusionar `developer` en `main`: crear PR en GitHub

## Despliegue

- Los despliegues a producción se realizan desde la rama `main`
- Antes de desplegar, asegurarse de que todos los tests pasen
- Actualizar la documentación si es necesario

## Convenciones de Código

- Seguir las convenciones de estilo de NestJS
- Usar nombres descriptivos para variables, funciones y clases
- Escribir comentarios para código complejo
- Mantener los archivos organizados según la estructura del proyecto 