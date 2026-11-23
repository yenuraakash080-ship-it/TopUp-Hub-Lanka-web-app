import React, { useState, useRef, useEffect } from 'react';
import { UserAccount } from '../types';
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  Home,
  Gamepad2,
  Compass,
  Zap,
  History,
  Headphones,
  Coins,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserAccount | null;
  isDarkMode: boolean;
  selectedLanguage: 'EN' | 'SI' | 'TA';
  onToggleTheme: () => void;
  onChangeLanguage: (lang: 'EN' | 'SI' | 'TA') => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onNavigateHome: () => void;
  onNavigateGames: () => void;
  onNavigateRegionGames: () => void;
  onNavigateHowItWorks: () => void;
  onOpenOrderHistory: () => void;
  onOpenSupport: () => void;
}

const LANGUAGE_LABELS: Record<'EN' | 'SI' | 'TA', string> = {
  EN: 'EN',
  SI: 'සිංහල',
  TA: 'தமிழ்',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isDarkMode,
  selectedLanguage,
  onToggleTheme,
  onChangeLanguage,
  onOpenAuth,
  onOpenProfile,
  onNavigateHome,
  onNavigateGames,
  onNavigateRegionGames,
  onNavigateHowItWorks,
  onOpenOrderHistory,
  onOpenSupport,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navItems = [
    { label: 'Home', icon: Home, action: onNavigateHome },
    { label: 'Games', icon: Gamepad2, action: onNavigateGames },
    { label: 'Region Games', icon: Compass, action: onNavigateRegionGames },
    { label: 'How It Works', icon: Zap, action: onNavigateHowItWorks },
    { label: 'Order History', icon: History, action: onOpenOrderHistory },
    { label: 'Support', icon: Headphones, action: onOpenSupport },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B0B0D]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16 gap-2">
          {/* LEFT: Hamburger Menu Drawer Button + Language Selector Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 justify-start min-w-0">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen((prev) => !prev);
                setIsLangOpen(false);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-[#F5C400] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              aria-label="Open navigation menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsLangOpen((prev) => !prev);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-[#141416] hover:bg-slate-200 dark:hover:bg-[#1E1E22] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                aria-label="Select language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-[#F5C400] shrink-0" />
                <span>{LANGUAGE_LABELS[selectedLanguage]}</span>
                <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              </button>

              {isLangOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#F5C400]/30 rounded-xl shadow-2xl py-1 z-50">
                  {[
                    { code: 'EN' as const, label: 'English (EN)' },
                    { code: 'SI' as const, label: 'සිංහල (Sinhala)' },
                    { code: 'TA' as const, label: 'தமிழ் (Tamil)' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onChangeLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                        selectedLanguage === lang.code
                          ? 'text-amber-600 dark:text-[#F5C400] bg-amber-50 dark:bg-[#F5C400]/10 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {selectedLanguage === lang.code && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Bold Geometric Store Branding */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-center font-black italic uppercase tracking-wider text-sm sm:text-lg md:text-xl text-amber-600 dark:text-[#F5C400] hover:text-amber-500 dark:hover:text-[#FFB800] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              TOPUP HUB LANKA
            </button>
          </div>

          {/* RIGHT: Theme Toggle Icon + Amber Login / Account Button */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#141416] hover:bg-slate-200 dark:hover:bg-[#1E1E22] border border-slate-200 dark:border-white/10 flex items-center justify-center text-amber-600 dark:text-[#F5C400] transition-colors cursor-pointer shrink-0"
              aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDarkMode ? 'Light Theme' : 'Dark Theme'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser?.isLoggedIn ? (
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-[#141416] dark:bg-[#141416] border border-[#F5C400]/60 hover:border-[#FFB800] text-white transition-all cursor-pointer shrink-0"
                title="Account & Reward Coins"
              >
                <span className="w-7 h-7 rounded-full bg-[#F5C400] text-[#0B0B0D] font-black text-xs flex items-center justify-center">
                  {currentUser.avatarSeed}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#F5C400] font-mono tabular-nums">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{currentUser.rewardCoins ?? 0}</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 sm:px-5 py-2 rounded-xl bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D] text-xs sm:text-sm font-black tracking-wide shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hamburger Navigation Drawer */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] px-4 py-4 shadow-xl">
          <nav
            aria-label="Primary Drawer Navigation"
            className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    item.action();
                  }}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0B0D] hover:bg-amber-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-[#F5C400]/50 flex items-center gap-2 font-bold text-slate-900 dark:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 text-amber-600 dark:text-[#F5C400] shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
