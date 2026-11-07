/**
 * End-to-End User Flow Test: User Registration, Login, Session Persistence, and Order Linking
 * Rule 4: One end-to-end test per user flow
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  initDb,
  db,
  getProductById,
  addToCart,
  createOrderTransactional,
  getOrdersBySession,
} from '../../src/server/db.ts';
import { seedDatabase } from '../../src/server/seed.ts';
import {
  registerUser,
  authenticateUser,
  attachUserToSession,
  detachUserFromSession,
  getUserBySessionId,
} from '../../src/server/auth.ts';
import { ShippingAddress, PaymentPayload } from '../../src/types/index.ts';

describe('End-to-End User Flow: User Registration, Authentication & Persistent Orders', () => {
  before(() => {
    initDb();
    seedDatabase();
  });

  const timestamp = Date.now();
  const email = `ananya.${timestamp}@krushna.in`;
  const phone = `97${String(timestamp).slice(-8)}`;
  const password = 'StrongIndianAuth2026';

  let sessionId1 = `sess_device1_${timestamp}`;
  let sessionId2 = `sess_device2_${timestamp}`;
  let registeredUserId = '';

  test('Complete user authentication flow from sign up to persistent orders across sessions', () => {
    // 1. Initialize Device 1 Session
    db.prepare('INSERT INTO sessions (session_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .run(sessionId1, 'csrf_1', new Date().toISOString(), new Date(Date.now() + 86400000).toISOString());

    // 2. User Signs Up on Device 1
    const newUser = registerUser({
      fullName: 'Ananya Iyer',
      email,
      phone,
      password,
    });
    registeredUserId = newUser.id;
    attachUserToSession(sessionId1, newUser.id);

    // Verify session knows the user
    const loggedInUser = getUserBySessionId(sessionId1);
    assert.ok(loggedInUser);
    assert.strictEqual(loggedInUser.fullName, 'Ananya Iyer');

    // 3. User adds product to cart and places an order
    const saree = getProductById('kc-prod-001')!;
    addToCart(sessionId1, saree.id, saree.variants[0].id, 1);

    const shippingAddress: ShippingAddress = {
      fullName: 'Ananya Iyer',
      phone,
      email,
      addressLine1: 'B-701, Temple Bells, Malleshwaram',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560003',
    };

    const payment: PaymentPayload = {
      method: 'upi',
      upiId: 'ananya@okhdfcbank',
    };

    const order = createOrderTransactional(sessionId1, shippingAddress, payment, newUser.id);
    assert.ok(order.id.startsWith('KC-'));
    assert.strictEqual(order.user_id, newUser.id);

    // 4. User logs out on Device 1
    detachUserFromSession(sessionId1);
    assert.strictEqual(getUserBySessionId(sessionId1), null);

    // 5. User visits on a different device / session (Device 2)
    db.prepare('INSERT INTO sessions (session_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .run(sessionId2, 'csrf_2', new Date().toISOString(), new Date(Date.now() + 86400000).toISOString());

    // Initially anonymous on Device 2
    assert.strictEqual(getUserBySessionId(sessionId2), null);

    // 6. User logs in on Device 2 using their 10-digit mobile number and password
    const authenticated = authenticateUser(phone, password);
    assert.strictEqual(authenticated.id, registeredUserId);
    attachUserToSession(sessionId2, authenticated.id);

    // Verify authenticated on Device 2
    const session2User = getUserBySessionId(sessionId2);
    assert.ok(session2User);
    assert.strictEqual(session2User.email, email);

    // 7. User views orders on Device 2 -> Their past order placed on Device 1 is present!
    const ordersOnDevice2 = getOrdersBySession(sessionId2, authenticated.id);
    assert.strictEqual(ordersOnDevice2.length, 1);
    assert.strictEqual(ordersOnDevice2[0].id, order.id);
    assert.strictEqual(ordersOnDevice2[0].shipping_address.city, 'Bengaluru');
  });
});
