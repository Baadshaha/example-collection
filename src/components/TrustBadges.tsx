import React from 'react';
import { ShieldCheck, Truck, RefreshCw, Sparkles, Lock } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const perks = [
    {
      icon: <Sparkles className="w-5 h-5 text-amber-600" />,
      title: 'Silk Mark Certified',
      description: '100% genuine pure silk & handlooms sourced directly from Varanasi & Kanchipuram.',
    },
    {
      icon: <Truck className="w-5 h-5 text-amber-600" />,
      title: 'Pan-India Express Shipping',
      description: 'Free express shipping on all orders above ₹999 across all Indian states and pin codes.',
    },
    {
      icon: <Lock className="w-5 h-5 text-amber-600" />,
      title: 'Bank-Grade Security',
      description: 'Instant UPI, Net Banking, and tokenized payment. Raw card numbers/CVV are never stored.',
    },
    {
      icon: <RefreshCw className="w-5 h-5 text-amber-600" />,
      title: '7-Day Easy Exchange',
      description: 'Hassle-free size or fit replacements with doorstep pickup assistance.',
    },
  ];

  return (
    <section className="bg-stone-50 border-y border-stone-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((perk, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-stone-200/80 shadow-xs hover:border-amber-400/50 transition-all"
            >
              <div className="p-2.5 rounded-lg bg-amber-50 shrink-0 mt-0.5">
                {perk.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 tracking-wide uppercase">
                  {perk.title}
                </h4>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  {perk.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
