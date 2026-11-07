/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { validateSession, AuthenticatedUser, SessionData } from './auth.js';
import { redactSecrets } from './redaction.js';
import { db } from '../db.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: SessionData;
      requestId?: string;
    }
  }
}

/**
 * Security Headers Middleware (Helmet-style)
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Clickjacking defense
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Legacy XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}

/**
 * Sliding Window In-Memory Rate Limiter
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Too many requests. Please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client identifier: IP + optional auth user
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const clientKey = `${req.baseUrl || ''}${req.path}:${clientIp}`;
    const now = Date.now();

    let record = rateLimitStore.get(clientKey);
    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(clientKey, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000)
      });
    }

    next();
  };
}

/**
 * Require Authentication Middleware
 * Extracts and validates Bearer token from Authorization header
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Missing or malformed Authorization header.'
    });
  }

  const token = authHeader.slice(7).trim();
  const sessionResult = validateSession(token);

  if (!sessionResult) {
    return res.status(401).json({
      error: 'Invalid or expired session token. Please log in again.'
    });
  }

  req.user = sessionResult.user;
  req.session = sessionResult.session;

  next();
}

/**
 * Require Role Middleware (RBAC)
 */
export function requireRole(allowedRoles: ('employer' | 'employee')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log access violation in security audit log
      try {
        db.prepare(`
          INSERT INTO security_audit_logs (
            id, timestamp, event_type, user_id, business_id, role, ip, endpoint, status, details
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          new Date().toISOString(),
          'AUTHZ_VIOLATION',
          req.user.id,
          req.user.business_id,
          req.user.role,
          req.ip || 'unknown',
          `${req.method} ${req.originalUrl}`,
          'DENIED',
          `User role "${req.user.role}" attempted restricted action requiring [${allowedRoles.join(', ')}]`
        );
      } catch (err) {
        // Ignore audit log failure
      }

      return res.status(403).json({
        error: `Access denied. This action requires ${allowedRoles.join(' or ')} privileges.`
      });
    }

    next();
  };
}

/**
 * Safe Error Handler Middleware:
 * - Redacts secrets and credentials
 * - Never returns stack traces to clients
 * - Returns structured error with unique Request ID
 */
export function safeErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const statusCode = err.status || err.statusCode || 500;

  // Safe server logging with secret redaction
  const safeMessage = redactSecrets(err.message || 'Unknown error');
  console.error(`[Security Error][${requestId}] ${req.method} ${req.originalUrl}:`, safeMessage);

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    error: statusCode >= 500
      ? 'An unexpected error occurred. Please contact system administrator.'
      : safeMessage,
    requestId,
    timestamp: new Date().toISOString()
  });
}
