/**
 * Unit Tests - Currency and Integer Paise Math
 * Rule 7: Money is stored as integers (paise), never floats.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDiscount,
  calculateShippingFee,
  formatPaise,
  paiseToRupees,
  rupeesToPaise,
  validatePaise,
  FREE_SHIPPING_THRESHOLD_PAISE,
  STANDARD_SHIPPING_FEE_PAISE,
} from '../../src/utils/currency.ts';
import { Coupon } from '../../src/types/index.ts';

describe('Currency and Integer Paise Calculations', () => {
  test('validatePaise correctly identifies non-negative integers', () => {
    assert.strictEqual(validatePaise(249900), true);
    assert.strictEqual(validatePaise(0), true);
    assert.strictEqual(validatePaise(-100), false);
    assert.strictEqual(validatePaise(2499.5), false);
    assert.strictEqual(validatePaise('249900'), false);
    assert.strictEqual(validatePaise(null), false);
  });

  test('rupeesToPaise accurately converts rupees to paise integers', () => {
    assert.strictEqual(rupeesToPaise(2499), 249900);
    assert.strictEqual(rupeesToPaise(99.5), 9950);
    assert.strictEqual(rupeesToPaise(0), 0);
  });

  test('paiseToRupees converts paise integers to rupees', () => {
    assert.strictEqual(paiseToRupees(249900), 2499);
    assert.strictEqual(paiseToRupees(9950), 99.5);
    assert.throws(() => paiseToRupees(99.5), /Paise must be an integer/);
  });

  test('formatPaise formats in Indian currency format', () => {
    const formatted = formatPaise(249900);
    // Should contain rupee symbol and formatted amount
    assert.match(formatted, /₹\s*2,499/);

    const formattedLarge = formatPaise(1699900);
    assert.match(formattedLarge, /₹\s*16,999/);

    // With decimals requested
    const withDecimals = formatPaise(249950, true);
    assert.match(withDecimals, /2,499\.50/);
  });

  test('calculateDiscount handles percentage coupons accurately in integer paise', () => {
    const coupon: Coupon = {
      code: 'UTSAV10',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_paise: 100000, // ₹1,000
      description: '10% off',
      expires_at: '2028-01-01T00:00:00Z',
    };

    // Subtotal ₹2,000 (200000 paise) -> 10% = 20000 paise (₹200)
    const discount = calculateDiscount(200000, coupon);
    assert.strictEqual(discount, 20000);
    assert.strictEqual(Number.isInteger(discount), true);

    // Below minimum order value
    const belowMin = calculateDiscount(80000, coupon);
    assert.strictEqual(belowMin, 0);
  });

  test('calculateDiscount handles fixed coupons and caps at subtotal', () => {
    const coupon: Coupon = {
      code: 'FLAT500',
      discount_type: 'fixed',
      discount_value: 50000, // ₹500 (50000 paise)
      min_order_paise: 40000, // ₹400
      description: 'Flat ₹500 off',
      expires_at: '2028-01-01T00:00:00Z',
    };

    // Subtotal ₹1,500 (150000 paise) -> discount ₹500 (50000 paise)
    const discount = calculateDiscount(150000, coupon);
    assert.strictEqual(discount, 50000);

    // When discount exceeds subtotal, capped at subtotal
    const capped = calculateDiscount(45000, coupon);
    assert.strictEqual(capped, 45000);
  });

  test('calculateShippingFee charges standard fee below threshold and free above', () => {
    // Under ₹999 -> ₹99 shipping (9900 paise)
    assert.strictEqual(calculateShippingFee(50000), STANDARD_SHIPPING_FEE_PAISE);
    // At or over ₹999 -> ₹0 free shipping
    assert.strictEqual(calculateShippingFee(FREE_SHIPPING_THRESHOLD_PAISE), 0);
    assert.strictEqual(calculateShippingFee(150000), 0);
    // Zero cart
    assert.strictEqual(calculateShippingFee(0), 0);
  });
});
