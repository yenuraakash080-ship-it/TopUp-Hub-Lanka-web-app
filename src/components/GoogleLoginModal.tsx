import React, { useState } from 'react';
import { UserAccount } from '../types';
import { googleSignIn } from '../lib/firebase';
import { isValidEmailAddress, normalizeEmail } from '../services/userStorage';
import {
  X,
  ShieldCheck,
  Coins,
  LogOut,
  Wallet,
  History,
  Sparkles,
  Mail,
  HardDrive,
  ArrowRight,
} from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  walletBalanceLKR?: number;
  hasWorkspaceToken?: boolean;
  onGoogleConnected?: (accessToken: string | null) => void;
  onLogin: (user: UserAccount) => void;
  onLogout?: () => void;
  onOpenWallet?: () => void;
  onOpenOrders?: () => void;
  isMandatory?: boolean;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  walletBalanceLKR = 0,
  hasWorkspaceToken = false,
  onGoogleConnected,
  onLogin,
  onLogout,
  onOpenWallet,
  onOpenOrders,
  isMandatory = false,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { user, accessToken } = await googleSignIn();
      const email = normalizeEmail(user.email || '');
      if (!email) {
        setError('Google account did not provide an email address.');
        return;
      }
      const name = user.displayName || email.split('@')[0] || 'Player';
      const account: UserAccount = {
        uid: user.uid,
        email,
        name,
        avatarSeed: (name[0] || email[0] || 'P').toUpperCase(),
        avatarUrl: user.photoURL || undefined,
        isLoggedIn: true,
        authProvider: 'google',
        rewardCoins: 0,
        role: 'customer',
      };
      onGoogleConnected?.(accessToken);
      onLogin(account);
      setEmailInput('');
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Google sign-in was cancelled or failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = normalizeEmail(emailInput);
    if (!cleanEmail || !isValidEmailAddress(cleanEmail)) {
      setError('Please enter a valid email address to sign in.');
      return;
    }

    const name = cleanEmail.split('@')[0] || 'Player';
    const account: UserAccount = {
      email: cleanEmail,
      name,
      avatarSeed: (name[0] || cleanEmail[0] || 'P').toUpperCase(),
      isLoggedIn: true,
      authProvider: 'email',
      rewardCoins: 0,
      role: 'customer',
    };

    onGoogleConnected?.(null);
    onLogin(account);
    setEmailInput('');
    onClose();
  };

  if (currentUser?.isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#F5C400]/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden text-slate-900 dark:text-slate-100">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-5">
            <div className="flex items-center gap-3">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-full border-2 border-[#F5C400] object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#F5C400] text-[#0B0B0D] flex items-center justify-center font-black text-base shadow">
                  {currentUser.avatarSeed}
                </div>
              )}
              <div>
                <h3 className="text-base font-extrabold">{currentUser.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              aria-label="Close account modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-[#0B0B0D] border border-amber-200 dark:border-[#F5C400]/30">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-700 dark:text-[#F5C400]">
                <Coins className="w-3.5 h-3.5" />
                <span>Reward Coins</span>
              </div>
              <p className="text-xl font-black font-mono tabular-nums mt-1">
                {(currentUser.rewardCoins ?? 0).toLocaleString()} Coins
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Earn 2% back per top-up</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                <span>EZ Wallet</span>
              </div>
              <p className="text-xl font-black font-mono tabular-nums mt-1">
                Rs. {walletBalanceLKR.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {onOpenWallet && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWallet();
                  }}
                  className="text-[11px] font-bold text-amber-600 dark:text-[#F5C400] hover:underline mt-0.5 cursor-pointer"
                >
                  Recharge Wallet →
                </button>
              )}
            </div>
          </div>

          {!hasWorkspaceToken && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-[#0B0B0D] border border-blue-200 dark:border-blue-500/30 space-y-2">
              <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  Connect Google for this session to email receipts via Gmail or back up PNGs to Google Drive.
                </span>
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </div>
          )}

          {error && (
            <p className="mb-3 text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              {error}
            </p>
          )}

          <div className="space-y-2.5">
            {onOpenOrders && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#0B0B0D] hover:bg-slate-200 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <History className="w-4 h-4 text-amber-500" />
                <span>View Order History, Gmail &amp; Drive Receipts</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#F5C400]/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-5">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">Sign In / Login</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access your personal eZ Hub Wallet and Order History
            </p>
          </div>

          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close login modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && (
          <p className="mb-4 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/25">
            {error}
          </p>
        )}

        {/* Option A: Official Material "Continue with Google" Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="gsi-material-button w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#1F1F1F] border border-slate-300 shadow-md transition-all cursor-pointer active:scale-99 disabled:opacity-60 flex items-center justify-center gap-3 font-semibold text-sm"
        >
          <div className="gsi-material-button-icon w-5 h-5 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
          </div>
          <span className="gsi-material-button-contents">
            {isLoading ? 'Connecting with Google...' : 'Continue with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            or sign in with email
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Option B: Email Address Direct Sign-In */}
        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <div>
            <label
              htmlFor="login-email-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email-input"
                type="email"
                required
                autoComplete="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your email address"
                className="w-full bg-slate-50 dark:bg-[#0B0B0D] border border-slate-300 dark:border-white/15 focus:border-[#F5C400] rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D] font-extrabold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-99 disabled:opacity-60"
          >
            <span>Sign In with Email</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Strict per-account wallet &amp; order isolation · New accounts start at Rs. 0.00</span>
        </div>
      </div>
    </div>
  );
};
