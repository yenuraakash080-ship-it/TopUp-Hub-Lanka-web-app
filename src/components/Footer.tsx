import React from 'react';
import { EZCASH_MERCHANT_NUMBER, STORE_NAME } from '../data/packages';
import { ShieldCheck, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="support-section"
      className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0B0D] py-10 text-xs text-slate-600 dark:text-slate-400 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-black italic uppercase tracking-wider text-amber-600 dark:text-[#F5C400]">
                {STORE_NAME}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Sri Lanka's trusted multi-game top-up platform for Free Fire, PUBG Mobile, Mobile Legends, Blood Strike, Call of Duty, and international game credits.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
              <span>Official Sri Lankan Distributor</span>
              <span>·</span>
              <span>24/7 Automated Delivery</span>
            </div>
          </div>

          {/* Payment & Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Accepted Payments
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>Cards: <strong className="text-slate-900 dark:text-slate-200">VISA / MasterCard</strong></li>
              <li>QR & Banks: <strong className="text-slate-900 dark:text-slate-200">LankaQR / iPay / Bank</strong></li>
              <li>Wallets: <strong className="text-amber-600 dark:text-[#F5C400] font-mono">Web EZ Wallet · Binance</strong></li>
              <li>Direct Contact: <strong className="text-slate-900 dark:text-slate-200 font-mono">{EZCASH_MERCHANT_NUMBER}</strong></li>
            </ul>
          </div>

          {/* Support Contacts */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              24/7 Support
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-[#F5C400]" />
                <span>WhatsApp: +94 75 850 0536</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-[#F5C400]" />
                <span>support@topuphub.lk</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Official Game Credits</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} TopUp Hub Lanka. All gaming trademarks and copyrights belong to their respective owners.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Privacy Policy</span>
            <span>·</span>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Refund Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
