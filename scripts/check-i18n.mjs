import fs from 'node:fs';
import path from 'node:path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const BASE_FILE = 'en.json';

const flattenKeys = (obj, prefix = '') => {
  return Object.entries(obj).flatMap(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value, next);
    }
    return [next];
  });
};

const loadJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const main = () => {
  if (!fs.existsSync(MESSAGES_DIR)) {
    console.error(`messages directory not found: ${MESSAGES_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MESSAGES_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort();

  if (!files.includes(BASE_FILE)) {
    console.error(`base locale file missing: ${BASE_FILE}`);
    process.exit(1);
  }

  const baseKeys = flattenKeys(loadJson(path.join(MESSAGES_DIR, BASE_FILE)));
  const baseSet = new Set(baseKeys);

  let hasError = false;

  for (const file of files) {
    const fullPath = path.join(MESSAGES_DIR, file);
    const keys = flattenKeys(loadJson(fullPath));
    const keySet = new Set(keys);

    const missing = baseKeys.filter((k) => !keySet.has(k));
    const extra = keys.filter((k) => !baseSet.has(k));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`${file}: OK`);
      continue;
    }

    hasError = true;
    console.error(`${file}:`);
    if (missing.length > 0) {
      console.error(`  Missing keys (${missing.length}): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ' ...' : ''}`);
    }
    if (extra.length > 0) {
      console.error(`  Extra keys (${extra.length}): ${extra.slice(0, 10).join(', ')}${extra.length > 10 ? ' ...' : ''}`);
    }
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('All locale files match en.json key structure.');
};

main();
