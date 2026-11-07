/**
 * Client API Helper for Krushna Collection
 * Handles requests, errors, and session state.
 */

import {
  CartSummary,
  Order,
  Product,
  ShippingAddress,
  PaymentPayload,
  Coupon,
  User,
  SessionInfo,
  AuthResponse,
} from '../types/index.ts';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  async getSession(): Promise<SessionInfo> {
    const res = await fetch('/api/session');
    return handleResponse(res);
  },

  async signUp(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async login(data: { identifier: string; password: string }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ success: boolean; user: User | null }> {
    const res = await fetch('/api/auth/me');
    return handleResponse(res);
  },

  async getProducts(params?: {
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ success: boolean; count: number; products: Product[] }> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));

    const res = await fetch(`/api/products?${query.toString()}`);
    return handleResponse(res);
  },

  async getProduct(id: string): Promise<{ success: boolean; product: Product }> {
    const res = await fetch(`/api/products/${id}`);
    return handleResponse(res);
  },

  async getCart(): Promise<{ success: boolean; cart: CartSummary }> {
    const res = await fetch('/api/cart');
    return handleResponse(res);
  },

  async addToCart(productId: string, variantId: string, quantity = 1): Promise<{ success: boolean; cart: CartSummary; message: string }> {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId, quantity }),
    });
    return handleResponse(res);
  },

  async updateCartQuantity(itemId: string, quantity: number): Promise<{ success: boolean; cart: CartSummary }> {
    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(res);
  },

  async removeCartItem(itemId: string): Promise<{ success: boolean; cart: CartSummary }> {
    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async applyCoupon(code: string): Promise<{ success: boolean; cart: CartSummary; message: string }> {
    const res = await fetch('/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return handleResponse(res);
  },

  async removeCoupon(): Promise<{ success: boolean; cart: CartSummary; message: string }> {
    const res = await fetch('/api/cart/coupon', {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async getCoupons(): Promise<{ success: boolean; coupons: Coupon[] }> {
    const res = await fetch('/api/coupons');
    return handleResponse(res);
  },

  async checkout(shippingAddress: ShippingAddress, payment: PaymentPayload): Promise<{ success: boolean; order: Order; message: string }> {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingAddress, payment }),
    });
    return handleResponse(res);
  },

  async getOrders(): Promise<{ success: boolean; orders: Order[] }> {
    const res = await fetch('/api/orders');
    return handleResponse(res);
  },
};
