/**
 * End-to-End User Flow Test: Complete Indian Clothing Checkout
 * Tests the entire user flow: Catalog -> Cart -> Promo -> Transactional Checkout -> Order History
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  initDb,
  db,
  getProductById,
  addToCart,
  applyCoupon,
  getCart,
  createOrderTransactional,
  getOrderById,
  getOrdersBySession,
} from '../../src/server/db.ts';
import { seedDatabase } from '../../src/server/seed.ts';
import { ShippingAddress, PaymentPayload } from '../../src/types/index.ts';

describe('End-to-End User Flow: Example Collection Complete Purchase', () => {
  const customerSession = `cust_e2e_${Date.now()}`;

  before(() => {
    initDb();
    seedDatabase(true);
  });

  test('Complete purchase flow from product selection to stock decrement and receipt', () => {
    // 1. Select Saree (kc-prod-001)
    const saree = getProductById('kc-prod-001');
    assert.ok(saree, 'Saree product must exist');
    const sareeVariant = saree.variants[0];
    const initialSareeStock = sareeVariant.stock;
    assert.ok(initialSareeStock >= 1, 'Saree must be in stock');

    // 2. Select Men\'s Kurta (kc-prod-004)
    const kurta = getProductById('kc-prod-004');
    assert.ok(kurta, 'Kurta product must exist');
    const kurtaVariant = kurta.variants.find((v) => v.size === 'L') || kurta.variants[0];
    const initialKurtaStock = kurtaVariant.stock;
    assert.ok(initialKurtaStock >= 1, 'Kurta must be in stock');

    // 3. Add both items to cart
    addToCart(customerSession, saree.id, sareeVariant.id, 1);
    addToCart(customerSession, kurta.id, kurtaVariant.id, 1);

    const cartAfterAdd = getCart(customerSession);
    assert.strictEqual(cartAfterAdd.items.length, 2);
    const expectedSubtotal = saree.price_paise + kurta.price_paise;
    assert.strictEqual(cartAfterAdd.subtotal_paise, expectedSubtotal);

    // 4. Apply Festive Coupon (UTSAV10 = 10% off)
    const { summary: cartWithCoupon } = applyCoupon(customerSession, 'UTSAV10');
    assert.strictEqual(cartWithCoupon.coupon_code, 'UTSAV10');
    const expectedDiscount = Math.round((expectedSubtotal * 10) / 100);
    assert.strictEqual(cartWithCoupon.discount_paise, expectedDiscount);

    // Subtotal > ₹999 -> Free shipping!
    assert.strictEqual(cartWithCoupon.shipping_paise, 0);
    const expectedTotal = expectedSubtotal - expectedDiscount;
    assert.strictEqual(cartWithCoupon.total_paise, expectedTotal);

    // 5. Fill valid Indian shipping address and select UPI payment
    const shippingAddress: ShippingAddress = {
      fullName: 'Pooja Deshmukh',
      phone: '9820123456',
      email: 'pooja.deshmukh@example.in',
      addressLine1: 'Flat 402, Shivam Heights, Shivaji Park',
      addressLine2: 'Near Sena Bhavan, Dadar West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400028',
    };

    const payment: PaymentPayload = {
      method: 'upi',
      upiId: 'poojadeshmukh@okaxis',
    };

    // 6. Execute Transactional Order Creation
    const order = createOrderTransactional(customerSession, shippingAddress, payment);

    assert.ok(order.id.startsWith('KC-'), 'Order ID should start with KC-');
    assert.strictEqual(order.session_id, customerSession);
    assert.strictEqual(order.total_paise, expectedTotal);
    assert.strictEqual(order.payment_method, 'upi');
    assert.strictEqual(order.payment_status, 'paid');
    assert.strictEqual(order.order_status, 'confirmed');
    assert.strictEqual(order.items.length, 2);

    // 7. Cart should now be completely cleared
    const cartPostCheckout = getCart(customerSession);
    assert.strictEqual(cartPostCheckout.items.length, 0);
    assert.strictEqual(cartPostCheckout.subtotal_paise, 0);

    // 8. Order should be retrievable from order history
    const retrievedOrder = getOrderById(order.id);
    assert.ok(retrievedOrder);
    assert.strictEqual(retrievedOrder.id, order.id);
    assert.strictEqual(retrievedOrder.shipping_address.pincode, '400028');

    const customerOrders = getOrdersBySession(customerSession);
    assert.strictEqual(customerOrders.length, 1);
    assert.strictEqual(customerOrders[0].id, order.id);

    // 9. Stock should be accurately decremented in database
    const updatedSareeRow = db
      .prepare('SELECT stock FROM product_variants WHERE id = ?')
      .get(sareeVariant.id) as { stock: number };
    assert.strictEqual(updatedSareeRow.stock, initialSareeStock - 1);

    const updatedKurtaRow = db
      .prepare('SELECT stock FROM product_variants WHERE id = ?')
      .get(kurtaVariant.id) as { stock: number };
    assert.strictEqual(updatedKurtaRow.stock, initialKurtaStock - 1);
  });
});
