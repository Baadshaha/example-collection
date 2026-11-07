import React, { useState } from 'react';
import { ShoppingBag, Search, PackageCheck, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { ProductCategory, User } from '../types/index.ts';

interface HeaderProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  orderCount: number;
  user: User | null;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogout: () => void;
}

const CATEGORIES: { id: string; label: string; category?: ProductCategory }[] = [
  { id: 'all', label: 'All Collections' },
  { id: 'sarees', label: 'Pure Sarees' },
  { id: 'kurtas', label: 'Kurtas & Suit Sets' },
  { id: 'lehengas', label: 'Heritage Lehengas' },
  { id: 'mens', label: "Men's Royal Ethnic" },
  { id: 'festive', label: 'Festive & Bridal' },
];

export const Header: React.FC<HeaderProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartItemCount,
  onOpenCart,
  onOpenOrders,
  orderCount,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Bar */}
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Branding */}
          <button
            onClick={() => onSelectCategory('all')}
            className="flex flex-col text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-serif tracking-wider text-rose-950 font-bold group-hover:text-rose-800 transition-colors">
                EXAMPLE
              </span>
              <span className="text-xs px-1.5 py-0.5 uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold">
                Collection
              </span>
            </div>
            <span className="text-[11px] tracking-widest text-stone-500 uppercase -mt-0.5">
              Handcrafted Indian Elegance
            </span>
          </button>

          {/* Search Box */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Banarasi, Chikankari, Lehengas, Silk..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition-all text-stone-800 placeholder-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right Actions: User Account, Orders & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Account Button & Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 text-stone-700 hover:text-rose-950 hover:bg-stone-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  title="My Account"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-950 text-amber-200 flex items-center justify-center text-xs font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-xs font-semibold">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900">{user.fullName}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                      <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                        +91 {user.phone}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenOrders();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                    >
                      <PackageCheck className="w-4 h-4 text-rose-900" />
                      <span>My Orders ({orderCount})</span>
                    </button>

                    <div className="border-t border-stone-100 my-1" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-700 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-3 py-2 text-stone-700 hover:text-rose-950 hover:bg-stone-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                title="Sign In or Register"
              >
                <UserIcon className="w-4 h-4 text-rose-950" />
                <span className="hidden sm:inline text-xs font-semibold">Sign In</span>
              </button>
            )}

            <button
              onClick={onOpenOrders}
              className="flex items-center gap-1.5 px-3 py-2 text-stone-700 hover:text-rose-950 hover:bg-stone-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              title="View my placed orders"
            >
              <PackageCheck className="w-5 h-5 text-rose-900" />
              <span className="hidden md:inline">Orders</span>
              {orderCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-stone-200 text-stone-700 text-xs rounded-full font-semibold">
                  {orderCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-4 py-2.5 bg-rose-950 text-white hover:bg-rose-900 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              <span className="font-semibold hidden sm:inline">Bag</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-stone-950 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search (below main bar on small screens) */}
        <div className="sm:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search sarees, kurtas, lehengas..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900 text-stone-800"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Category Navigation Bar */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-stone-100 scrollbar-none text-sm">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-950 text-amber-100 shadow-sm font-semibold'
                    : 'text-stone-600 hover:text-rose-950 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
