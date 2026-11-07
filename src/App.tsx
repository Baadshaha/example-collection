/**
 * Krushna Collection - Main Application
 * Premier Indian Ethnic & Contemporary Clothing Store
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Product, CartSummary, Order, User } from './types/index.ts';
import { api } from './utils/apiClient.ts';
import { AnnouncementBar } from './components/AnnouncementBar.tsx';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { TrustBadges } from './components/TrustBadges.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductModal } from './components/ProductModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderSuccessModal } from './components/OrderSuccessModal.tsx';
import { OrderHistoryModal } from './components/OrderHistoryModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under5000' | '5000to10000' | 'above10000'>('all');

  // Cart & Modals state
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Toast feedback notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Auth actions
  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user: User, message: string) => {
    setCurrentUser(user);
    showToast(message, 'success');
    loadCartAndOrders();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      showToast('Signed out successfully');
      loadCartAndOrders();
    } catch {
      showToast('Could not sign out', 'error');
    }
  };

  // Fetch products with current filters
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let minPrice: number | undefined = undefined;
      let maxPrice: number | undefined = undefined;

      if (priceFilter === 'under5000') {
        maxPrice = 5000;
      } else if (priceFilter === '5000to10000') {
        minPrice = 5000;
        maxPrice = 10000;
      } else if (priceFilter === 'above10000') {
        minPrice = 10000;
      }

      const res = await api.getProducts({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
        minPrice,
        maxPrice,
      });
      setProducts(res.products);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collection');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy, priceFilter]);

  // Load cart and orders
  const loadCartAndOrders = async () => {
    try {
      const [cartRes, ordersRes] = await Promise.all([api.getCart(), api.getOrders()]);
      setCart(cartRes.cart);
      setUserOrders(ordersRes.orders);
    } catch {
      // Non-fatal on initial load
    }
  };

  useEffect(() => {
    // Initialize session and user data
    api.getSession().then((session) => {
      if (session.user) {
        setCurrentUser(session.user);
      }
      loadCartAndOrders();
    });
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle Add to Bag
  const handleAddToCart = async (productId: string, variantId: string, quantity = 1) => {
    try {
      const res = await api.addToCart(productId, variantId, quantity);
      setCart(res.cart);
      showToast(res.message || 'Added to bag!');
      setIsCartOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add item to bag';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Handle Update Quantity in Cart
  const handleUpdateQuantity = async (itemId: string, qty: number) => {
    try {
      const res = await api.updateCartQuantity(itemId, qty);
      setCart(res.cart);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not update quantity', 'error');
    }
  };

  // Handle Remove from Cart
  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await api.removeCartItem(itemId);
      setCart(res.cart);
      showToast('Item removed from bag');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not remove item', 'error');
    }
  };

  // Handle Apply Coupon
  const handleApplyCoupon = async (code: string) => {
    try {
      const res = await api.applyCoupon(code);
      setCart(res.cart);
      showToast(res.message, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid coupon';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Handle Remove Coupon
  const handleRemoveCoupon = async () => {
    try {
      const res = await api.removeCoupon();
      setCart(res.cart);
      showToast('Coupon removed');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not remove coupon', 'error');
    }
  };

  // Quick view triggers
  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  // Quick add from card (chooses first available variant or opens modal)
  const handleCardAddToCart = (product: Product) => {
    const availableVariant = product.variants.find((v) => v.stock > 0);
    if (!availableVariant) {
      showToast('This product is currently out of stock', 'error');
      return;
    }
    // If product has multiple sizes, open modal for size selection
    if (product.variants.length > 1) {
      setQuickViewProduct(product);
    } else {
      handleAddToCart(product.id, availableVariant.id, 1);
    }
  };

  // When order completes successfully
  const handleOrderSuccess = (order: Order) => {
    setPlacedOrder(order);
    setUserOrders((prev) => [order, ...prev]);
    // Refresh cart & products catalog to reflect decremented stock
    loadCartAndOrders();
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 flex flex-col selection:bg-rose-950 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
              toastMessage.type === 'success'
                ? 'bg-stone-900 text-amber-200 border-amber-400/40'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Announcement Bar */}
      <AnnouncementBar onApplyPromo={(code) => handleApplyCoupon(code)} />

      {/* Main Sticky Header */}
      <Header
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartItemCount={cart?.item_count || 0}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        orderCount={userOrders.length}
        user={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Hero Banner (Shown when viewing all and no search query active) */}
      {selectedCategory === 'all' && !searchQuery && (
        <Hero onExplore={(cat) => setSelectedCategory(cat || 'all')} />
      )}

      {/* Trust & Artisan Heritage Badges */}
      <TrustBadges />

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Section Heading & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 capitalize">
                {selectedCategory === 'all'
                  ? 'All Handcrafted Collections'
                  : selectedCategory === 'sarees'
                  ? 'Pure Handloom Sarees'
                  : selectedCategory === 'kurtas'
                  ? 'Chikankari & Silk Suit Sets'
                  : selectedCategory === 'lehengas'
                  ? 'Heritage Bridal Lehengas'
                  : selectedCategory === 'mens'
                  ? "Men's Royal Silk Couture"
                  : 'Festive & Bridal Edit'}
              </h2>
              <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full text-xs font-bold">
                {products.length}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 font-light">
              Crafted in certified weaving clusters with authentic Silk Mark &amp; Handloom accreditation.
            </p>
          </div>

          {/* Controls: Price range & Sort */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {/* Price Filter Pills */}
            <div className="flex items-center bg-white border border-stone-300 rounded-lg p-0.5 shadow-xs">
              <button
                onClick={() => setPriceFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  priceFilter === 'all' ? 'bg-rose-950 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Prices
              </button>
              <button
                onClick={() => setPriceFilter('under5000')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  priceFilter === 'under5000' ? 'bg-rose-950 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Under ₹5,000
              </button>
              <button
                onClick={() => setPriceFilter('5000to10000')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  priceFilter === '5000to10000' ? 'bg-rose-950 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ₹5K - ₹10K
              </button>
              <button
                onClick={() => setPriceFilter('above10000')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  priceFilter === 'above10000' ? 'bg-rose-950 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ₹10,000+
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 shadow-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none text-stone-700 font-medium cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>

            {/* Reset Filters button if active */}
            {(selectedCategory !== 'all' || searchQuery || priceFilter !== 'all' || sortBy !== 'featured') && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setPriceFilter('all');
                  setSortBy('featured');
                }}
                className="p-1.5 text-stone-500 hover:text-rose-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-stone-200 p-4 space-y-4">
                <div className="aspect-[3/4] bg-stone-200 rounded-lg" />
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
                <div className="h-5 bg-stone-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-800 mx-auto" />
            <h3 className="font-serif font-bold text-lg text-stone-900">Could Not Load Collections</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">{error}</p>
            <button
              onClick={() => loadProducts()}
              className="px-4 py-2 bg-rose-950 text-amber-200 rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 mx-auto flex items-center justify-center text-amber-700">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-stone-900">No Matching Attires Found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No items match your filter criteria. Try adjusting your search query, price range, or category.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setPriceFilter('all');
              }}
              className="px-5 py-2.5 bg-rose-950 text-amber-200 hover:bg-rose-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={handleOpenQuickView}
                onAddToCart={handleCardAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Shopping Bag Slide-over */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      {cart && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          onOrderSuccess={handleOrderSuccess}
          user={currentUser}
        />
      )}

      {/* Login & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* Order Success Receipt Modal */}
      <OrderSuccessModal
        order={placedOrder}
        onClose={() => setPlacedOrder(null)}
        onViewOrders={() => {
          setPlacedOrder(null);
          setIsOrdersOpen(true);
        }}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={userOrders}
        onStartShopping={() => {
          setSelectedCategory('all');
          setSearchQuery('');
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
