/**
 * Krushna Collection - Express API Router
 * Enforces strict server-side validation, secure sessions, and transactional data integrity.
 */

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import {
  addToCart,
  applyCoupon,
  createOrderTransactional,
  getAllProducts,
  getOrderById,
  getOrdersBySession,
  getProductById,
  getCart,
  removeCartItem,
  removeCoupon,
  updateCartQuantity,
  db,
} from './db.ts';
import { PaymentPayload, ShippingAddress, User } from '../types/index.ts';
import {
  registerUser,
  authenticateUser,
  attachUserToSession,
  detachUserFromSession,
  getUserBySessionId,
} from './auth.ts';

export const apiRouter = Router();

// Extend Request type with session and user data
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      sessionId: string;
      csrfToken: string;
      user?: User | null;
    }
  }
}

/**
 * Session middleware:
 * Manages cryptographically secure HTTP-only cookies and database session records.
 */
export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    let sessionId = req.cookies?.['kc_session_id'];
    let csrfToken = '';

    if (sessionId && typeof sessionId === 'string' && sessionId.length >= 32) {
      const sessionRow = db
        .prepare('SELECT session_id, csrf_token FROM sessions WHERE session_id = ?')
        .get(sessionId) as { session_id: string; csrf_token: string } | undefined;

      if (sessionRow) {
        csrfToken = sessionRow.csrf_token;
      } else {
        sessionId = undefined;
      }
    }

    if (!sessionId) {
      sessionId = crypto.randomBytes(32).toString('hex');
      csrfToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      db.prepare(
        'INSERT INTO sessions (session_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?)'
      ).run(sessionId, csrfToken, new Date().toISOString(), expiresAt);

      res.cookie('kc_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });
    }

    req.sessionId = sessionId;
    req.csrfToken = csrfToken;
    req.user = getUserBySessionId(sessionId);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authentication Endpoints
 */
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = req.user || null;
  res.json({
    success: true,
    user,
  });
});

