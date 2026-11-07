import React from 'react';
import { Star, ShoppingBag, Eye, AlertCircle } from 'lucide-react';
import { Product } from '../types/index.ts';
import { formatPaise } from '../utils/currency.ts';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
}) => {
  const discountPercent =
    product.mrp_paise > product.price_paise
      ? Math.round(((product.mrp_paise - product.price_paise) / product.mrp_paise) * 100)
      : 0;

  // Calculate total stock across all variants
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const isOutOfStock = totalStock <= 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-md transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden cursor-pointer" onClick={() => onQuickView(product)}>
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.featured && (
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-rose-950 text-amber-200 rounded shadow-xs">
              Bespoke
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-500 text-stone-950 rounded shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Stock warning pill */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded-md tracking-wider">
              Sold Out
            </span>
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2.5 left-2.5 bg-amber-950/90 backdrop-blur-xs text-amber-300 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border border-amber-500/40">
            <AlertCircle className="w-3 h-3" />
            <span>Only {totalStock} left</span>
          </div>
        ) : null}

        {/* Quick View Floating Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-stone-900 p-2 rounded-full shadow-md backdrop-blur-xs cursor-pointer"
          title="Quick View Details"
        >
          <Eye className="w-4 h-4 text-stone-800" />
        </button>
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-medium text-amber-800 uppercase tracking-wider text-[10px]">
              {product.craft}
            </span>
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-stone-400 text-[10px]">({product.review_count})</span>
            </div>
          </div>

          <h3
            onClick={() => onQuickView(product)}
            className="text-sm font-semibold text-stone-900 hover:text-rose-950 transition-colors line-clamp-2 cursor-pointer font-serif"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-xs text-stone-500 font-light line-clamp-1">
            {product.fabric} &bull; {product.color}
          </p>

          {/* Available Sizes preview */}
          <div className="flex items-center gap-1 pt-1 flex-wrap">
            <span className="text-[10px] text-stone-400 uppercase font-semibold mr-1">Sizes:</span>
            {product.variants.map((v) => (
              <span
                key={v.id}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  v.stock > 0
                    ? 'border-stone-200 text-stone-700 bg-stone-50'
                    : 'border-stone-150 text-stone-300 line-through'
                }`}
                title={v.stock > 0 ? `${v.stock} available` : 'Out of stock'}
              >
                {v.size}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                {formatPaise(product.price_paise)}
              </span>
              {product.mrp_paise > product.price_paise && (
                <span className="text-xs text-stone-400 line-through">
                  {formatPaise(product.mrp_paise)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-400">Inclusive of all taxes</p>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-rose-950 hover:bg-rose-900 text-amber-200 hover:text-white shadow-xs'
            }`}
            title={isOutOfStock ? 'Sold Out' : 'Select Size & Add to Bag'}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
