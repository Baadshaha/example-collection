import React from 'react';
import { Sparkles, Truck, ShieldCheck } from 'lucide-react';

interface AnnouncementBarProps {
  onApplyPromo?: (code: string) => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onApplyPromo }) => {
  return (
    <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-amber-100 text-xs py-2 px-4 shadow-sm border-b border-amber-900/40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>
            Festive Edit: Use code{' '}
            <button
              onClick={() => onApplyPromo?.('UTSAV10')}
              className="font-bold underline decoration-amber-400 decoration-dotted hover:text-amber-300 transition-colors cursor-pointer"
              title="Click to copy & apply UTSAV10"
            >
              UTSAV10
            </button>{' '}
            for flat 10% OFF on all handcrafted collections!
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-[11px] text-amber-200/80">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Free Express Shipping above ₹999</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Silk Mark &amp; Handloom Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
