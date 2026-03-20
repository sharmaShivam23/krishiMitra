import fs from 'fs';
import { translate } from '@vitalets/google-translate-api';

const delay = ms => new Promise(res => setTimeout(res, ms));

const translateText = async (text, targetLang, retries = 3) => {
    if (typeof text !== 'string' || !text.trim()) return text;
    for (let i = 0; i < retries; i++) {
        try {
            const res = await Promise.race([
                translate(text, { to: targetLang }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
            ]);
            return res.text;
        } catch (e) {
            console.error(`Attempt ${i+1} failed for '${text.substring(0, 20)}...':`, e.message);
            await delay(1000 * (i + 1));
        }
    }
    return text; // Return original if all retries fail
};

const translateObject = async (obj, targetLang, basePath) => {
    const result = Array.isArray(obj) ? [] : {};
    let count = 0;
    
    // Load existing progress if any
    if (fs.existsSync(basePath)) {
        try {
           const existing = JSON.parse(fs.readFileSync(basePath, 'utf8'));
           Object.assign(result, existing);
        } catch(e) {}
    }

    for (const [key, value] of Object.entries(obj)) {
        if (result[key] !== undefined && Object.keys(result[key] || {}).length > 0) {
            continue; // Skip already translated keys at top level
        }
        
        console.log(`Translating section: ${key}`);
        if (typeof value === 'object' && value !== null) {
             // For simplicity in this script, we recursively translate but don't save mid-section
             const sectionResult = Array.isArray(value) ? [] : {};
             for (const [subKey, subValue] of Object.entries(value)) {
                 if (typeof subValue === 'object' && subValue !== null) {
                     // 1 layer deeper
                     const deeperResult = {};
                     for (const [deepKey, deepValue] of Object.entries(subValue)) {
                          if (typeof deepValue === 'string') {
                              deeperResult[deepKey] = await translateText(deepValue, targetLang);
                              await delay(100);
                          } else { deeperResult[deepKey] = deepValue; }
                     }
                     sectionResult[subKey] = deeperResult;
                 } else if (typeof subValue === 'string') {
                     sectionResult[subKey] = await translateText(subValue, targetLang);
                     await delay(100);
                 } else {
                     sectionResult[subKey] = subValue;
                 }
             }
             result[key] = sectionResult;
        } else if (typeof value === 'string') {
            result[key] = await translateText(value, targetLang);
            await delay(100);
        } else {
            result[key] = value;
        }
        
        // Save progress after every top-level key
        fs.writeFileSync(basePath, JSON.stringify(result, null, 2));
    }
    return result;
};

const main = async () => {
    const raw = fs.readFileSync('messages/en.json', 'utf8');
    const enData = JSON.parse(raw);
    
    // Process one language at a time, completely
    const langs = [
        'hi', 'pa', 'mr', 'bn', 'te', 'ta',
        'as', 'gu', 'kn', 'ml', 'or', 'ur',
        'sa', 'sd', 'ne', 'mai', 'doi', 'gom', 
        'sat', 'ks', 'mni'
    ];
    
    for (const lang of langs) {
        console.log(`\n=== Starting translation for ${lang} ===`);
        const targetFile = `messages/${lang}.json`;
        try {
            await translateObject(enData, lang, targetFile);
            console.log(`Finished translating ${lang}.json`);
        } catch (err) {
            console.error(`Failed on ${lang}:`, err.message);
        }
    }
};

main();
