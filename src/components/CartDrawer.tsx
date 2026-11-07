import React, { useState } from 'react';
import {
  X,
  Trash2,
  Tag,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Truck,
  AlertCircle,
  Check,
} from 'lucide-react';
import { CartSummary } from '../types/index.ts';
import { formatPaise } from '../utils/currency.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartSummary | null;
  onUpdateQuantity: (itemId: string, qty: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon,
  onProceedToCheckout,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponError(null);
    setIsApplyingCoupon(true);
    try {
      await onApplyCoupon(code);
      setCouponInput('');
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : 'Invalid coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Free shipping calculation
  const subtotalPaise = cart?.subtotal_paise || 0;
  const freeThreshold = cart?.free_shipping_threshold_paise || 99900;
  const remainingForFreeShipping = Math.max(0, freeThreshold - subtotalPaise);
  const freeShippingProgress = Math.min(100, Math.round((subtotalPaise / freeThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-950" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
              Shopping Bag ({cart?.item_count || 0})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="px-5 py-3 bg-amber-50/60 border-b border-amber-200/40 text-xs">
          {remainingForFreeShipping > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-amber-950 font-medium">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-700" />
                  Add {formatPaise(remainingForFreeShipping)} more for Free Shipping
                </span>
                <span className="font-bold text-amber-800">{freeShippingProgress}%</span>
              </div>
              <div className="w-full bg-amber-200/70 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>You have unlocked FREE Express Delivery across India!</span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-stone-100">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-stone-800">Your Bag is Empty</h3>
                <p className="text-xs text-stone-500 max-w-xs">
                  Explore our handcrafted Banarasi silks, delicate chikankari, and festive ensembles.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-rose-950 text-amber-200 hover:bg-rose-900 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="pt-4 first:pt-0 flex gap-3.5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-24 object-cover object-top rounded-lg bg-stone-100 shrink-0 border border-stone-200"
                />

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-semibold text-stone-900 line-clamp-2 font-serif">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Size: <span className="font-semibold text-stone-700">{item.size}</span>
                    </p>
                    <p className="text-xs font-bold text-rose-950 mt-1 font-serif">
                      {formatPaise(item.price_paise)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-stone-300 rounded-md overflow-hidden bg-white text-xs">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-1 font-bold text-stone-900 min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title={item.quantity >= item.stock ? `Max stock reached (${item.stock})` : 'Add one more'}
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold text-stone-900 font-serif">
                      {formatPaise(item.price_paise * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Coupons & Checkout */}
        {!isEmpty && cart && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-4">
            {/* Coupon Section */}
            <div className="space-y-2">
              {cart.coupon_code ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold">{cart.coupon_code}</span>
                      <span className="text-emerald-700 ml-1.5 font-medium">
                        ({cart.coupon_discount_text})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onRemoveCoupon}
                    className="text-stone-500 hover:text-red-700 text-xs font-semibold cursor-pointer underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter promo coupon code"
                      className="flex-1 px-3 py-1.5 text-xs uppercase font-medium bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      disabled={isApplyingCoupon}
                      className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>

                  {/* Quick Coupon Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[10px]">
                    <span className="text-stone-400 font-medium">Offers:</span>
                    <button
                      onClick={() => handleApplyCoupon('UTSAV10')}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded border border-amber-300 font-bold cursor-pointer"
                    >
                      UTSAV10 (10% OFF)
                    </button>
                    <button
                      onClick={() => handleApplyCoupon('EXAMPLE500')}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded border border-amber-300 font-bold cursor-pointer"
                    >
                      EXAMPLE500 (₹500 OFF)
                    </button>
                  </div>
                </div>
              )}

              {couponError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-200">
              <div className="flex justify-between">
                <span>Subtotal ({cart.item_count} items)</span>
                <span className="font-semibold text-stone-900 font-serif">
                  {formatPaise(cart.subtotal_paise)}
                </span>
              </div>

              {cart.discount_paise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Savings</span>
                  <span className="font-semibold font-serif">
                    -{formatPaise(cart.discount_paise)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span>
                  {cart.shipping_paise === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[11px]">Free</span>
                  ) : (
                    <span className="font-serif font-semibold text-stone-900">
                      {formatPaise(cart.shipping_paise)}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Amount</span>
                <span className="font-serif text-base text-rose-950">
                  {formatPaise(cart.total_paise)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 bg-rose-950 hover:bg-rose-900 text-amber-200 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
