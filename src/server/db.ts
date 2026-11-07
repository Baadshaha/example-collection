/**
 * Krushna Collection - SQLite Database & Transaction Layer
 * Powered by Node.js built-in DatabaseSync with ACID transaction guarantees.
 */

import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  CartItem,
  CartSummary,
  ClothingSize,
  Coupon,
  MoneyInPaise,
  Order,
  OrderItem,
  PaymentPayload,
  Product,
  ProductVariant,
  ShippingAddress,
} from '../types/index.ts';
import { calculateDiscount, calculateShippingFee } from '../utils/currency.ts';

// Ensure data directory exists
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel ? '/tmp' : path.resolve(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'krushna_collection.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize database schema
 */
export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      fabric TEXT NOT NULL,
      craft TEXT NOT NULL,
      occasion TEXT NOT NULL,
      color TEXT NOT NULL,
      price_paise INTEGER NOT NULL,
      mrp_paise INTEGER NOT NULL,
      images_json TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 4.8,
      review_count INTEGER NOT NULL DEFAULT 12,
      featured INTEGER NOT NULL DEFAULT 0,
      is_new INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      size TEXT NOT NULL,
      stock INTEGER NOT NULL CHECK(stock >= 0),
      sku TEXT NOT NULL UNIQUE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_order_paise INTEGER NOT NULL,
      description TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      csrf_token TEXT NOT NULL,
      user_id TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(variant_id) REFERENCES product_variants(id)
    );

    CREATE TABLE IF NOT EXISTS session_coupons (
      session_id TEXT PRIMARY KEY,
      coupon_code TEXT NOT NULL,
      FOREIGN KEY(coupon_code) REFERENCES coupons(code)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT,
      subtotal_paise INTEGER NOT NULL,
      discount_paise INTEGER NOT NULL,
      shipping_paise INTEGER NOT NULL,
      total_paise INTEGER NOT NULL,
      coupon_code TEXT,
      shipping_address_json TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      order_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      size TEXT NOT NULL,
      image TEXT NOT NULL,
      unit_price_paise INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal_paise INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
  `);

  // Ensure user_id columns exist on pre-existing tables
  try {
    db.exec('ALTER TABLE sessions ADD COLUMN user_id TEXT;');
  } catch {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE orders ADD COLUMN user_id TEXT;');
  } catch {
    // Column already exists
  }
}

/**
 * Execute work inside an ACID database transaction.
 * Uses BEGIN IMMEDIATE for write serialization and rolls back cleanly on any failure.
 */
export function runTransaction<T>(operation: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = operation();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // Ignore rollback failure if already rolled back
    }
    throw error;
  }
}

/**
 * Products querying with filtering and sorting
 */
export function getAllProducts(filters?: {
  category?: string;
  search?: string;
  sort?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
}): Product[] {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters?.category && filters.category !== 'all') {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.search && filters.search.trim()) {
    query += ' AND (name LIKE ? OR description LIKE ? OR craft LIKE ? OR fabric LIKE ?)';
    const term = `%${filters.search.trim()}%`;
    params.push(term, term, term, term);
  }

  if (typeof filters?.minPricePaise === 'number' && filters.minPricePaise >= 0) {
    query += ' AND price_paise >= ?';
    params.push(filters.minPricePaise);
  }

  if (typeof filters?.maxPricePaise === 'number' && filters.maxPricePaise > 0) {
    query += ' AND price_paise <= ?';
    params.push(filters.maxPricePaise);
  }

  // Sorting
  switch (filters?.sort) {
    case 'price_asc':
      query += ' ORDER BY price_paise ASC';
      break;
    case 'price_desc':
      query += ' ORDER BY price_paise DESC';
      break;
    case 'rating':
      query += ' ORDER BY rating DESC, review_count DESC';
      break;
    case 'newest':
      query += ' ORDER BY is_new DESC, rowid DESC';
      break;
    default:
      query += ' ORDER BY featured DESC, rating DESC';
      break;
  }

  const rows = db.prepare(query).all(...params) as Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    fabric: string;
    craft: string;
    occasion: string;
    color: string;
    price_paise: number;
    mrp_paise: number;
    images_json: string;
    rating: number;
    review_count: number;
    featured: number;
    is_new: number;
  }>;

  const variantStmt = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY rowid ASC');

  return rows.map((row) => {
    const variants = variantStmt.all(row.id) as Array<{
      id: string;
      product_id: string;
      size: ClothingSize;
      stock: number;
      sku: string;
    }>;

    return {
      id: row.id,
      name: row.name,
      category: row.category as Product['category'],
      description: row.description,
      fabric: row.fabric,
      craft: row.craft,
      occasion: row.occasion,
      color: row.color,
      price_paise: row.price_paise,
      mrp_paise: row.mrp_paise,
      images: JSON.parse(row.images_json),
      rating: row.rating,
      review_count: row.review_count,
      featured: Boolean(row.featured),
      is_new: Boolean(row.is_new),
      variants,
    };
  });
}

/**
 * Retrieve single product by ID
 */
export function getProductById(id: string): Product | null {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as {
    id: string;
    name: string;
    category: string;
    description: string;
    fabric: string;
    craft: string;
    occasion: string;
    color: string;
    price_paise: number;
    mrp_paise: number;
    images_json: string;
    rating: number;
    review_count: number;
    featured: number;
    is_new: number;
  } | undefined;

  if (!row) return null;

  const variants = db
    .prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY rowid ASC')
    .all(row.id) as Array<{
    id: string;
    product_id: string;
    size: ClothingSize;
    stock: number;
    sku: string;
  }>;

  return {
    id: row.id,
    name: row.name,
    category: row.category as Product['category'],
    description: row.description,
    fabric: row.fabric,
    craft: row.craft,
    occasion: row.occasion,
    color: row.color,
    price_paise: row.price_paise,
    mrp_paise: row.mrp_paise,
    images: JSON.parse(row.images_json),
    rating: row.rating,
    review_count: row.review_count,
    featured: Boolean(row.featured),
    is_new: Boolean(row.is_new),
    variants,
  };
}

/**
 * Cart Management with Session Storage and Variant Stock checking
 */
export function getCart(sessionId: string): CartSummary {
  const query = `
    SELECT 
      c.id, c.session_id, c.product_id, c.variant_id, c.quantity,
      p.name, p.price_paise, p.images_json,
      v.size, v.stock
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    JOIN product_variants v ON c.variant_id = v.id
    WHERE c.session_id = ?
    ORDER BY c.created_at DESC
  `;

  const rows = db.prepare(query).all(sessionId) as Array<{
    id: string;
    session_id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
    name: string;
    price_paise: number;
    images_json: string;
    size: ClothingSize;
    stock: number;
  }>;

  const items: CartItem[] = rows.map((r) => {
    const images: string[] = JSON.parse(r.images_json);
    return {
      id: r.id,
      session_id: r.session_id,
      product_id: r.product_id,
      variant_id: r.variant_id,
      name: r.name,
      size: r.size,
      image: images[0] || '',
      price_paise: r.price_paise,
      quantity: r.quantity,
      stock: r.stock,
    };
  });

  // Calculate totals strictly in integer paise
  let subtotal_paise: MoneyInPaise = 0;
  let itemCount = 0;
  for (const item of items) {
    subtotal_paise += item.price_paise * item.quantity;
    itemCount += item.quantity;
  }

  // Check coupon applied to session
  const couponRow = db
    .prepare(
      `SELECT c.* FROM coupons c 
       JOIN session_coupons sc ON c.code = sc.coupon_code 
       WHERE sc.session_id = ?`
    )
    .get(sessionId) as Coupon | undefined;

  let discount_paise: MoneyInPaise = 0;
  let coupon_code: string | null = null;
  let coupon_discount_text: string | undefined = undefined;

  if (couponRow) {
    coupon_code = couponRow.code;
    discount_paise = calculateDiscount(subtotal_paise, couponRow);
    coupon_discount_text =
      couponRow.discount_type === 'percentage'
        ? `${couponRow.discount_value}% OFF`
        : `Flat ₹${couponRow.discount_value / 100} OFF`;
  }

  const shipping_paise = calculateShippingFee(subtotal_paise);
  const total_paise = Math.max(0, subtotal_paise - discount_paise + shipping_paise);

  return {
    items,
    item_count: itemCount,
    subtotal_paise,
    discount_paise,
    shipping_paise,
    total_paise,
    coupon_code,
    coupon_discount_text,
    free_shipping_threshold_paise: 99900,
    free_shipping_qualified: subtotal_paise >= 99900,
  };
}

/**
 * Add product to cart with strict stock and parameter validation
 */
export function addToCart(
  sessionId: string,
  productId: string,
  variantId: string,
  quantity = 1
): CartSummary {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  return runTransaction(() => {
    // Verify product and variant exist
    const variant = db
      .prepare(
        `SELECT v.id, v.stock, v.size, p.name 
         FROM product_variants v 
         JOIN products p ON v.product_id = p.id 
         WHERE v.id = ? AND v.product_id = ?`
      )
      .get(variantId, productId) as { id: string; stock: number; size: string; name: string } | undefined;

    if (!variant) {
      throw new Error('Selected product variant was not found');
    }

    // Check existing quantity in cart
    const existing = db
      .prepare('SELECT id, quantity FROM cart_items WHERE session_id = ? AND variant_id = ?')
      .get(sessionId, variantId) as { id: string; quantity: number } | undefined;

    const currentInCart = existing ? existing.quantity : 0;
    const requestedTotal = currentInCart + quantity;

    if (requestedTotal > variant.stock) {
      throw new Error(
        `Only ${variant.stock} item(s) available in size ${variant.size} for ${variant.name}`
      );
    }

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(
        quantity,
        existing.id
      );
    } else {
      const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      db.prepare(
        `INSERT INTO cart_items (id, session_id, product_id, variant_id, quantity, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(cartItemId, sessionId, productId, variantId, quantity, new Date().toISOString());
    }

    return getCart(sessionId);
  });
}

