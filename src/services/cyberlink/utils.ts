/**
 * Sanitizes query results by converting BigInt to string and handling undefined values
 * @param obj Any query result object
 * @returns Sanitized object
 */
export const sanitizeQueryResult = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (typeof obj === 'function') return undefined;
  if (Array.isArray(obj)) return obj.map(sanitizeQueryResult);
  if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const sanitizedValue = sanitizeQueryResult(obj[key]);
        if (sanitizedValue !== undefined) {
          newObj[key] = sanitizedValue;
        }
      }
    }
    return newObj;
  }
  return obj;
};

export function removeEmptyValues<T extends Record<string, any>>(obj: T): T {
  const filtered = Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null && value !== '')
  );
  return filtered as T;
}

export function stringifyValue(value: any | undefined) {
  return value ? JSON.stringify(value) : undefined;
}
