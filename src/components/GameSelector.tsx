import React, { useState } from 'react';
import { GameItem } from '../types';
import { FEATURED_GAMES, ACTIVE_CATALOG_GAMES } from '../data/games';
import {
  Globe,
  ArrowRight,
  Search,
  Zap,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

interface GameSelectorProps {
  selectedGame: GameItem | null;
  catalogMode: 'featured' | 'active';
  onChangeCatalogMode: (mode: 'featured' | 'active') => void;
  onSelectGame: (game: GameItem) => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  selectedGame,
  catalogMode,
  onChangeCatalogMode,
  onSelectGame,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const gamesList = catalogMode === 'featured' ? FEATURED_GAMES : ACTIVE_CATALOG_GAMES;

  const filteredGames = gamesList.filter((game) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      game.name.toLowerCase().includes(q) ||
      game.currencyName.toLowerCase().includes(q) ||
      (game.region || '').toLowerCase().includes(q)
    );
  });

  const handleExploreAllRegions = () => {
    onChangeCatalogMode('active');
    setSearchQuery('');
    document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="games-section" className="scroll-mt-20 space-y-6">
      {/* Main Catalog Container */}
      <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl transition-colors">
        {/* Section Header + Catalog Switch + Trust Features */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10 mb-5">
          <div>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
              {catalogMode === 'featured'
                ? 'Popular & Featured Games'
                : 'Active Game Top-Up Catalog'}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-[#F5C400]" />
                <span>Fast Automated Delivery</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Headphones className="w-3.5 h-3.5 text-amber-500 dark:text-[#F5C400]" />
                <span>24/7 Local Support</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Catalog Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0B0B0D] rounded-xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => onChangeCatalogMode('featured')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  catalogMode === 'featured'
                    ? 'bg-[#F5C400] text-[#0B0B0D] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Featured ({FEATURED_GAMES.length})
              </button>
              <button
                type="button"
                onClick={() => onChangeCatalogMode('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  catalogMode === 'active'
                    ? 'bg-[#F5C400] text-[#0B0B0D] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Active & Region Catalog ({ACTIVE_CATALOG_GAMES.length})
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games or region..."
                className="w-full bg-slate-50 dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10 focus:border-amber-500 dark:focus:border-[#F5C400] rounded-xl py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Responsive 3-column mobile / multi-column desktop Game Card Grid */}
        {filteredGames.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No games matched "{searchQuery}". Try another search or switch catalog view.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {filteredGames.map((game) => {
              const isSelected = selectedGame?.id === game.id;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => onSelectGame(game)}
                  className={`group rounded-xl p-1.5 sm:p-2 transition-all duration-200 cursor-pointer flex flex-col items-center text-center border hover:-translate-y-0.5 ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-[#1E1E22] border-[#F5C400] ring-2 ring-[#F5C400]/30 shadow-lg'
                      : 'bg-slate-50 dark:bg-[#0B0B0D] hover:bg-slate-100 dark:hover:bg-[#19191D] border-slate-200 dark:border-white/10 hover:border-[#F5C400]/60'
                  }`}
                >
                  {/* Vertical Artwork Card */}
                  <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 relative mb-2">
                    <img
                      src={game.imageSrc}
                      alt={game.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Top-left Active Status Badge in Active Game Top-Up Catalog */}
                    {catalogMode === 'active' && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 border border-emerald-500/40 text-[9px] font-black tracking-wide text-emerald-400 flex items-center gap-1">
                        <span>• ACTIVE</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-[#F5C400] text-[#0B0B0D] rounded-full p-0.5 shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Currency / Item Tag on Card Art */}
                    <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-center">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#F5C400] bg-black/80 border border-[#F5C400]/35 px-2 py-0.5 rounded-full truncate max-w-full">
                        {game.currencyName}
                      </span>
                    </div>
                  </div>

                  {/* Bold Uppercase Game Title Centered Below Card */}
                  <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-[#F5C400] leading-tight line-clamp-2 px-0.5">
                    {game.name}
                  </h3>
                  {catalogMode === 'active' && game.region && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {game.region}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Regional Games Discovery Banner Card */}
      <div
        id="region-games-banner"
        className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#F5C400]/15 border border-amber-200 dark:border-[#F5C400]/35 flex items-center justify-center mx-auto text-amber-600 dark:text-[#F5C400]">
          <Globe className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 max-w-xl mx-auto">
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
            DISCOVER OTHER REGION GAMES
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Explore 15+ game titles across SG, MY, ID, Global & international regions
          </p>
        </div>

        <button
          type="button"
          onClick={handleExploreAllRegions}
          className="w-full max-w-md mx-auto py-3.5 px-6 rounded-xl bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D] text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
        >
          <span>EXPLORE ALL</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
