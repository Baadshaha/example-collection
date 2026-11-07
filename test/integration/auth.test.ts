/**
 * Integration Tests - User Authentication & Session Management
 * Tests registration, unique constraints, dual login (email/phone), and session binding.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { initDb, db } from '../../src/server/db.ts';
import {
  registerUser,
  authenticateUser,
  getUserById,
  attachUserToSession,
  detachUserFromSession,
  getUserBySessionId,
} from '../../src/server/auth.ts';

describe('Authentication & Session Integration Tests', () => {
  before(() => {
    initDb();
  });

  const timestamp = Date.now();
  const testEmail = `radhika.test.${timestamp}@krushna.in`;
  const testPhone = `98${String(timestamp).slice(-8)}`; // Valid unique 10-digit phone
  const testPassword = 'BespokeKatanSilk2026';

  let createdUserId = '';

  test('registerUser successfully creates a customer account in the database', () => {
    const user = registerUser({
      fullName: 'Radhika Sharma',
      email: testEmail,
      phone: testPhone,
      password: testPassword,
    });

    assert.ok(user.id.startsWith('usr_'));
    assert.strictEqual(user.fullName, 'Radhika Sharma');
    assert.strictEqual(user.email, testEmail);
    assert.strictEqual(user.phone, testPhone);
    createdUserId = user.id;

    // Verify row in SQLite
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as {
      password_hash: string;
      password_salt: string;
    };
    assert.ok(row.password_hash);
    assert.ok(row.password_salt);
  });

  test('registerUser rejects duplicate email address', () => {
    assert.throws(
      () =>
        registerUser({
          fullName: 'Another User',
          email: testEmail, // duplicate!
          phone: `99${String(Date.now()).slice(-8)}`,
          password: 'AnotherPassword123',
        }),
      /account with this email address already exists/
    );
  });

  test('registerUser rejects duplicate mobile number', () => {
    assert.throws(
      () =>
        registerUser({
          fullName: 'Another User',
          email: `new.email.${Date.now()}@example.in`,
          phone: testPhone, // duplicate phone!
          password: 'AnotherPassword123',
        }),
      /account with this mobile number already exists/
    );
  });

  test('authenticateUser logs in successfully using email', () => {
    const user = authenticateUser(testEmail, testPassword);
    assert.strictEqual(user.id, createdUserId);
    assert.strictEqual(user.fullName, 'Radhika Sharma');
  });

  test('authenticateUser logs in successfully using 10-digit mobile number', () => {
    const user = authenticateUser(testPhone, testPassword);
    assert.strictEqual(user.id, createdUserId);
    assert.strictEqual(user.fullName, 'Radhika Sharma');
  });

  test('authenticateUser fails with wrong password or non-existent user', () => {
    assert.throws(
      () => authenticateUser(testEmail, 'WrongPassword999'),
      /Invalid email\/mobile number or password/
    );

    assert.throws(
      () => authenticateUser('nonexistent@example.in', 'SomePassword123'),
      /Invalid email\/mobile number or password/
    );
  });

  test('Session binding: attachUserToSession and detachUserFromSession', () => {
    const testSessionId = `test_auth_sess_${Date.now()}`;
    const csrfToken = 'test_csrf_token_value_123';
    const expiresAt = new Date(Date.now() + 86400000).toISOString();

    // Insert test session
    db.prepare(
      'INSERT INTO sessions (session_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?)'
    ).run(testSessionId, csrfToken, new Date().toISOString(), expiresAt);

    // Initially anonymous
    assert.strictEqual(getUserBySessionId(testSessionId), null);

    // Attach user
    attachUserToSession(testSessionId, createdUserId);
    const sessionUser = getUserBySessionId(testSessionId);
    assert.ok(sessionUser);
    assert.strictEqual(sessionUser.id, createdUserId);
    assert.strictEqual(sessionUser.email, testEmail);

    // Detach user (logout)
    detachUserFromSession(testSessionId);
    assert.strictEqual(getUserBySessionId(testSessionId), null);
  });
});
