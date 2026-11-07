/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { db, User } from '../db.js';
import { redactSecrets } from './redaction.js';

// Global session secret from environment or cryptographically generated per-process
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY_HOURS = 24;

export interface SessionData {
  id: string;
  token_hash: string;
  user_id: string;
  business_id: string;
  role: 'employer' | 'employee';
  expires_at: string;
  created_at: string;
}

export interface AuthenticatedUser extends User {
  business_id: string;
}

/**
 * Hash password using PBKDF2 with SHA-512 and salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

/**
 * Verify password against stored hash using constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const hashBuffer = Buffer.from(hash, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');
  if (hashBuffer.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, storedBuffer);
}

/**
 * Compute SHA-256 hash of a bearer token for database lookup
 */
function hashToken(rawToken: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(rawToken).digest('hex');
}

/**
 * Issue a new cryptographic session token for a user
 */
export function createSession(
  user: { id: string; business_id: string; role: 'employer' | 'employee' },
  metadata?: { ip?: string; userAgent?: string }
): { token: string; expiresAt: string; session: SessionData } {
  // Generate high-entropy 256-bit token
  const rawToken = `pct_${crypto.randomBytes(32).toString('base64url')}`;
  const tokenHash = hashToken(rawToken);
  const sessionId = `sess_${crypto.randomUUID().slice(0, 12)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_HOURS * 3600 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, token_hash, user_id, business_id, role, expires_at, created_at, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    tokenHash,
    user.id,
    user.business_id,
    user.role,
    expiresAt,
    now.toISOString(),
    metadata?.ip || null,
    metadata?.userAgent || null
  );

  const session: SessionData = {
    id: sessionId,
    token_hash: tokenHash,
    user_id: user.id,
    business_id: user.business_id,
    role: user.role,
    expires_at: expiresAt,
    created_at: now.toISOString()
  };

  return { token: rawToken, expiresAt, session };
}

/**
 * Validate a Bearer token and return the authenticated user
 */
export function validateSession(rawToken: string): { user: AuthenticatedUser; session: SessionData } | null {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = hashToken(rawToken);
  const now = new Date().toISOString();

  // Find active non-expired session
  const session = db.prepare(`
    SELECT * FROM sessions
    WHERE token_hash = ? AND expires_at > ?
  `).get(tokenHash, now) as SessionData | undefined;

  if (!session) return null;

  // Fetch full user record
  const user = db.prepare(`
    SELECT * FROM users
    WHERE id = ? AND business_id = ?
  `).get(session.user_id, session.business_id) as AuthenticatedUser | undefined;

  if (!user) {
    // Stale session for deleted user
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
    return null;
  }

  return { user, session };
}

/**
 * Revoke a session token (logout)
 */
export function revokeSession(rawToken: string): boolean {
  if (!rawToken) return false;
  const tokenHash = hashToken(rawToken);
  const result = db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  return result.changes > 0;
}

/**
 * Revoke all sessions for a specific user
 */
export function revokeAllUserSessions(userId: string): number {
  const result = db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  return result.changes;
}

/**
 * Authenticate user with email and password
 */
export function authenticateWithPassword(
  email: string,
  password: string,
  metadata?: { ip?: string; userAgent?: string }
): { success: boolean; token?: string; user?: AuthenticatedUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;

  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Check account lockout
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return { success: false, error: 'Account temporarily locked due to repeated failed attempts. Please try again later.' };
  }

  // Check password
  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    // Increment failed attempts
    const failed = (user.failed_attempts || 0) + 1;
    let lockUntil: string | null = null;
    if (failed >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min lock
    }
    db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?').run(failed, lockUntil, user.id);
    return { success: false, error: 'Invalid email or password' };
  }

  // Reset failed attempts on success
  db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

  const authUser: AuthenticatedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    department: user.department,
    avatar: user.avatar,
    max_hours_per_day: user.max_hours_per_day,
    created_at: user.created_at,
    business_id: user.business_id || 'biz-pactpulse-main'
  };

  const { token } = createSession(authUser, metadata);
  return { success: true, token, user: authUser };
}

/**
 * Authenticate demo user (strictly limited to seeded demo accounts)
 */
export function authenticateDemoUser(
  userId: string,
  metadata?: { ip?: string; userAgent?: string }
): { success: boolean; token?: string; user?: AuthenticatedUser; error?: string } {
  const allowedDemoIds = ['emp-sarah', 'emp-alex', 'emp-priya', 'emp-daniel', 'emp-emma'];
  if (!allowedDemoIds.includes(userId)) {
    return { success: false, error: 'Demo user not found or unauthorized' };
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return { success: false, error: 'User does not exist in database' };
  }

  const authUser: AuthenticatedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    department: user.department,
    avatar: user.avatar,
    max_hours_per_day: user.max_hours_per_day,
    created_at: user.created_at,
    business_id: user.business_id || 'biz-pactpulse-main'
  };

  const { token } = createSession(authUser, metadata);
  return { success: true, token, user: authUser };
}
