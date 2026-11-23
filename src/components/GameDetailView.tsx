import React, { useState, useEffect, useRef } from 'react';
import {
  CartItem,
  GameItem,
  PackageCategory,
  TopUpPackage,
  VerifiedPlayer,
} from '../types';
import { TOP_UP_PACKAGES } from '../data/packages';
import { getPackagesForGame } from '../data/games';
import { lookupVerifiedPlayer } from '../services/playerVerification';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserCheck,
  X,
  History,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

interface UidHistoryEntry {
  uid: string;
  ign: string;
  gameId: string;
  zoneId?: string;
  level: number;
  server: string;
}

interface GameDetailViewProps {
  game: GameItem;
  verifiedPlayer: VerifiedPlayer | null;
  onVerifyPlayer: (player: VerifiedPlayer | null) => void;
  cartItems: CartItem[];
  onSetPackageQuantity: (game: GameItem, pkg: TopUpPackage, newQty: number) => void;
  onOpenCart: () => void;
  onProceedToPayment: () => void;
  onBackToGames: () => void;
  currency: 'LKR' | 'USDT';
  onChangeCurrency: (curr: 'LKR' | 'USDT') => void;
}

const UID_HISTORY_KEY = 'topuphub_uid_history_v2';
const LKR_PER_USDT = 300.0;

const get30DayAvgPrice = (pkg: TopUpPackage): number => {
  if (typeof pkg.avg30DayPriceLKR === 'number') return pkg.avg30DayPriceLKR;
  const seed = pkg.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const multiplier = 1.05 + (seed % 4) * 0.01;
  return Math.round((pkg.priceLKR * multiplier) / 5) * 5;
};

