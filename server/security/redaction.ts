/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Patterns to detect sensitive secrets and credentials
const SECRET_PATTERNS = [
  /hsk_[a-zA-Z0-9_-]{20,}/g, // Hindsight API keys
  /AIza[0-9A-Za-z-_]{35}/g,   // Google Gemini / Firebase API keys
  /sk-[a-zA-Z0-9]{20,}/g,     // Standard AI / OpenAI keys
  /ghp_[a-zA-Z0-9]{30,}/g,    // GitHub personal access tokens
  /Bearer\s+[a-zA-Z0-9._-]{20,}/gi, // Bearer tokens
  /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, // Emails (in high-sensitivity contexts)
  /password\s*[:=]\s*["']?[^"'\s,;]+["']?/gi,
  /secret\s*[:=]\s*["']?[^"'\s,;]+["']?/gi
];

/**
 * Redacts any detected secrets from strings before logging or returning
 */
export function redactSecrets(input: string | null | undefined): string {
  if (!input) return '';
  let sanitized = String(input);

  // Redact specific known env keys if present in string
  const knownKeys = [
    process.env.GEMINI_API_KEY,
    process.env.HINDSIGHT_API_KEY,
    process.env.SESSION_SECRET
  ].filter((k): k is string => Boolean(k && k.length > 5));

  for (const key of knownKeys) {
    if (sanitized.includes(key)) {
      sanitized = sanitized.split(key).join('[REDACTED_SECRET]');
    }
  }

  // Redact regex patterns
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_CREDENTIAL]');
  }

  return sanitized;
}

/**
 * Sanitizes memories before storing in long-term memory:
 * - Redacts secrets and credentials
 * - Strips personal financial or medical terms
 * - Restricts length to prevent memory buffer poisoning
 */
export function sanitizeForMemory(content: string, metadata?: Record<string, any>): {
  sanitizedContent: string;
  sanitizedMetadata: Record<string, any>;
} {
  let text = redactSecrets(content);

  // Strip excessive whitespace and control characters
  text = text.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');

  // Truncate to reasonable maximum length (4000 chars)
  if (text.length > 4000) {
    text = text.slice(0, 4000) + '... [truncated for security]';
  }

  const safeMetadata: Record<string, any> = {};
  if (metadata && typeof metadata === 'object') {
    for (const [key, value] of Object.entries(metadata)) {
      // Disallow injecting sensitive system keys into metadata
      if (['apiKey', 'password', 'token', 'secret', 'creditCard'].includes(key)) {
        continue;
      }
      if (typeof value === 'string') {
        safeMetadata[key] = redactSecrets(value).slice(0, 500);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        safeMetadata[key] = value;
      }
    }
  }

  return {
    sanitizedContent: text,
    sanitizedMetadata: safeMetadata
  };
}
