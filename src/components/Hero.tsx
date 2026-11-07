import React from 'react';
import { Sparkles, ArrowRight, Award, ShieldCheck, HeartHandshake } from 'lucide-react';

interface HeroProps {
  onExplore: (category?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore }) => {
  return (
    <div className="relative bg-gradient-to-b from-stone-900 via-rose-950 to-stone-950 text-white overflow-hidden py-12 lg:py-20">
      {/* Decorative background motifs */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5c07b_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs tracking-wider uppercase font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Royal Indian Couture &bull; Handloom Masterpieces</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-amber-50 leading-[1.15]">
              Woven in Tradition, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-200 to-amber-100 italic">
                Tailored for Royalty
              </span>
            </h1>

            <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              Discover timeless Banarasi Katan silks, delicate Lucknowi Chikankari, and regal bridal
              lehengas crafted by generational weavers across Varanasi, Lucknow, and Kanchipuram.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => onExplore('sarees')}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-rose-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Pure Sarees</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onExplore('lehengas')}
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-stone-100 font-medium text-sm border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
              >
                Bridal Lehengas
              </button>

              <button
                onClick={() => onExplore('mens')}
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-stone-100 font-medium text-sm border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
              >
                Men&apos;s Royal Silk
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-left">
              <div>
                <p className="text-amber-300 font-serif text-lg sm:text-xl font-bold">100%</p>
                <p className="text-stone-400 text-xs">Authentic Silk Mark</p>
              </div>
              <div>
                <p className="text-amber-300 font-serif text-lg sm:text-xl font-bold">₹999+</p>
                <p className="text-stone-400 text-xs">Free Pan-India Delivery</p>
              </div>
              <div>
                <p className="text-amber-300 font-serif text-lg sm:text-xl font-bold">28 Days</p>
                <p className="text-stone-400 text-xs">Handloom Loom Crafting</p>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/20 bg-stone-900">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80"
                  alt="Example Collection Royal Banarasi Silk Saree"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 sm:left-4 bg-stone-900/90 backdrop-blur-md p-4 rounded-xl border border-amber-400/30 shadow-xl max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-300">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                      Master Weaver Certified
                    </h4>
                    <p className="text-[11px] text-stone-300">
                      Real zari kadwa work with hallmark Silk Mark guarantee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
