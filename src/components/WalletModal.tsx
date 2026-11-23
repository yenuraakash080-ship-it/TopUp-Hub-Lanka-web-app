import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  Wallet,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  AlertTriangle,
  Gift,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'purchase' | 'redeem' | 'bonus';
  title: string;
  amountLKR: number;
  date: string;
  status: 'completed' | 'processing' | 'failed';
  method: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  walletBalanceLKR: number;
  onUpdateWalletBalance: (newBalance: number) => void;
  transactions: WalletTransaction[];
  onAddTransaction: (txn: WalletTransaction) => void;
}

const LKR_PER_USDT = 300.0;

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  walletBalanceLKR,
  onUpdateWalletBalance,
  transactions,
  onAddTransaction,
}) => {
  // Tabs: 'ezcash' | 'binance' | 'redeem' | 'history'
  const [activeTab, setActiveTab] = useState<'ezcash' | 'binance' | 'redeem' | 'history'>('ezcash');

  // EZ Cash Form State
  const [ezCashAmount, setEzCashAmount] = useState('1000');
  const [ezCashRnNumber, setEzCashRnNumber] = useState('');
  const [ezCashSenderPhone, setEzCashSenderPhone] = useState('');
  const [copiedEzCash, setCopiedEzCash] = useState(false);
  const [ezCashMessage, setEzCashMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Redeem Gift Code Form State
  const [giftCode, setGiftCode] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const balanceUSDT = walletBalanceLKR / LKR_PER_USDT;

  // Handle EZ Cash Deposit Submission
  const handleEzCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEzCashMessage(null);

    const amountNum = parseFloat(ezCashAmount);
    if (!amountNum || amountNum < 100) {
      setEzCashMessage({ text: 'Minimum deposit amount is Rs. 100.00', type: 'error' });
      return;
    }

    const cleanRn = ezCashRnNumber.trim().toUpperCase();
    if (!cleanRn || cleanRn.length < 8) {
      setEzCashMessage({
        text: 'Please enter a valid Transaction RN Number from your eZ Cash SMS.',
        type: 'error',
      });
      return;
    }

    const cleanSender = ezCashSenderPhone.trim();
    if (!cleanSender || cleanSender.length < 9) {
      setEzCashMessage({ text: 'Please enter your eZ Cash mobile number.', type: 'error' });
      return;
    }

    const alreadyClaimed = transactions.some((t) =>
      t.method.toUpperCase().includes(cleanRn)
    );
    if (alreadyClaimed) {
      setEzCashMessage({
        text: `RN Number ${cleanRn} has already been claimed to your eZ Hub Wallet.`,
        type: 'error',
      });
      return;
    }

    // Process direct reload claim to eZ Hub Wallet
    const newTxn: WalletTransaction = {
      id: `TXN-EZ-${Date.now().toString().slice(-6)}`,
      type: 'deposit',
      title: 'eZ Cash Direct Reload Claim',
      amountLKR: amountNum,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      method: `eZ Cash ${cleanSender} · ${cleanRn}`,
    };

    onUpdateWalletBalance(walletBalanceLKR + amountNum);
    onAddTransaction(newTxn);

    setEzCashMessage({
      text: `Claimed! Rs. ${amountNum.toFixed(2)} added to your eZ Hub Wallet Balance.`,
      type: 'success',
    });
    setEzCashRnNumber('');
    setEzCashSenderPhone('');
  };

  // Handle Gift Code Redeem
  const handleRedeemGiftCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemMessage(null);

    const code = giftCode.trim().toUpperCase();
    if (!code) {
      setRedeemMessage({ text: 'Please enter a valid gift code.', type: 'error' });
      return;
    }

    let creditAmount = 500;
    if (code.includes('1000')) creditAmount = 1000;
    else if (code.includes('250')) creditAmount = 250;
    else if (code.includes('VIP')) creditAmount = 2500;

    const newTxn: WalletTransaction = {
      id: `TXN-GIFT-${Date.now().toString().slice(-6)}`,
      type: 'redeem',
      title: `Gift Code (${code})`,
      amountLKR: creditAmount,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      method: 'Gift Voucher',
    };

    onUpdateWalletBalance(walletBalanceLKR + creditAmount);
    onAddTransaction(newTxn);

    setRedeemMessage({
      text: `Gift Code Redeemed! Rs. ${creditAmount.toFixed(2)} added to your wallet balance.`,
      type: 'success',
    });
    setGiftCode('');
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative text-slate-100">
        {/* Glow Accent */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>TopUp Hub Lanka Wallet</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Instant Gaming Checkout
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser?.isLoggedIn ? (
                  <>
                    Signed in as:{' '}
                    <span className="text-slate-200 font-mono">{currentUser.email}</span>
                  </>
                ) : (
                  <span>Sign in to access your personal eZ Hub Wallet</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Balance Card */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider">Total Balance (LKR)</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                Rs. {walletBalanceLKR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3" />
                <span>Ready for 1-click package purchases</span>
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider">Equivalent Balance (USDT)</span>
                <span className="text-[10px] font-mono text-cyan-400">1 USDT ≈ 300 LKR</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight">
                {balanceUSDT.toFixed(2)} USDT
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Binance Pay is currently unavailable
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tab Buttons */}
        <div className="flex items-center gap-2 p-3 bg-slate-950 border-b border-slate-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ezcash')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ezcash'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>eZ Cash Direct Reload</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('binance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'binance'
                ? 'bg-slate-700 text-white border border-slate-500'
                : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>Binance Pay</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-black uppercase">
              Unavailable
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('redeem')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'redeem'
                ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Redeem Gift Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recent Activity ({transactions.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {!currentUser?.isLoggedIn ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <Wallet className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-white">Sign In Required</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Each user&apos;s eZ Hub Wallet balance and transaction history are strictly private to their signed-in email address.
              </p>
            </div>
          ) : (
            <>
          {/* TAB 1: EZ CASH DEPOSIT SCREEN */}
          {activeTab === 'ezcash' && (
            <div className="space-y-4">
              {/* Mandatory Notice */}
              <div className="p-3.5 bg-rose-500/10 border-2 border-rose-500/40 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-200">
                  <p className="font-black uppercase tracking-wider text-rose-300">
                    MANDATORY WARNING INSTRUCTION:
                  </p>
                  <p className="mt-0.5 font-medium leading-relaxed">
                    <strong>DO NOT</strong> send using Bank Apps / Cargills / Keells / Pay & Go.
                    Only send via direct <strong>eZ Cash USSD (#111#)</strong> or the official <strong>eZ Cash Mobile App</strong>.
                  </p>
                </div>
              </div>

              {/* Store Number Banner */}
              <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-mono">
                    TopUp Hub Lanka Official Store Number:
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-wider">
                    0758500536
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Merchant Name: <strong className="text-slate-200">TopUp Hub Lanka</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard('0758500536', setCopiedEzCash)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedEzCash
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {copiedEzCash ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedEzCash ? 'Copied Number!' : 'Copy 0758500536'}</span>
                </button>
              </div>

              {/* Deposit Form */}
              <form onSubmit={handleEzCashSubmit} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reload Amount (LKR)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      required
                      value={ezCashAmount}
                      onChange={(e) => setEzCashAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      My eZ Cash Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={ezCashSenderPhone}
                      onChange={(e) => setEzCashSenderPhone(e.target.value)}
                      placeholder="0771234567"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      RN Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ezCashRnNumber}
                      onChange={(e) => setEzCashRnNumber(e.target.value.toUpperCase())}
                      placeholder="RN20261108948123"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-white font-mono uppercase tracking-wider outline-none"
                    />
                  </div>
                </div>

                {ezCashMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      ezCashMessage.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {ezCashMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{ezCashMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-98"
                >
                  Claim Hub Wallet
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: BINANCE PAY SCREEN (CURRENTLY UNAVAILABLE) */}
          {activeTab === 'binance' && (
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider">
                Unavailable
              </div>
              <h4 className="text-base font-black text-white">
                Binance Pay is Currently Unavailable
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Binance Pay deposits are temporarily unavailable. Please use{' '}
                <strong className="text-amber-400">eZ Cash Direct Reload</strong> to claim funds directly to your eZ Hub Wallet.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('ezcash')}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer transition-colors"
              >
                Use eZ Cash Direct Reload →
              </button>
            </div>
          )}

          {/* TAB 3: GIFT CODE REDEEM SCREEN */}
          {activeTab === 'redeem' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span>Redeem TopUp Hub Lanka Voucher or Gift Card</span>
                </span>
                <p className="text-xs text-slate-400">
                  Enter your 12 or 16-character promo code in the format <code className="text-amber-300 font-mono">XXXX-XXXX-XXXX</code>.
                </p>
              </div>

              <form onSubmit={handleRedeemGiftCode} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                    placeholder="TOPUP-LANKA-500"
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl py-2.5 px-4 text-sm text-white font-mono uppercase tracking-widest outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    REDEEM NOW
                  </button>
                </div>

                {/* Sample Promo Codes */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                  <span className="text-[11px] font-mono text-slate-500">Quick Test Gift Codes:</span>
                  {['TOPUP-LANKA-500', 'FREEFIRE-1000', 'VIP-PASS-2500'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setGiftCode(code)}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 font-mono text-[11px] cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>

                {redeemMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      redeemMessage.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {redeemMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{redeemMessage.text}</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 4: RECENT ACTIVITY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Transaction History ({transactions.length} Records)
              </h4>

              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No transactions found yet. Reload balance to see your history.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            t.type === 'deposit' || t.type === 'redeem'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {t.type === 'deposit' || t.type === 'redeem' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{t.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {t.method} · {t.date}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            t.type === 'deposit' || t.type === 'redeem' ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {t.type === 'deposit' || t.type === 'redeem' ? '+' : '-'}Rs. {t.amountLKR.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase">{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit Encrypted Lanka Gaming Wallet</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
