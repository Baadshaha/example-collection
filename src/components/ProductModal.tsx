import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { Product, ProductVariant } from '../types/index.ts';
import { formatPaise } from '../utils/currency.ts';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (productId: string, variantId: string, quantity: number) => Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  // Initial variant selection
  const availableVariant = product.variants.find((v) => v.stock > 0) || product.variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(availableVariant);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const discountPercent =
    product.mrp_paise > product.price_paise
      ? Math.round(((product.mrp_paise - product.price_paise) / product.mrp_paise) * 100)
      : 0;

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setPincodeStatus('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setPincodeStatus(`Available! Express courier delivery to ${cleanPin} in 2-4 business days.`);
  };

  const handleAdd = async () => {
    if (!selectedVariant || selectedVariant.stock <= 0) {
      setFeedbackError('Please select an in-stock size');
      return;
    }
    setFeedbackError(null);
    setIsSubmitting(true);
    try {
      await onAddToCart(product.id, selectedVariant.id, quantity);
      onClose();
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Could not add to bag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-stone-100 text-stone-700 transition-colors shadow-sm cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Left: Gallery */}
          <div className="p-4 sm:p-6 bg-stone-50 flex flex-col gap-4">
            <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-stone-200 shadow-xs relative">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-top"
              />
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 px-2.5 py-1 text-xs uppercase font-bold tracking-wider bg-rose-950 text-amber-200 rounded-md shadow">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-rose-900 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Craft Origin statement */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Craft &amp; Fabric Heritage</span>
              </div>
              <p>
                <strong>Craft:</strong> {product.craft}
              </p>
              <p>
                <strong>Fabric:</strong> {product.fabric}
              </p>
              <p>
                <strong>Ideal For:</strong> {product.occasion}
              </p>
            </div>
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Rating */}
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="uppercase tracking-widest text-[11px] font-semibold text-rose-900">
                  {product.category}
                </span>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-stone-800">{product.rating.toFixed(1)}</span>
                  <span className="text-stone-400 text-xs">({product.review_count} verified reviews)</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-tight">
                {product.name}
              </h2>

              {/* Price in Paise */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-bold font-serif text-rose-950">
                    {formatPaise(product.price_paise)}
                  </span>
                  {product.mrp_paise > product.price_paise && (
                    <span className="text-sm sm:text-base text-stone-400 line-through">
                      MRP {formatPaise(product.mrp_paise)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Save {formatPaise(product.mrp_paise - product.price_paise)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500">Inclusive of all taxes &bull; Free shipping on orders &gt; ₹999</p>
              </div>

              {/* Description */}
              <p className="text-sm text-stone-600 leading-relaxed font-light">
                {product.description}
              </p>

              {/* Size Selector */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Select Size: <span className="text-rose-950">{selectedVariant.size}</span>
                  </span>
                  <span className="text-xs text-stone-500">Standard Indian Sizing</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant.id === v.id;
                    const inStock = v.stock > 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVariant(v);
                          setQuantity(1);
                        }}
                        disabled={!inStock}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950 text-amber-200 border-rose-950 shadow-xs'
                            : inStock
                            ? 'bg-white text-stone-800 border-stone-300 hover:border-rose-900'
                            : 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed line-through'
                        }`}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>

                {/* Stock Alert for chosen variant */}
                <div className="pt-1">
                  {selectedVariant.stock <= 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>This size is currently sold out.</span>
                    </div>
                  ) : selectedVariant.stock <= 4 ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Hurry! Only {selectedVariant.stock} left in stock for this size.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>In Stock ({selectedVariant.stock} units ready to ship)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity selector */}
              {selectedVariant.stock > 0 && (
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-stone-50">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1 text-stone-700 hover:bg-stone-200 disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-xs font-bold text-stone-900 min-w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
                      disabled={quantity >= selectedVariant.stock}
                      className="px-3 py-1 text-stone-700 hover:bg-stone-200 disabled:opacity-40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Pincode Delivery Check */}
              <div className="pt-2 border-t border-stone-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-rose-900" />
                  <span>Check Delivery Pin Code</span>
                </div>
                <form onSubmit={handlePincodeCheck} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter 6-digit PIN (e.g. 110001)"
                    className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>
                {pincodeStatus && (
                  <p className="text-[11px] text-stone-600 mt-1">{pincodeStatus}</p>
                )}
              </div>
            </div>

            {/* Error banner if any */}
            {feedbackError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            )}

            {/* Add to Bag Button */}
            <div className="pt-4 border-t border-stone-200 space-y-2">
              <button
                onClick={handleAdd}
                disabled={isSubmitting || selectedVariant.stock <= 0}
                className="w-full py-3.5 px-4 bg-rose-950 hover:bg-rose-900 disabled:bg-stone-300 text-amber-200 disabled:text-stone-500 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Adding to Bag...'
                    : selectedVariant.stock <= 0
                    ? 'Currently Out of Stock'
                    : `Add to Bag • ${formatPaise(product.price_paise * quantity)}`}
                </span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Silk Mark Guarantee
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-stone-500" />
                  Insured Express Transit
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
