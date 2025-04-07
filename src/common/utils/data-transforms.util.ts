/**
 * Utilidades para transformación de datos
 */

/**
 * Gestiona una propiedad que puede ser un array u objeto único desde la respuesta de Supabase
 * @param property - Propiedad que puede ser un array u objeto
 * @returns El primer elemento del array o el objeto mismo, o null si no existe
 */
export function handleNestedProperty<T>(property: T | T[] | null | undefined): T | null {
  if (!property) {
    return null;
  }
  
  if (Array.isArray(property)) {
    return property.length > 0 ? property[0] : null;
  }
  
  return property;
}

/**
 * Extrae un valor seguro de una propiedad, aplicando un valor predeterminado si es necesario
 * @param obj - Objeto que contiene la propiedad
 * @param key - Clave de la propiedad a extraer
 * @param defaultValue - Valor predeterminado a utilizar si la propiedad no existe
 * @returns El valor de la propiedad o el valor predeterminado
 */
export function safeValue<T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K, 
  defaultValue: T[K]
): T[K] {
  if (!obj) {
    return defaultValue;
  }
  
  const value = obj[key];
  return value === null || value === undefined ? defaultValue : value;
}

/**
 * Convierte un objeto de detalles a una estructura segura
 * @param details - Objeto de detalles (metadata)
 * @returns Detalles como objeto o un objeto vacío si es null/undefined
 */
export function safeMetadata<T extends Record<string, any>>(
  details: T | null | undefined
): Record<string, any> {
  return details ?? {};
}

/**
 * Procesa arrays de manera segura
 * @param arr - Array a procesar
 * @param mapFn - Función de mapeo para aplicar a cada elemento
 * @returns Array procesado o array vacío si la entrada es null/undefined
 */
export function safeArrayMap<T, R>(
  arr: T[] | null | undefined, 
  mapFn: (item: T) => R
): R[] {
  return (arr ?? []).map(mapFn);
} 