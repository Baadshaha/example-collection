/**
 * Integration Tests - Database & API Transaction Logic
 * Tests transaction rollbacks, stock atomicity, and input validation.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  initDb,
  db,
  getAllProducts,
  getProductById,
  addToCart,
  getCart,
  updateCartQuantity,
  applyCoupon,
  createOrderTransactional,
} from '../../src/server/db.ts';
import { seedDatabase } from '../../src/server/seed.ts';
import { ShippingAddress, PaymentPayload } from '../../src/types/index.ts';

describe('API & Database Integration Tests', () => {
  before(() => {
    initDb();
    seedDatabase(true);
  });

  test('getAllProducts retrieves seeded catalog with categories', () => {
    const all = getAllProducts();
    assert.ok(all.length >= 8, 'Expected at least 8 seeded products');

    const sarees = getAllProducts({ category: 'sarees' });
    assert.ok(sarees.length >= 1, 'Expected saree products');
    assert.strictEqual(sarees.every((p) => p.category === 'sarees'), true);

    const first = all[0];
    assert.ok(first.variants.length > 0, 'Product must have variants');
    assert.strictEqual(typeof first.price_paise, 'number');
    assert.strictEqual(Number.isInteger(first.price_paise), true);
  });

  test('getProductById retrieves full product with size variants and stocks', () => {
    const product = getProductById('kc-prod-001');
    assert.ok(product, 'kc-prod-001 should exist');
    assert.strictEqual(product.name, 'Royal Banarasi Katan Silk Saree in Vermilion Red');
    assert.strictEqual(product.variants[0].size, 'Free Size');
    assert.ok(product.variants[0].stock > 0);
  });

  test('Cart lifecycle with session isolation and stock checking', () => {
    const testSession = `test_sess_${Date.now()}`;
    const product = getProductById('kc-prod-002')!;
    const variant = product.variants.find((v) => v.size === 'M')!;

    // 1. Add to cart
    const cart = addToCart(testSession, product.id, variant.id, 2);
    assert.strictEqual(cart.items.length, 1);
    assert.strictEqual(cart.items[0].quantity, 2);
    assert.strictEqual(cart.subtotal_paise, product.price_paise * 2);

    // 2. Update quantity
    const updated = updateCartQuantity(testSession, cart.items[0].id, 3);
    assert.strictEqual(updated.items[0].quantity, 3);

    // 3. Exceeding stock throws error without modifying cart
    assert.throws(
      () => addToCart(testSession, product.id, variant.id, 9999),
      /available in size/
    );
  });

  test('Coupon validation and threshold enforcement', () => {
    const testSession = `test_coupon_sess_${Date.now()}`;
    const product = getProductById('kc-prod-002')!; // ₹4,499 (449900 paise)
    const variant = product.variants[0];

    addToCart(testSession, product.id, variant.id, 1);

    // UTSAV10 requires min ₹1,499 -> 449900 >= 149900 -> Valid!
    const { coupon, summary } = applyCoupon(testSession, 'UTSAV10');
    assert.strictEqual(coupon.code, 'UTSAV10');
    assert.ok(summary.discount_paise > 0);
    // 10% of 449900 = 44990 paise
    assert.strictEqual(summary.discount_paise, 44990);

    // Invalid coupon throws
    assert.throws(() => applyCoupon(testSession, 'INVALID_CODE'), /Invalid coupon code/);
  });

  test('Transaction rollback when stock becomes unavailable during checkout', () => {
    const testSession = `test_rollback_sess_${Date.now()}`;
    const product = getProductById('kc-prod-003')!;
    const variant = product.variants[0];
    const initialStock = variant.stock;

    // Add 1 to cart
    addToCart(testSession, product.id, variant.id, 1);

    // Artificially deplete stock in db to 0 right before checkout
    db.prepare('UPDATE product_variants SET stock = 0 WHERE id = ?').run(variant.id);

    const validAddress: ShippingAddress = {
      fullName: 'Aarav Sharma',
      phone: '9876543210',
      email: 'aarav@example.com',
      addressLine1: '42 Heritage Enclave, Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
    };

    const payment: PaymentPayload = {
      method: 'upi',
      upiId: 'aarav@okaxis',
    };

    // Attempting checkout should fail cleanly with Insufficient stock error
    assert.throws(
      () => createOrderTransactional(testSession, validAddress, payment),
      /Insufficient stock/
    );

    // Cart should remain intact due to rollback
    const currentCart = getCart(testSession);
    assert.strictEqual(currentCart.items.length, 1);

    // Restore stock
    db.prepare('UPDATE product_variants SET stock = ? WHERE id = ?').run(
      initialStock,
      variant.id
    );
  });

  test('Validation rejects invalid Indian mobile number and PIN code', () => {
    const testSession = `test_val_sess_${Date.now()}`;
    const product = getProductById('kc-prod-001')!;
    addToCart(testSession, product.id, product.variants[0].id, 1);

    // Invalid 8-digit phone
    const badPhoneAddress: ShippingAddress = {
      fullName: 'Meera Patel',
      phone: '98765432', // Only 8 digits!
      email: 'meera@example.com',
      addressLine1: '12 MG Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
    };

    assert.throws(
      () =>
        createOrderTransactional(testSession, badPhoneAddress, {
          method: 'upi',
          upiId: 'meera@upi',
        }),
      /10-digit Indian mobile number/
    );

    // Invalid 5-digit PIN code
    const badPincodeAddress: ShippingAddress = {
      fullName: 'Meera Patel',
      phone: '9876543210',
      email: 'meera@example.com',
      addressLine1: '12 MG Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '38000', // Only 5 digits!
    };

    assert.throws(
      () =>
        createOrderTransactional(testSession, badPincodeAddress, {
          method: 'upi',
          upiId: 'meera@upi',
        }),
      /6-digit Indian postal code/
    );
  });
});
