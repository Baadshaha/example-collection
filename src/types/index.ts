/**
 * Krushna Collection - Core Types
 * All monetary amounts are strictly represented as integers in paise (1 INR = 100 paise).
 */

export type MoneyInPaise = number; // Integer representing paise, e.g. 249900 = ₹2,499.00

export type ProductCategory = 'sarees' | 'kurtas' | 'lehengas' | 'mens' | 'festive';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size';

export interface ProductVariant {
  id: string;
  product_id: string;
  size: ClothingSize;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  fabric: string;
  craft: string;
  occasion: string;
  color: string;
  price_paise: MoneyInPaise;
  mrp_paise: MoneyInPaise;
  images: string[];
  rating: number;
  review_count: number;
  featured: boolean;
  is_new: boolean;
  variants: ProductVariant[];
}

export interface CartItem {
  id: string;
  session_id: string;
  product_id: string;
  variant_id: string;
  name: string;
  size: ClothingSize;
  image: string;
  price_paise: MoneyInPaise;
  quantity: number;
  stock: number;
}

export interface Coupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number; // percentage (e.g. 10 for 10%) or paise (e.g. 50000 for ₹500)
  min_order_paise: MoneyInPaise;
  description: string;
  expires_at: string;
}

export interface CartSummary {
  items: CartItem[];
  item_count: number;
  subtotal_paise: MoneyInPaise;
  discount_paise: MoneyInPaise;
  shipping_paise: MoneyInPaise;
  total_paise: MoneyInPaise;
  coupon_code: string | null;
  coupon_discount_text?: string;
  free_shipping_threshold_paise: MoneyInPaise;
  free_shipping_qualified: boolean;
}

export interface ShippingAddress {
  fullName: string;
  phone: string; // 10-digit Indian mobile number
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string; // 6-digit Indian PIN code
}

export type PaymentMethod = 'upi' | 'netbanking' | 'cod' | 'card_token';

export interface PaymentPayload {
  method: PaymentMethod;
  upiId?: string;
  bankCode?: string;
  // Card security: raw card numbers and CVV are NEVER accepted or stored
  cardToken?: string;
  cardLastFour?: string;
  cardNetwork?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  name: string;
  size: ClothingSize;
  image: string;
  unit_price_paise: MoneyInPaise;
  quantity: number;
  subtotal_paise: MoneyInPaise;
}

export interface Order {
  id: string;
  session_id: string;
  user_id?: string | null;
  items: OrderItem[];
  subtotal_paise: MoneyInPaise;
  discount_paise: MoneyInPaise;
  shipping_paise: MoneyInPaise;
  total_paise: MoneyInPaise;
  coupon_code: string | null;
  shipping_address: ShippingAddress;
  payment_method: PaymentMethod;
  payment_status: 'paid' | 'pending_cod';
  order_status: 'confirmed' | 'processing' | 'shipped' | 'delivered';
  created_at: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface SessionInfo {
  sessionId: string;
  csrfToken: string;
  user?: User | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
}

export interface ApiErrorResponse {
  error: string;
  field?: string;
  details?: unknown;
}
