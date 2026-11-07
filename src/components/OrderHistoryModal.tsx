import React from 'react';
import { X, PackageCheck, MapPin, Calendar, Clock, ShoppingBag } from 'lucide-react';
import { Order } from '../types/index.ts';
import { formatPaise } from '../utils/currency.ts';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onStartShopping: () => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onStartShopping,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-rose-950" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
              My Orders &amp; Tracking ({orders.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-stone-800 text-lg">No Orders Placed Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                You haven&apos;t placed any orders in this session yet. Explore our handcrafted sarees,
                lehengas, and kurtas!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onStartShopping();
                }}
                className="mt-2 px-5 py-2.5 bg-rose-950 text-amber-200 hover:bg-rose-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 rounded-xl border border-stone-200 bg-white shadow-xs space-y-3 hover:border-amber-300 transition-colors"
                >
                  {/* Top line of Order Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-stone-900">
                          {order.id}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {order.order_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-500 block">Total Amount</span>
                      <span className="text-sm sm:text-base font-bold font-serif text-rose-950">
                        {formatPaise(order.total_paise)}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-xs">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-14 object-cover object-top rounded bg-stone-100 border border-stone-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900 truncate font-serif">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Size: {item.size} &bull; Qty: {item.quantity} &bull;{' '}
                            {formatPaise(item.unit_price_paise)} each
                          </p>
                        </div>
                        <span className="font-bold text-stone-800 font-serif">
                          {formatPaise(item.subtotal_paise)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping address footer */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-900" />
                      <span>
                        Deliver to: {order.shipping_address.fullName}, {order.shipping_address.city} (
                        {order.shipping_address.pincode})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-800 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Est. Delivery: 2-4 Days</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
