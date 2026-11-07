/**
 * Krushna Collection - Authentication & Security Module
 * Secure password hashing with salt and constant-time comparison.
 * Zero external libraries needed (uses Node.js crypto).
 */

import crypto from 'node:crypto';
import { db, runTransaction } from './db.ts';
import { User } from '../types/index.ts';

/**
 * Hash a password using scrypt with a unique random salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verify a candidate password against stored hash and salt
 */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const candidateKey = crypto.scryptSync(password, storedSalt, 64);
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (candidateKey.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidateKey, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Validate user registration input
 */
export function validateRegistrationInput(data: {
  fullName: unknown;
  email: unknown;
  phone: unknown;
  password: unknown;
}): { fullName: string; email: string; phone: string; password: string } {
  if (typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
    throw new Error('Full Name must be at least 2 characters');
  }

  if (typeof data.email !== 'string') {
    throw new Error('Please enter a valid email address');
  }
  const email = data.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }

  if (typeof data.phone !== 'string') {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }
  let cleanPhone = data.phone.replace(/\D/g, '');
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    cleanPhone = cleanPhone.slice(2);
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.slice(1);
  }

  if (cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }

  if (typeof data.password !== 'string' || data.password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  return {
    fullName: data.fullName.trim(),
    email,
    phone: cleanPhone,
    password: data.password,
  };
}

/**
 * Register a new customer
 */
export function registerUser(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): User {
  const validated = validateRegistrationInput(input);

  // Check unique email
  const existingEmail = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(validated.email) as { id: string } | undefined;
  if (existingEmail) {
    throw new Error('An account with this email address already exists');
  }

  // Check unique phone
  const existingPhone = db
    .prepare('SELECT id FROM users WHERE phone = ?')
    .get(validated.phone) as { id: string } | undefined;
  if (existingPhone) {
    throw new Error('An account with this mobile number already exists');
  }

  const { hash, salt } = hashPassword(validated.password);
  const userId = `usr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, full_name, email, phone, password_hash, password_salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, validated.fullName, validated.email, validated.phone, hash, salt, now);

  return {
    id: userId,
    fullName: validated.fullName,
    email: validated.email,
    phone: validated.phone,
    createdAt: now,
  };
}

/**
 * Authenticate customer by email or phone
 */
export function authenticateUser(identifier: string, password: string): User {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Please enter your email or 10-digit mobile number');
  }
  if (!password || typeof password !== 'string') {
    throw new Error('Please enter your password');
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, '');

  let row: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    password_hash: string;
    password_salt: string;
    created_at: string;
  } | undefined;

  if (cleanPhone.length === 10) {
    row = db
      .prepare('SELECT * FROM users WHERE phone = ? OR email = ?')
      .get(cleanPhone, cleanIdentifier) as typeof row;
  } else {
    row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(cleanIdentifier) as typeof row;
  }

  if (!row) {
    throw new Error('Invalid email/mobile number or password');
  }

  const isValid = verifyPassword(password, row.password_hash, row.password_salt);
  if (!isValid) {
    throw new Error('Invalid email/mobile number or password');
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

/**
 * Get safe user details by ID
 */
export function getUserById(userId: string): User | null {
  const row = db
    .prepare('SELECT id, full_name, email, phone, created_at FROM users WHERE id = ?')
    .get(userId) as {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

/**
 * Attach user to current session
 */
export function attachUserToSession(sessionId: string, userId: string): void {
  db.prepare('UPDATE sessions SET user_id = ? WHERE session_id = ?').run(userId, sessionId);
}

/**
 * Detach user from session on logout
 */
export function detachUserFromSession(sessionId: string): void {
  db.prepare('UPDATE sessions SET user_id = NULL WHERE session_id = ?').run(sessionId);
}

/**
 * Get user for current session
 */
export function getUserBySessionId(sessionId: string): User | null {
  const sessionRow = db
    .prepare('SELECT user_id FROM sessions WHERE session_id = ?')
    .get(sessionId) as { user_id: string | null } | undefined;

  if (!sessionRow || !sessionRow.user_id) {
    return null;
  }

  return getUserById(sessionRow.user_id);
}
