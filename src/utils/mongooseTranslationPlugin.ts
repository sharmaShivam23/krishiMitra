import { Schema, Document, Query } from 'mongoose';

/**
 * Recursively scans a document to flatten translation sub-documents into strings
 * based on the provided locale.
 */
function mapTranslations(data: any, locale: string): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => mapTranslations(item, locale));
  }

  // Handle objects recursively
  if (typeof data === 'object') {
    if (data instanceof Date) return data;

    // Is it a translation dict that we defined? (originalText, translations)
    if ('originalText' in data && 'translations' in data) {
      const obj = data as any;
      const translations = obj.translations || {};
      return translations[locale] || obj.originalText || '';
    }

    // Otherwise loop key-value pairs
    const mappedObj: any = {};
    for (const [key, value] of Object.entries(data)) {
      mappedObj[key] = mapTranslations(value, locale);
    }
    return mappedObj;
  }

  return data;
}

/**
 * Global Mongoose plugin to intercept queries and apply target translations.
 * 
 * Usage in Next.js API Routes:
 * Model.find({}).setOptions({ locale: 'hi' })
 */
export function globalTranslationPlugin(schema: Schema) {
  
  // Post hook for 'find'
  schema.post('find', function (docs: any[], next) {
    // Read the locale parameter from the query context options
    const options = this.getOptions();
    const locale = options.locale;

    if (locale && docs && Array.isArray(docs)) {
      for (let i = 0; i < docs.length; i++) {
        // If it's a mongoose doc, we work on its lean/raw representation.
        // It's highly recommended to use `.lean()` when extracting translated strings 
        // because transforming schema paths directly into generic strings creates Mongoose type mismatches.
        const isMongooseDoc = typeof docs[i].toObject === 'function';
        const rawDoc = isMongooseDoc ? docs[i].toObject() : docs[i];
        
        docs[i] = mapTranslations(rawDoc, locale);
      }
    }
    next();
  });

  // Post hook for 'findOne'
  schema.post('findOne', function (doc: any, next) {
    const options = this.getOptions();
    const locale = options.locale;

    if (locale && doc) {
      const isMongooseDoc = typeof doc.toObject === 'function';
      const rawDoc = isMongooseDoc ? doc.toObject() : doc;

      // Replace the doc with the localized structure
      const translated = mapTranslations(rawDoc, locale);
      
      // If the query was not lean, re-assigning properties to `doc` directly is fraught.
      // Usually extending the Document using Object.assign works for plain object returns, 
      // but returning a modified clone works best for returning flat json to Next.js API responses.
      Object.assign(doc, translated);
    }
    next();
  });
}