apiRouter.post('/auth/signup', (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password } = req.body;
    const user = registerUser({ fullName, email, phone, password });
    attachUserToSession(req.sessionId, user.id);
    req.user = user;

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Example Collection.',
      user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sign up failed';
    res.status(400).json({ error: message });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    const user = authenticateUser(identifier, password);
    attachUserToSession(req.sessionId, user.id);
    req.user = user;

    res.json({
      success: true,
      message: `Welcome back, ${user.fullName.split(' ')[0]}!`,
      user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  try {
    detachUserFromSession(req.sessionId);
    req.user = null;
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/session - Return current session info, CSRF token, and user info
 */
apiRouter.get('/session', (req: Request, res: Response) => {
  res.json({
    sessionId: req.sessionId,
    csrfToken: req.csrfToken,
    user: req.user || null,
  });
});

/**
 * GET /api/products - List products with server filtering and sorting
 */
apiRouter.get('/products', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, sort, minPrice, maxPrice } = req.query;

    const minPricePaise =
      minPrice !== undefined && !isNaN(Number(minPrice))
        ? Math.round(Number(minPrice) * 100)
        : undefined;

    const maxPricePaise =
      maxPrice !== undefined && !isNaN(Number(maxPrice))
        ? Math.round(Number(maxPrice) * 100)
        : undefined;

    const products = getAllProducts({
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      minPricePaise,
      maxPricePaise,
    });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id - Single product details
 */
apiRouter.get('/products/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cart - Fetch current cart
 */
apiRouter.get('/cart', (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = getCart(req.sessionId);
    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cart - Add item to cart
 */
apiRouter.post('/cart', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId, quantity } = req.body;

    if (!productId || typeof productId !== 'string') {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }
    if (!variantId || typeof variantId !== 'string') {
      res.status(400).json({ error: 'Size/Variant selection is required' });
      return;
    }

    const qty = typeof quantity === 'number' ? Math.floor(quantity) : 1;
    if (qty <= 0) {
      res.status(400).json({ error: 'Quantity must be at least 1' });
      return;
    }

    const updatedCart = addToCart(req.sessionId, productId, variantId, qty);
    res.json({ success: true, message: 'Item added to cart', cart: updatedCart });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add item to cart';
    res.status(400).json({ error: message });
  }
});

/**
 * PATCH /api/cart/:itemId - Update item quantity
 */
apiRouter.patch('/cart/:itemId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || isNaN(quantity)) {
      res.status(400).json({ error: 'Quantity must be a valid number' });
      return;
    }

    const updatedCart = updateCartQuantity(req.sessionId, itemId, Math.floor(quantity));
    res.json({ success: true, cart: updatedCart });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update cart';
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/cart/:itemId - Remove item from cart
 */
apiRouter.delete('/cart/:itemId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const updatedCart = removeCartItem(req.sessionId, itemId);
    res.json({ success: true, cart: updatedCart });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove cart item';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/cart/coupon - Apply coupon
 */
apiRouter.post('/cart/coupon', (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Please enter a coupon code' });
      return;
    }

    const { coupon, summary } = applyCoupon(req.sessionId, code);
    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      cart: summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid coupon';
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/cart/coupon - Remove coupon
 */
apiRouter.delete('/cart/coupon', (req: Request, res: Response) => {
  try {
    const cart = removeCoupon(req.sessionId);
    res.json({ success: true, message: 'Coupon removed', cart });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove coupon';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/coupons - List active promotions
 */
apiRouter.get('/coupons', (_req: Request, res: Response) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY min_order_paise ASC').all();
  res.json({ success: true, coupons });
});

/**
 * POST /api/checkout - Atomic transactional order placement
 * Rule 5: Validate all input on the server
 * Rule 6: Never store card numbers or CVV
 * Rule 8: Use database transactions wherever stock, orders, or payments change
 */
apiRouter.post('/checkout', (req: Request, res: Response) => {
  try {
    const { shippingAddress, payment } = req.body as {
      shippingAddress: ShippingAddress;
      payment: PaymentPayload;
    };

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      res.status(400).json({ error: 'Shipping address details are required' });
      return;
    }
    if (!payment || typeof payment !== 'object') {
      res.status(400).json({ error: 'Payment information is required' });
      return;
    }

    // Security check: Never accept or allow card numbers or CVV in the request payload
    const rawBody = req.body as Record<string, unknown>;
    const paymentRaw = payment as unknown as Record<string, unknown>;
    if (
      'cardNumber' in paymentRaw ||
      'card_number' in paymentRaw ||
      'cvv' in paymentRaw ||
      'cvv2' in paymentRaw ||
      'cardNumber' in rawBody ||
      'cvv' in rawBody
    ) {
      res.status(400).json({
        error:
          'Security violation: Direct credit/debit card numbers and CVV must never be transmitted. Please use tokenized gateway payment.',
      });
      return;
    }

    // Execute atomic order transaction
    const order = createOrderTransactional(req.sessionId, shippingAddress, payment, req.user?.id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order checkout failed';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/orders - Fetch orders placed in current session or account
 */
apiRouter.get('/orders', (req: Request, res: Response) => {
  try {
    const orders = getOrdersBySession(req.sessionId, req.user?.id);
    res.json({ success: true, orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve orders';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/orders/:orderId - Order details
 */
apiRouter.get('/orders/:orderId', (req: Request, res: Response) => {
  try {
    const order = getOrderById(req.params.orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    // Permit viewing orders created by the same session or the authenticated user
    const isOwner =
      order.session_id === req.sessionId || (req.user && order.user_id === req.user.id);

    if (!isOwner) {
      res.status(403).json({ error: 'Unauthorized to view this order' });
      return;
    }
    res.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch order';
    res.status(500).json({ error: message });
  }
});
