import React from 'react';
import { CheckCircle2, Package, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { Order } from '../types/index.ts';
import { formatPaise } from '../utils/currency.ts';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrders: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onViewOrders,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white p-6 sm:p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Order Confirmed &bull; धन्यवाद</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-100">
              Thank You for Shopping with Example Collection
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm font-light">
              Your handcrafted pieces are being inspected and safely packed by our artisans.
            </p>
          </div>

          <div className="inline-block bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20 text-xs sm:text-sm font-mono text-amber-300">
            Order Reference: <strong className="text-white">{order.id}</strong>
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Timeline */}
          <div className="flex items-center justify-between p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-800" />
              <span>
                Status: <strong className="uppercase">{order.order_status}</strong>
              </span>
            </div>
            <span className="text-amber-800 font-semibold">
              Expected Delivery: 2-4 business days
            </span>
          </div>

          {/* Items Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Ordered Items ({order.items.length})
            </h4>
            <div className="space-y-2.5 divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-16 object-cover object-top rounded-lg bg-stone-100 border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-stone-900 truncate font-serif">
                      {item.name}
                    </h5>
                    <p className="text-[11px] text-stone-500">
                      Size: {item.size} &bull; Qty: {item.quantity}
                    </p>
                    <p className="text-xs font-bold text-rose-950 font-serif">
                      {formatPaise(item.subtotal_paise)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-stone-200">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-rose-900" />
                <span>Delivery Address</span>
              </div>
              <p className="font-semibold text-stone-900">{order.shipping_address.fullName}</p>
              <p className="text-stone-600">{order.shipping_address.addressLine1}</p>
              {order.shipping_address.addressLine2 && (
                <p className="text-stone-600">{order.shipping_address.addressLine2}</p>
              )}
              <p className="text-stone-600">
                {order.shipping_address.city}, {order.shipping_address.state} -{' '}
                {order.shipping_address.pincode}
              </p>
              <p className="text-stone-600">Phone: +91 {order.shipping_address.phone}</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <span className="block font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                Payment Breakdown
              </span>
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-serif">{formatPaise(order.subtotal_paise)}</span>
              </div>
              {order.discount_paise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({order.coupon_code}):</span>
                  <span className="font-serif">-{formatPaise(order.discount_paise)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping:</span>
                <span>{order.shipping_paise === 0 ? 'FREE' : formatPaise(order.shipping_paise)}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200 text-sm">
                <span>Total Paid:</span>
                <span className="text-rose-950 font-serif">{formatPaise(order.total_paise)}</span>
              </div>
              <div className="pt-1 text-[11px] text-stone-500">
                Mode: <span className="font-bold uppercase text-stone-700">{order.payment_method}</span> ({order.payment_status})
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onViewOrders();
            }}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            View in My Orders
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-rose-950 hover:bg-rose-900 text-amber-200 font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
