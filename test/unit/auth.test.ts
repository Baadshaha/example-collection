/**
 * Unit Tests - Authentication and Security Logic
 * Tests password hashing with salt, constant-time verification, and input validation.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  validateRegistrationInput,
} from '../../src/server/auth.ts';

describe('Authentication Unit Tests', () => {
  test('hashPassword produces unique random salts and secure scrypt hashes', () => {
    const pw = 'RoyalSilkPass2026';
    const hash1 = hashPassword(pw);
    const hash2 = hashPassword(pw);

    assert.ok(hash1.salt.length >= 32);
    assert.ok(hash1.hash.length >= 64);
    assert.notStrictEqual(hash1.salt, hash2.salt, 'Each hash must have a unique random salt');
    assert.notStrictEqual(hash1.hash, hash2.hash, 'Hashes must differ due to unique salts');
  });

  test('verifyPassword correctly validates matching passwords and rejects invalid ones', () => {
    const pw = 'ChikankariFestive99';
    const { hash, salt } = hashPassword(pw);

    assert.strictEqual(verifyPassword(pw, hash, salt), true);
    assert.strictEqual(verifyPassword('WrongPassword', hash, salt), false);
    assert.strictEqual(verifyPassword('', hash, salt), false);
    assert.strictEqual(verifyPassword(pw, hash, 'bad_salt'), false);
  });

  test('validateRegistrationInput rejects invalid Indian mobile numbers', () => {
    assert.throws(
      () =>
        validateRegistrationInput({
          fullName: 'Pooja',
          email: 'pooja@example.in',
          phone: '987654321', // 9 digits
          password: 'Password123',
        }),
      /10-digit Indian mobile number/
    );

    assert.throws(
      () =>
        validateRegistrationInput({
          fullName: 'Pooja',
          email: 'pooja@example.in',
          phone: '987654321000', // 12 digits
          password: 'Password123',
        }),
      /10-digit Indian mobile number/
    );
  });

  test('validateRegistrationInput rejects invalid emails and short passwords', () => {
    assert.throws(
      () =>
        validateRegistrationInput({
          fullName: 'Pooja',
          email: 'not-an-email',
          phone: '9876543210',
          password: 'Password123',
        }),
      /valid email address/
    );

    assert.throws(
      () =>
        validateRegistrationInput({
          fullName: 'Pooja',
          email: 'pooja@example.in',
          phone: '9876543210',
          password: 'short', // only 5 characters
        }),
      /at least 8 characters/
    );
  });

  test('validateRegistrationInput normalizes email and formats phone cleanly', () => {
    const validated = validateRegistrationInput({
      fullName: '  Pooja Deshmukh  ',
      email: '  Pooja.Deshmukh@EXAMPLE.IN  ',
      phone: '+91 (982) 012-3456',
      password: 'StrongSecretPassword99',
    });

    assert.strictEqual(validated.fullName, 'Pooja Deshmukh');
    assert.strictEqual(validated.email, 'pooja.deshmukh@example.in');
    assert.strictEqual(validated.phone, '9820123456');
    assert.strictEqual(validated.password, 'StrongSecretPassword99');
  });
});
