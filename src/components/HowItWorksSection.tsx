import React from 'react';
import { Zap, Gamepad2, CreditCard, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Select Game & Enter Player ID',
      description:
        'Pick your game from our local or international catalog, enter and verify your Player ID/UID in seconds, and add diamond or pass packs.',
      icon: Gamepad2,
    },
    {
      stepNumber: '02',
      title: 'Pay Securely Your Way',
      description:
        'Checkout with VISA / MasterCard, LankaQR, iPay, Web EZ Wallet, Bank / ATM Deposit, or Binance Pay with transparent LKR & USDT totals.',
      icon: CreditCard,
    },
    {
      stepNumber: '03',
      title: 'Instant Automated Delivery',
      description:
        'Your order is processed automatically within seconds. Track delivery status live and download your verified receipt image immediately.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section
      id="how-it-works-section"
      className="scroll-mt-20 bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl transition-colors"
    >
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-[#F5C400]/15 border border-amber-200 dark:border-[#F5C400]/35 text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-[#F5C400]">
          <Zap className="w-3.5 h-3.5" />
          <span>FAST & EFFORTLESS TOP-UP</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          HOW IT WORKS: SIMPLE 3 STEPS
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Experience the fastest official top-up workflow in Sri Lanka. Zero registration required, 100% automated delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.stepNumber}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-[#F5C400]/15 border border-amber-200 dark:border-[#F5C400]/35 flex items-center justify-center text-amber-700 dark:text-[#F5C400]">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black font-mono text-slate-400 dark:text-slate-500">
                  STEP {step.stepNumber}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {step.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