export const GameDetailView: React.FC<GameDetailViewProps> = ({
  game,
  verifiedPlayer,
  onVerifyPlayer,
  cartItems,
  onSetPackageQuantity,
  onOpenCart,
  onProceedToPayment,
  onBackToGames,
  currency,
  onChangeCurrency,
}) => {
  const [uidInput, setUidInput] = useState(verifiedPlayer?.uid || '');
  const [zoneInput, setZoneInput] = useState(verifiedPlayer?.zoneId || '2940');
  const [serverInput, setServerInput] = useState('Asia');
  const [uidError, setUidError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifiedPopup, setShowVerifiedPopup] = useState<VerifiedPlayer | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [uidHistory, setUidHistory] = useState<UidHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(UID_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        uid: '14767436314',
        ign: 'Alextechbro',
        gameId: 'freefire',
        level: 65,
        server: 'Singapore / LK',
      },
    ];
  });

  const [activeCategory, setActiveCategory] = useState<PackageCategory | 'all'>('all');
  const [infoPackage, setInfoPackage] = useState<TopUpPackage | null>(null);
  const [hoveredPriceId, setHoveredPriceId] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(UID_HISTORY_KEY, JSON.stringify(uidHistory));
  }, [uidHistory]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    setUidError(null);
    setActiveCategory('all');
    if (verifiedPlayer && verifiedPlayer.gameId === game.id) {
      setUidInput(verifiedPlayer.uid);
    } else {
      setUidInput('');
    }
  }, [game.id, verifiedPlayer]);

  const gameHistory = uidHistory.filter(
    (entry) => entry.gameId === game.id || (game.id.startsWith('freefire') && entry.gameId.startsWith('freefire'))
  );
  const visibleHistory = gameHistory.length > 0 ? gameHistory : uidHistory;

  const handlePasteUid = async () => {
    setUidError(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          setUidInput(clipText.trim());
          return;
        }
      }
    } catch {
      // Clipboard blocked in sandbox: fall through to sample ID
    }
    setUidInput(game.sampleUid);
  };

  const runVerification = (targetUid: string, targetZone?: string) => {
    const clean = targetUid.trim();
    if (!clean || clean.length < 4) {
      setUidError('Please enter a valid Player ID (minimum 4 characters).');
      return;
    }
    if (game.hasZoneId && (!targetZone || !targetZone.trim())) {
      setUidError('Please enter your Zone ID.');
      return;
    }

    setUidError(null);
    setIsVerifying(true);

    setTimeout(() => {
      const resolved = lookupVerifiedPlayer(
        game,
        clean,
        game.hasZoneId ? targetZone : game.hasServerSelect ? serverInput : undefined
      );
      onVerifyPlayer(resolved);
      setShowVerifiedPopup(resolved);
      setIsVerifying(false);

      setUidHistory((prev) => {
        const filtered = prev.filter((item) => !(item.uid === resolved.uid && item.gameId === game.id));
        return [
          {
            uid: resolved.uid,
            ign: resolved.ign,
            gameId: game.id,
            zoneId: resolved.zoneId,
            level: resolved.level,
            server: resolved.server,
          },
          ...filtered,
        ].slice(0, 6);
      });
    }, 350);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runVerification(uidInput, zoneInput);
  };

  const packages = getPackagesForGame(game, TOP_UP_PACKAGES);
  const filteredPackages =
    activeCategory === 'all' ? packages : packages.filter((p) => p.category === activeCategory);

  const getCartQty = (pkgId: string) =>
    cartItems.find((item) => item.package.id === pkgId)?.quantity || 0;

  const formatPrice = (priceLKR: number) => {
    if (currency === 'USDT') {
      return `${(priceLKR / LKR_PER_USDT).toFixed(2)} USDT`;
    }
    return `Rs. ${priceLKR.toFixed(2)}`;
  };

  const cartTotalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotalLKR = cartItems.reduce(
    (sum, item) => sum + item.package.priceLKR * item.quantity,
    0
  );

  const isPlayerVerifiedForGame = verifiedPlayer && verifiedPlayer.gameId === game.id;

  return (
    <div className="space-y-6 pb-20">
      {/* Account Verified Confirmation Modal */}
      {showVerifiedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#141416] border border-emerald-500/40 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Account Verified!
              </h3>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {showVerifiedPopup.ign}
              </p>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                ID: {showVerifiedPopup.uid}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Server: {showVerifiedPopup.server} · Level {showVerifiedPopup.level}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowVerifiedPopup(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Continue to Packages
            </button>
          </div>
        </div>
      )}

      {/* Package Info & 30-Day Price History Modal */}
      {infoPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <h4 className="font-bold text-sm">{infoPackage.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setInfoPackage(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                aria-label="Close package info"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {infoPackage.description}
              </p>

              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10">
                  <span className="text-slate-400 block">Delivery</span>
                  <span className="font-bold text-emerald-500">5–15 Secs</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10">
                  <span className="text-slate-400 block">Price</span>
                  <span className="font-bold text-amber-600 dark:text-[#F5C400]">
                    {formatPrice(infoPackage.priceLKR)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10">
                  <span className="text-slate-400 block">30d Avg</span>
                  <span className="font-bold text-blue-500">
                    {formatPrice(get30DayAvgPrice(infoPackage))}
                  </span>
                </div>
              </div>

              {infoPackage.features && (
                <ul className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10">
                  {infoPackage.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}

              {infoPackage.category === 'membership' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-amber-700 dark:text-amber-300 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Limit 1 active membership cycle per player UID. Minimum in-game Level 10 required.
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onSetPackageQuantity(game, infoPackage, getCartQty(infoPackage.id) + 1);
                setInfoPackage(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D] text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Add to Cart ({formatPrice(infoPackage.priceLKR)})
            </button>
          </div>
        </div>
      )}

      {/* Back Button + Game Detail Header Banner */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBackToGames}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-[#F5C400] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Games</span>
        </button>

        <div className="relative rounded-2xl overflow-hidden bg-[#141416] border border-slate-200 dark:border-white/10 p-5 sm:p-7 shadow-xl">
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <img
              src={game.imageSrc}
              alt=""
              className="w-full h-full object-cover object-center blur-xs"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D] via-[#0B0B0D]/90 to-[#0B0B0D]/70 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-[#F5C400]/60 shrink-0 shadow-lg bg-[#0B0B0D]">
              <img
                src={game.imageSrc}
                alt={game.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                {game.name} Top Up
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#F5C400] flex items-center gap-2 flex-wrap">
                <span>Official Distributor</span>
                <span aria-hidden="true">|</span>
                <span className="text-slate-300">Trusted by thousands</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {game.publisher} · Instant {game.currencyName} Delivery · {game.region || 'Global'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Verify Your Player ID */}
      <div
        className={`rounded-2xl p-5 sm:p-6 border shadow-lg transition-colors ${
          isPlayerVerifiedForGame
            ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-500/50'
            : 'bg-white dark:bg-[#141416] border-slate-200 dark:border-white/10'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                isPlayerVerifiedForGame
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#F5C400] text-[#0B0B0D]'
              }`}
            >
              {isPlayerVerifiedForGame ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Step 1 — Verify Your Player ID
            </h2>
          </div>

          {isPlayerVerifiedForGame && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>VERIFIED</span>
            </span>
          )}
        </div>

        {isPlayerVerifiedForGame ? (
          /* Verified Green State Card */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#0B0B0D]/80 border border-emerald-500/40">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {verifiedPlayer.ign}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Lv. {verifiedPlayer.level} · {verifiedPlayer.server}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  ID: {verifiedPlayer.uid}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onVerifyPlayer(null)}
              className="px-4 py-2 rounded-xl border-2 border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-extrabold transition-colors cursor-pointer self-start sm:self-auto"
            >
              Change
            </button>
          </div>
        ) : (
          /* Unverified Player ID Input + History Dropdown + Paste + Blue Verify Button */
          <form onSubmit={handleVerifySubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div ref={historyRef} className="relative flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={uidInput}
                    onChange={(e) => {
                      setUidInput(e.target.value);
                      setUidError(null);
                    }}
                    placeholder={game.uidPlaceholder || 'Enter your Player ID'}
                    className="w-full bg-slate-50 dark:bg-[#0B0B0D] border border-slate-300 dark:border-white/15 focus:border-blue-500 rounded-xl py-3 pl-3.5 pr-20 text-sm text-slate-900 dark:text-white placeholder-slate-400 font-mono outline-none"
                  />

                  {/* Saved UID History Dropdown Trigger (e.g., 1 v) */}
                  <button
                    type="button"
                    onClick={() => setShowHistoryDropdown((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-200 dark:bg-[#1E1E22] hover:bg-slate-300 dark:hover:bg-white/15 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                    title="Saved Player ID history"
                  >
                    <span className="font-mono">{visibleHistory.length}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Paste Button */}
                <button
                  type="button"
                  onClick={handlePasteUid}
                  className="px-3.5 py-3 rounded-xl bg-slate-100 dark:bg-[#0B0B0D] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/15 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Paste Player ID or fill sample ID"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-blue-500" />
                  <span>Paste</span>
                </button>

                {/* Dropdown Menu for Saved Player IDs */}
                {showHistoryDropdown && (
                  <div className="absolute left-0 right-20 top-full mt-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#F5C400]/30 rounded-xl shadow-2xl p-2 z-30 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Saved Player IDs</span>
                      <span>Tap to reuse</span>
                    </div>
                    {visibleHistory.map((item) => (
                      <button
                        key={`${item.gameId}-${item.uid}`}
                        type="button"
                        onClick={() => {
                          setUidInput(item.uid);
                          if (item.zoneId) setZoneInput(item.zoneId);
                          setShowHistoryDropdown(false);
                          runVerification(item.uid, item.zoneId);
                        }}
                        className="w-full p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between gap-2 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[#F5C400] text-[#0B0B0D] font-black text-xs flex items-center justify-center shrink-0">
                            {item.ign[0]?.toUpperCase() || 'P'}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.ign}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              ID: {item.uid}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500">Use →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {game.hasZoneId && (
                <input
                  type="text"
                  value={zoneInput}
                  onChange={(e) => setZoneInput(e.target.value)}
                  placeholder="Zone ID"
                  className="sm:w-28 bg-slate-50 dark:bg-[#0B0B0D] border border-slate-300 dark:border-white/15 focus:border-blue-500 rounded-xl py-3 px-3 text-sm text-slate-900 dark:text-white font-mono text-center outline-none"
                />
              )}

              {game.hasServerSelect && (
                <select
                  value={serverInput}
                  onChange={(e) => setServerInput(e.target.value)}
                  className="sm:w-36 bg-slate-50 dark:bg-[#0B0B0D] border border-slate-300 dark:border-white/15 focus:border-blue-500 rounded-xl py-3 px-3 text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="Asia">Asia Server</option>
                  <option value="America">America</option>
                  <option value="Europe">Europe</option>
                  <option value="TW/HK/MO">TW, HK, MO</option>
                </select>
              )}
            </div>

            {uidError && (
              <p className="text-xs text-rose-500 font-semibold">{uidError}</p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold shadow-lg shadow-blue-600/20 transition-all cursor-pointer active:scale-99 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying Player ID...' : 'Verify'}</span>
            </button>

            <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{game.uidHelper}</span>
              <button
                type="button"
                onClick={() => {
                  setUidInput(game.sampleUid);
                  runVerification(game.sampleUid, zoneInput);
                }}
                className="font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Try sample ID: {game.sampleUid}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* STEP 2: Select Diamond / Top-Up Packages */}
      <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#F5C400] text-[#0B0B0D] flex items-center justify-center text-xs font-black">
              2
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Step 2 — Select {game.currencyName} Packages
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tap + to add items directly to Your Cart
              </p>
            </div>
          </div>

          {/* Currency Toggle: LKR (Rs) / USDT */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0B0B0D] rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => onChangeCurrency('LKR')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  currency === 'LKR'
                    ? 'bg-[#F5C400] text-[#0B0B0D]'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                LKR (Rs)
              </button>
              <button
                type="button"
                onClick={() => onChangeCurrency('USDT')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  currency === 'USDT'
                    ? 'bg-[#F5C400] text-[#0B0B0D]'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                USDT
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { id: 'all', label: 'All Packs' },
              { id: 'regular', label: game.currencyName },
              { id: 'bonus', label: 'Bonus Packs' },
              { id: 'membership', label: 'Passes & Memberships' },
            ] as const
          ).map((tab) => {
            const count =
              tab.id === 'all'
                ? packages.length
                : packages.filter((p) => p.category === tab.id).length;
            if (tab.id !== 'all' && count === 0) return null;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-[#F5C400] text-[#0B0B0D]'
                    : 'bg-slate-100 dark:bg-[#0B0B0D] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* 2-Column Package Grid Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filteredPackages.map((pkg) => {
            const qty = getCartQty(pkg.id);
            const avg30Day = get30DayAvgPrice(pkg);
            const savingsPct =
              avg30Day > pkg.priceLKR ? Math.round(((avg30Day - pkg.priceLKR) / avg30Day) * 100) : 0;

            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col justify-between ${
                  qty > 0
                    ? 'bg-amber-50/70 dark:bg-[#1B1A14] border-[#F5C400] ring-2 ring-[#F5C400]/25 shadow-lg'
                    : 'bg-slate-50 dark:bg-[#0B0B0D] border-slate-200 dark:border-white/10 hover:border-[#F5C400]/50'
                }`}
              >
                {/* Top Row: (i) Info Button on top-left + 30d Avg Price History Trigger */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setInfoPackage(pkg)}
                    className="w-7 h-7 rounded-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-blue-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    title="Package details & 30-day average price"
                    aria-label={`Info for ${pkg.name}`}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredPriceId(pkg.id)}
                    onMouseLeave={() => setHoveredPriceId(null)}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setHoveredPriceId((curr) => (curr === pkg.id ? null : pkg.id))
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-[#F5C400] cursor-pointer"
                    >
                      <History className="w-3 h-3 text-amber-500" />
                      <span className="hidden xs:inline">30d Avg</span>
                    </button>

                    {hoveredPriceId === pkg.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 p-2.5 rounded-xl bg-slate-900 border border-[#F5C400]/40 text-white text-[11px] shadow-2xl z-30 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">30-Day Avg:</span>
                          <span className="font-mono font-bold">{formatPrice(avg30Day)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current:</span>
                          <span className="font-mono font-bold text-[#F5C400]">
                            {formatPrice(pkg.priceLKR)}
                          </span>
                        </div>
                        {savingsPct > 0 && (
                          <div className="flex items-center gap-1 text-emerald-400 font-semibold pt-0.5 border-t border-white/10">
                            <TrendingDown className="w-3 h-3" />
                            <span>{savingsPct}% below 30d avg</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Package Artwork + Title + Price */}
                <div className="flex flex-col items-center text-center space-y-2 my-1">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/10 p-1.5 flex items-center justify-center overflow-hidden">
                    {pkg.imageSrc ? (
                      <img
                        src={pkg.imageSrc}
                        alt={pkg.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl">{game.currencyIcon}</span>
                    )}
                  </div>

                  <div className="space-y-0.5 w-full">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2">
                      {pkg.name}
                    </h3>
                    {pkg.bonusDiamonds && (
                      <p className="text-[10px] font-bold text-amber-600 dark:text-[#F5C400] flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>+{pkg.bonusDiamonds} Bonus</span>
                      </p>
                    )}
                    <p className="text-sm sm:text-base font-black font-mono tabular-nums text-amber-600 dark:text-[#F5C400] pt-0.5">
                      {formatPrice(pkg.priceLKR)}
                    </p>
                  </div>
                </div>

                {/* Bottom Stepper Controls: [- count +] */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 bg-white dark:bg-[#141416] rounded-xl p-1 border">
                  <button
                    type="button"
                    disabled={qty === 0}
                    onClick={() => onSetPackageQuantity(game, pkg, Math.max(0, qty - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-[#0B0B0D] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer transition-colors"
                    aria-label={`Decrease quantity for ${pkg.name}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white min-w-[20px] text-center">
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSetPackageQuantity(game, pkg, qty + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D] font-black cursor-pointer transition-colors"
                    aria-label={`Add ${pkg.name} to cart`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Quick Checkout Summary Bar when items are added */}
      {cartTotalCount > 0 && (
        <div className="bg-[#141416] border border-[#F5C400]/50 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5C400] text-[#0B0B0D] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">
                {cartTotalCount} {cartTotalCount === 1 ? 'Item' : 'Items'} Selected
              </p>
              <p className="text-base font-black font-mono text-[#F5C400] tabular-nums">
                {formatPrice(cartSubtotalLKR)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCart}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold cursor-pointer transition-all"
            >
              View Cart ({cartTotalCount})
            </button>
            <button
              type="button"
              onClick={onProceedToPayment}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D] text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              Proceed to Payment →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
