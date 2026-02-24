/**
 * Extracts a typed array from an AI JSON response object.
 *
 * Checks each key in `preferredKeys` in order, then falls back to the first
 * top-level array value found. Logs a warning when the fallback is used so
 * unexpected schema changes are visible in server logs.
 */
export function extractArrayFromAIResponse<T>(
  parsed: Record<string, unknown>,
  preferredKeys: string[],
  label: string
): T[] {
  for (const key of preferredKeys) {
    if (Array.isArray(parsed[key])) {
      return parsed[key] as T[];
    }
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (Array.isArray(value)) {
      console.warn(`[${label}] Found data under unexpected key: "${key}"`);
      return value as T[];
    }
  }

  return [];
}