/**
 * Update cart item quantity with stock boundary check
 */
export function updateCartQuantity(
  sessionId: string,
  cartItemId: string,
  quantity: number
): CartSummary {
  return runTransaction(() => {
    const item = db
      .prepare(
        `SELECT c.id, c.variant_id, v.stock, v.size, p.name 
         FROM cart_items c 
         JOIN product_variants v ON c.variant_id = v.id 
         JOIN products p ON c.product_id = p.id 
         WHERE c.id = ? AND c.session_id = ?`
      )
      .get(cartItemId, sessionId) as
      | { id: string; variant_id: string; stock: number; size: string; name: string }
      | undefined;

    if (!item) {
      throw new Error('Item not found in your cart');
    }

    if (quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartItemId);
    } else {
      if (quantity > item.stock) {
        throw new Error(
          `Cannot increase quantity. Only ${item.stock} in stock for ${item.name} (${item.size})`
        );
      }
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, cartItemId);
    }

    return getCart(sessionId);
  });
}

/**
 * Remove item from cart
 */
export function removeCartItem(sessionId: string, cartItemId: string): CartSummary {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND session_id = ?').run(cartItemId, sessionId);
  return getCart(sessionId);
}

/**
 * Clear all cart items
 */
export function clearCart(sessionId: string): void {
  db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
}

