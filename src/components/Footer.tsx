import React from 'react';
import { ShieldCheck, Heart, MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-amber-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif tracking-wider text-amber-100 font-bold">
                EXAMPLE
              </span>
              <span className="text-xs px-2 py-0.5 uppercase tracking-widest bg-amber-400 text-stone-950 rounded font-bold">
                Collection
              </span>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed font-light">
              Example Collection celebrates India&apos;s rich textile legacy. We partner directly
              with master weavers across Varanasi, Kanchipuram, Lucknow, and Chanderi to bring you
              pure handloom silks, authentic Chikankari, and bespoke bridal couture.
            </p>
            <div className="flex items-center gap-3 text-xs text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Silk Mark Certified &bull; Handloom Board India</span>
            </div>
          </div>

          {/* Handloom Clusters */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-100 font-serif">
              Weaving Clusters
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-light">
              <li className="hover:text-amber-200 transition-colors">Varanasi Katan Silks</li>
              <li className="hover:text-amber-200 transition-colors">Kanchipuram Korvai Weaves</li>
              <li className="hover:text-amber-200 transition-colors">Lucknowi Chikankari</li>
              <li className="hover:text-amber-200 transition-colors">Chanderi Zari Handlooms</li>
              <li className="hover:text-amber-200 transition-colors">Jaipur Gotapatti &amp; Dabu</li>
            </ul>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-100 font-serif">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-light">
              <li className="hover:text-amber-200 transition-colors">Pure Silk Sarees</li>
              <li className="hover:text-amber-200 transition-colors">Georgette Anarkali Sets</li>
              <li className="hover:text-amber-200 transition-colors">Bridal Velvet Lehengas</li>
              <li className="hover:text-amber-200 transition-colors">Men&apos;s Raw Silk Bundi</li>
              <li className="hover:text-amber-200 transition-colors">Festive Dupattas &amp; Stoles</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-100 font-serif">
              Artisan Desk
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400 font-light">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Godowlia Chowk, Varanasi, Uttar Pradesh 221001</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+91 98200 12345 (10 AM - 7 PM IST)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>care@examplecollection.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p className="flex items-center gap-1">
            &copy; {new Date().getFullYear()} Example Collection. Crafted with{' '}
            <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 inline" /> for Indian Handlooms.
          </p>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span>UPI Verified</span>
            <span>&bull;</span>
            <span>RuPay / Visa</span>
            <span>&bull;</span>
            <span>Net Banking</span>
            <span>&bull;</span>
            <span>Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
