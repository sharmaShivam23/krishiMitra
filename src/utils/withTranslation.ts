// src/utils/withTranslation.ts

const IGNORE_KEYS = new Set([
  '_id',
  'id',
  'author',
  'createdAt',
  'updatedAt',
  'date',
  'tags',
  'originalLanguage',
  'phone',
  'password',
  'email',
  'role',
  'image',
  'link',
  'url',
  'state',
  'district',
  'market',
  'commodity',
  'status',
]);

/**
 * Mocks a call to a translation API.
 * In a real app, this would call AWS Translate, Google Translate, etc.
 */
async function mockTranslateAPI(text: string, locale: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 30));
  return `[Mocked ${locale.toUpperCase()}] ${text}`;
}

/**
 * Recursively scans a JSON object.
 * - Extracts `translations[locale]` if available.
 * - Otherwise, mock translates plain strings (except ignored keys).
 */
export async function withTranslation<T>(data: T, locale: string): Promise<T> {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    const localizedArray = await Promise.all(
      data.map((item) => withTranslation(item, locale))
    );
    return localizedArray as unknown as T;
  }

  // Handle objects
  if (typeof data === 'object') {
    // If it's a MongoDB Date or similar object, return as is
    if (data instanceof Date) return data;

    // Check if this object is a structured translation field
    if ('originalText' in data && 'translations' in data) {
      const obj = data as any;
      const translations = obj.translations || {};
      
      // If we have the exact locale, use it. Otherwise fallback to originalText
      if (translations[locale]) {
        return translations[locale]; // Return the raw localized string directly!
      }
      return obj.originalText;
    }

    // Otherwise, iterate over the keys recursively
    const localizedObj: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        if (IGNORE_KEYS.has(key)) {
          // Skip translation for IDs and metadata
          localizedObj[key] = value;
        } else {
          // It's a normal string, mock a translation!
          localizedObj[key] = await mockTranslateAPI(value, locale);
        }
      } else {
        // Recurse for nested objects/arrays
        localizedObj[key] = await withTranslation(value, locale);
      }
    }
    return localizedObj as T;
  }

  // Handle plain strings that somehow get passed directly
  if (typeof data === 'string') {
    return (await mockTranslateAPI(data, locale)) as unknown as T;
  }

  // Return numbers, booleans, and other primitives as is
  return data;
}