/**
 * Apply coupon code
 */
export function applyCoupon(sessionId: string, rawCode: string): { coupon: Coupon; summary: CartSummary } {
  const code = rawCode.trim().toUpperCase();
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code) as Coupon | undefined;

  if (!coupon) {
    throw new Error('Invalid coupon code');
  }

  const now = new Date().toISOString();
  if (coupon.expires_at < now) {
    throw new Error('This coupon code has expired');
  }

  const cart = getCart(sessionId);
  if (cart.subtotal_paise < coupon.min_order_paise) {
    const minRupees = coupon.min_order_paise / 100;
    throw new Error(`This coupon requires a minimum cart subtotal of ₹${minRupees}`);
  }

  db.prepare(
    `INSERT INTO session_coupons (session_id, coupon_code)
     VALUES (?, ?)
     ON CONFLICT(session_id) DO UPDATE SET coupon_code = excluded.coupon_code`
  ).run(sessionId, code);

  return {
    coupon,
    summary: getCart(sessionId),
  };
}

/**
 * Remove coupon code
 */
export function removeCoupon(sessionId: string): CartSummary {
  db.prepare('DELETE FROM session_coupons WHERE session_id = ?').run(sessionId);
  return getCart(sessionId);
}

/**
 * Checkout and order creation transaction.
 * Rule 8: Use database transactions wherever stock, orders, or payments change.
 * Rule 6: Never store card numbers or CVV.
 * Atomically checks stock, decrements inventory, creates order and order_items, clears cart.
 */
