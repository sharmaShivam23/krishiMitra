/**
 * Security utilities for Next.js API routes.
 *
 * Covers:
 *  - XSS sanitization (strips script/event handler injection)
 *  - MongoDB query injection prevention
 *  - HTTP Parameter Pollution (HPP) — deduplication
 *  - CORS helpers
 */

// ─── XSS sanitization ───────────────────────────────────────────────────────

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<[^>]+\s(on\w+)\s*=/gi,      // onload, onclick, onerror …
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /expression\s*\(/gi,           // CSS expression()
];

/** Strip XSS payloads from a string */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return String(input ?? '');
  let out = input.trim();
  for (const pattern of XSS_PATTERNS) {
    out = out.replace(pattern, '');
  }
  return out;
}

/** Recursively sanitize all string values in an object */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      result[k] = sanitizeString(v);
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = sanitizeObject(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      result[k] = v.map(item =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else {
      result[k] = v;
    }
  }
  return result as T;
}

// ─── MongoDB sanitization ────────────────────────────────────────────────────

const MONGO_OPERATORS = /^\$|\./;

/** Remove any key that starts with $ or contains . (NoSQL injection prevention) */
export function mongoSanitize<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (MONGO_OPERATORS.test(k)) continue; // drop dangerous key
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = mongoSanitize(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result as T;
}

// ─── HPP — HTTP Parameter Pollution prevention ───────────────────────────────

/**
 * Given a URLSearchParams, return a plain object keeping only the LAST
 * value for any duplicated key (mirrors Express hpp default behaviour).
 */
export function sanitizeQueryParams(params: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    result[k] = v; // last value wins
  }
  return result;
}

// ─── Sanitize + parse JSON body from a Request ──────────────────────────────

/**
 * Safely parse JSON body, apply MongoDB + XSS sanitization.
 * Returns null if parsing fails.
 */
export async function parseSafeBody<T extends Record<string, unknown>>(
  req: Request
): Promise<T | null> {
  try {
    const raw = await req.json();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const noMongo = mongoSanitize(raw as Record<string, unknown>);
    const noXss = sanitizeObject(noMongo);
    return noXss as T;
  } catch {
    return null;
  }
}

// ─── CORS ─────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // server-to-server or same-origin
  if (process.env.NODE_ENV === 'development') return true;
  return ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin);
}

/** Standard security + CORS headers for API responses */
export function secureHeaders(origin: string | null = null): HeadersInit {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  };

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS.length === 0 ? '*' : origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Max-Age'] = '86400';
    headers['Vary'] = 'Origin';
  }

  return headers;
}

/** Respond to CORS preflight OPTIONS requests */
export function handleCorsOptions(origin: string | null): Response {
  return new Response(null, { status: 204, headers: secureHeaders(origin) as HeadersInit });
}
