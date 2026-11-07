/**
 * Currency utilities for Krushna Collection.
 * Rule 7: Money is stored as integers (paise), never floats.
 * 1 Indian Rupee (INR) = 100 paise.
 */

import { Coupon, MoneyInPaise } from '../types/index.ts';

/**
 * Validates that an amount is a valid integer paise value.
 */
export function validatePaise(paise: unknown): paise is MoneyInPaise {
  return typeof paise === 'number' && Number.isInteger(paise) && paise >= 0;
}

/**
 * Converts whole rupees or rupee with fraction to paise integer safely.
 */
export function rupeesToPaise(rupees: number): MoneyInPaise {
  if (typeof rupees !== 'number' || isNaN(rupees)) {
    throw new Error('Invalid rupee amount');
  }
  return Math.round(rupees * 100);
}

/**
 * Converts paise to a numeric rupee value (for display or non-financial UI ranges).
 */
export function paiseToRupees(paise: MoneyInPaise): number {
  if (!Number.isInteger(paise)) {
    throw new Error(`Paise must be an integer, received: ${paise}`);
  }
  return paise / 100;
}

/**
 * Formats a paise amount into the standard Indian numbering system (e.g., ₹2,49,999 or ₹2,499).
 */
export function formatPaise(paise: MoneyInPaise, includeDecimals = false): string {
  if (!Number.isInteger(paise)) {
    return '₹0';
  }
  const rupees = paise / 100;
  
  if (includeDecimals) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  }

  // If amount has no fractional rupees, omit .00 for a cleaner boutique look
  const hasFractions = paise % 100 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasFractions ? 2 : 0,
    maximumFractionDigits: hasFractions ? 2 : 0,
  }).format(rupees);
}

/**
 * Calculates discount in integer paise based on coupon rules.
 * Strictly returns an integer.
 */
export function calculateDiscount(
  subtotal_paise: MoneyInPaise,
  coupon: Coupon | null | undefined
): MoneyInPaise {
  if (!coupon || !Number.isInteger(subtotal_paise) || subtotal_paise <= 0) {
    return 0;
  }

  if (subtotal_paise < coupon.min_order_paise) {
    return 0;
  }

  let discountPaise = 0;
  if (coupon.discount_type === 'percentage') {
    // Integer arithmetic: (subtotal * percentage) / 100
    discountPaise = Math.round((subtotal_paise * coupon.discount_value) / 100);
  } else if (coupon.discount_type === 'fixed') {
    discountPaise = coupon.discount_value;
  }

  // Discount cannot exceed subtotal
  return Math.min(Math.max(0, Math.round(discountPaise)), subtotal_paise);
}

/**
 * Default free shipping threshold: ₹999.00 (99900 paise).
 * Standard shipping fee: ₹99.00 (9900 paise).
 */
export const FREE_SHIPPING_THRESHOLD_PAISE: MoneyInPaise = 99900; // ₹999
export const STANDARD_SHIPPING_FEE_PAISE: MoneyInPaise = 9900; // ₹99

export function calculateShippingFee(subtotal_paise: MoneyInPaise): MoneyInPaise {
  if (subtotal_paise <= 0 || subtotal_paise >= FREE_SHIPPING_THRESHOLD_PAISE) {
    return 0;
  }
  return STANDARD_SHIPPING_FEE_PAISE;
}