export function createOrderTransactional(
  sessionId: string,
  shippingAddress: ShippingAddress,
  paymentPayload: PaymentPayload,
  userId?: string | null
): Order {
  // Validate shipping address
  if (!shippingAddress.fullName || shippingAddress.fullName.trim().length < 2) {
    throw new Error('Full Name must be at least 2 characters');
  }
  const cleanPhone = shippingAddress.phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(shippingAddress.email)) {
    throw new Error('Please enter a valid email address');
  }
  if (!shippingAddress.addressLine1 || shippingAddress.addressLine1.trim().length < 5) {
    throw new Error('Address line 1 must be at least 5 characters');
  }
  if (!shippingAddress.city || shippingAddress.city.trim().length < 2) {
    throw new Error('City is required');
  }
  if (!shippingAddress.state || shippingAddress.state.trim().length < 2) {
    throw new Error('State is required');
  }
  const cleanPincode = shippingAddress.pincode.replace(/\D/g, '');
  if (cleanPincode.length !== 6) {
    throw new Error('PIN code must be a valid 6-digit Indian postal code');
  }

  // Payment validation - Never accept raw card number or CVV
  if (!['upi', 'netbanking', 'cod', 'card_token'].includes(paymentPayload.method)) {
    throw new Error('Invalid payment method selected');
  }

  if (paymentPayload.method === 'upi') {
    if (!paymentPayload.upiId || !paymentPayload.upiId.includes('@')) {
      throw new Error('Please enter a valid UPI ID (e.g., username@okhdfcbank or mobile@upi)');
    }
  }

  return runTransaction(() => {
    // 1. Fetch current cart
    const cart = getCart(sessionId);
    if (cart.items.length === 0) {
      throw new Error('Your shopping cart is empty');
    }

    // 2. Determine user_id if not passed directly
    let effectiveUserId = userId;
    if (effectiveUserId === undefined) {
      const sess = db
        .prepare('SELECT user_id FROM sessions WHERE session_id = ?')
        .get(sessionId) as { user_id: string | null } | undefined;
      effectiveUserId = sess?.user_id || null;
    }

    // 3. Validate stock for every item inside transaction with row locks
    const checkStockStmt = db.prepare(
      'SELECT stock, size FROM product_variants WHERE id = ?'
    );
    const decrementStockStmt = db.prepare(
      'UPDATE product_variants SET stock = stock - ? WHERE id = ?'
    );

    for (const item of cart.items) {
      const variantRow = checkStockStmt.get(item.variant_id) as
        | { stock: number; size: string }
        | undefined;

      if (!variantRow) {
        throw new Error(`Product variant for "${item.name}" no longer exists`);
      }

      if (variantRow.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.name}" (Size ${item.size}). Only ${variantRow.stock} available.`
        );
      }
    }

    // 4. Atomically decrement stock
    for (const item of cart.items) {
      decrementStockStmt.run(item.quantity, item.variant_id);
    }

    // 5. Generate Order ID
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderId = `KC-${year}-${randomDigits}`;

    const paymentStatus = paymentPayload.method === 'cod' ? 'pending_cod' : 'paid';

    // 6. Insert order
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        id, session_id, user_id, subtotal_paise, discount_paise, shipping_paise, total_paise,
        coupon_code, shipping_address_json, payment_method, payment_status, order_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertOrderStmt.run(
      orderId,
      sessionId,
      effectiveUserId || null,
      cart.subtotal_paise,
      cart.discount_paise,
      cart.shipping_paise,
      cart.total_paise,
      cart.coupon_code,
      JSON.stringify({
        fullName: shippingAddress.fullName.trim(),
        phone: cleanPhone,
        email: shippingAddress.email.trim().toLowerCase(),
        addressLine1: shippingAddress.addressLine1.trim(),
        addressLine2: (shippingAddress.addressLine2 || '').trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: cleanPincode,
      }),
      paymentPayload.method,
      paymentStatus,
      'confirmed',
      now
    );

    // 7. Insert order items
    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, variant_id, name, size, image,
        unit_price_paise, quantity, subtotal_paise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orderItems: OrderItem[] = [];

    for (const item of cart.items) {
      const orderItemId = `oi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const subtotal = item.price_paise * item.quantity;

      insertItemStmt.run(
        orderItemId,
        orderId,
        item.product_id,
        item.variant_id,
        item.name,
        item.size,
        item.image,
        item.price_paise,
        item.quantity,
        subtotal
      );

      orderItems.push({
        id: orderItemId,
        order_id: orderId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        size: item.size,
        image: item.image,
        unit_price_paise: item.price_paise,
        quantity: item.quantity,
        subtotal_paise: subtotal,
      });
    }

    // 8. Clear cart & applied coupon for this session
    db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM session_coupons WHERE session_id = ?').run(sessionId);

    return {
      id: orderId,
      session_id: sessionId,
      user_id: effectiveUserId || null,
      items: orderItems,
      subtotal_paise: cart.subtotal_paise,
      discount_paise: cart.discount_paise,
      shipping_paise: cart.shipping_paise,
      total_paise: cart.total_paise,
      coupon_code: cart.coupon_code,
      shipping_address: shippingAddress,
      payment_method: paymentPayload.method,
      payment_status: paymentStatus,
      order_status: 'confirmed',
      created_at: now,
    };
  });
}

/**
 * Retrieve order by ID
 */
export function getOrderById(orderId: string): Order | null {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as
    | {
        id: string;
        session_id: string;
        user_id: string | null;
        subtotal_paise: number;
        discount_paise: number;
        shipping_paise: number;
        total_paise: number;
        coupon_code: string | null;
        shipping_address_json: string;
        payment_method: string;
        payment_status: string;
        order_status: string;
        created_at: string;
      }
    | undefined;

  if (!row) return null;

  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ?')
    .all(row.id) as unknown as OrderItem[];

  return {
    id: row.id,
    session_id: row.session_id,
    user_id: row.user_id,
    items,
    subtotal_paise: row.subtotal_paise,
    discount_paise: row.discount_paise,
    shipping_paise: row.shipping_paise,
    total_paise: row.total_paise,
    coupon_code: row.coupon_code,
    shipping_address: JSON.parse(row.shipping_address_json),
    payment_method: row.payment_method as PaymentPayload['method'],
    payment_status: row.payment_status as Order['payment_status'],
    order_status: row.order_status as Order['order_status'],
    created_at: row.created_at,
  };
}

/**
 * Retrieve orders for a given session or user
 */
export function getOrdersBySession(sessionId: string, userId?: string | null): Order[] {
  let query = 'SELECT * FROM orders WHERE session_id = ?';
  const params: (string | null)[] = [sessionId];

  if (userId) {
    query = 'SELECT * FROM orders WHERE session_id = ? OR user_id = ? ORDER BY created_at DESC';
    params.push(userId);
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const rows = db.prepare(query).all(...params) as Array<{
    id: string;
    session_id: string;
    user_id: string | null;
    subtotal_paise: number;
    discount_paise: number;
    shipping_paise: number;
    total_paise: number;
    coupon_code: string | null;
    shipping_address_json: string;
    payment_method: string;
    payment_status: string;
    order_status: string;
    created_at: string;
  }>;

  return rows.map((row) => {
    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(row.id) as unknown as OrderItem[];

    return {
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      items,
      subtotal_paise: row.subtotal_paise,
      discount_paise: row.discount_paise,
      shipping_paise: row.shipping_paise,
      total_paise: row.total_paise,
      coupon_code: row.coupon_code,
      shipping_address: JSON.parse(row.shipping_address_json),
      payment_method: row.payment_method as PaymentPayload['method'],
      payment_status: row.payment_status as Order['payment_status'],
      order_status: row.order_status as Order['order_status'],
      created_at: row.created_at,
    };
  });
}
