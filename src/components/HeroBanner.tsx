import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Flame, Gem, Zap } from 'lucide-react';
import { GameItem } from '../types';
import { ALL_GAMES } from '../data/games';

interface HeroBannerProps {
  onScrollToStore: () => void;
  onSelectGame: (game: GameItem) => void;
}

interface PromoSlide {
  id: string;
  gameId: string;
  badgeText: string;
  title: string;
  accentTitle: string;
  description: string;
  priceHighlight: string;
  buttonText: string;
  posterSrc: string;
  icon: React.ElementType;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'weekly-membership-discount',
    gameId: 'freefire',
    badgeText: 'LIMITED-TIME OFFER · SAVE UP TO 15%',
    title: 'Weekly Membership',
    accentTitle: 'Discount',
    description:
      'Grab Weekly Lite and Weekly Memberships at discounted LKR rates with instant Player UID verification.',
    priceHighlight: 'From Rs. 130.00',
    buttonText: 'Claim Weekly Deal',
    posterSrc: '/assets/games/freefire.jpg',
    icon: Flame,
  },
  {
    id: 'exclusive-diamond-packs',
    gameId: 'mobilelegends',
    badgeText: 'BONUS VALUE · MULTI-GAME TOP-UP',
    title: 'Exclusive Diamond',
    accentTitle: 'Packs',
    description:
      'Unlock extra bonus diamonds and credits across Free Fire, Mobile Legends, PUBG Mobile & more.',
    priceHighlight: 'From Rs. 85.00',
    buttonText: 'Shop Diamond Packs',
    posterSrc: '/assets/games/mobilelegends.jpg',
    icon: Gem,
  },
  {
    id: 'instant-delivery-guarantee',
    gameId: 'pubg',
    badgeText: '5–15 SEC AUTOMATED DELIVERY',
    title: 'Instant Delivery',
    accentTitle: 'Guarantee',
    description:
      'Pay via Bank Transfer (BOC) or eZ Cash (0758500536) and get fast verified delivery 24/7.',
    priceHighlight: '24/7 Local Support',
    buttonText: 'Top Up Now',
    posterSrc: '/assets/games/pubg.jpg',
    icon: Zap,
  },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onScrollToStore,
  onSelectGame,
}) => {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Automatic interval cycling across the 3 promo slides
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleSlideCta = (slide: PromoSlide) => {
    if (slide.id === 'instant-delivery-guarantee') {
      onScrollToStore();
      return;
    }
    const targetGame = ALL_GAMES.find((g) => g.id === slide.gameId);
    if (targetGame) {
      onSelectGame(targetGame);
      return;
    }
    onScrollToStore();
  };

  const handlePrevSlide = () => {
    setActiveSlideIdx((prev) => (prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlideIdx((prev) => (prev + 1) % PROMO_SLIDES.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) {
      setIsPaused(false);
      return;
    }
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) handleNextSlide();
      else handlePrevSlide();
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  return (
    <section
      aria-label="Promotional Offers Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden bg-[#0B0B0D] border-b border-[#FFB800]/25 group select-none"
    >
      {/* Amber Gradient Background Layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#FFB800]/20 to-transparent pointer-events-none z-0"
      />

      {/* Horizontal CSS Sliding Track */}
      <div
        className={`flex w-full transition-transform duration-700 ease-out ${
          activeSlideIdx === 0
            ? 'translate-x-0'
            : activeSlideIdx === 1
            ? '-translate-x-full'
            : '-translate-x-[200%]'
        }`}
      >
        {PROMO_SLIDES.map((slide) => {
          const Icon = slide.icon;
          return (
            <div
              key={slide.id}
              className="relative w-full shrink-0 min-h-[340px] sm:min-h-[390px] lg:min-h-[420px] flex items-center"
            >
              {/* Right-aligned poster art blended into dark + amber surface */}
              <div className="absolute inset-y-0 right-0 w-full md:w-[62%] lg:w-[58%] overflow-hidden pointer-events-none">
                <img
                  src={slide.posterSrc}
                  alt={`${slide.title} ${slide.accentTitle}`}
                  className="w-full h-full object-cover object-center opacity-65 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D] via-[#0B0B0D]/85 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-transparent to-[#0B0B0D]/50" />
              </div>

              {/* Amber Glow Overlay on each slide */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-[#FFB800]/20 to-transparent pointer-events-none"
              />

              {/* Foreground Content */}
              <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="max-w-xl space-y-4 sm:space-y-5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFB800]/15 backdrop-blur-md border border-[#FFB800]/45 text-[11px] sm:text-xs font-extrabold tracking-wider uppercase text-[#F5C400]">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{slide.badgeText}</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-white leading-[1.06]">
                    <span className="block">{slide.title}</span>
                    <span className="block text-[#F5C400]">{slide.accentTitle}</span>
                  </h1>

                  <p className="text-xs sm:text-base text-slate-200 max-w-lg leading-relaxed">
                    {slide.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSlideCta(slide)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D] text-xs sm:text-sm font-black tracking-wide shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
                    >
                      <span>{slide.buttonText}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <span className="px-3.5 py-2.5 rounded-xl bg-black/55 border border-[#FFB800]/35 text-xs font-mono font-bold text-[#F5C400]">
                      {slide.priceHighlight}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Previous / Next Arrow Controls */}
      <button
        type="button"
        onClick={handlePrevSlide}
        aria-label="Previous promo slide"
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/65 hover:bg-[#F5C400] hover:text-[#0B0B0D] border border-white/15 hover:border-[#F5C400] text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={handleNextSlide}
        aria-label="Next promo slide"
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/65 hover:bg-[#F5C400] hover:text-[#0B0B0D] border border-white/15 hover:border-[#F5C400] text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom Navigation Dots */}
      <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-2.5">
        {PROMO_SLIDES.map((slide, idx) => {
          const isActive = idx === activeSlideIdx;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveSlideIdx(idx)}
              aria-label={`Go to ${slide.title} ${slide.accentTitle}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'w-8 bg-[#F5C400] shadow-sm shadow-amber-400/50'
                  : 'w-2.5 bg-white/35 hover:bg-[#FFB800]/75'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
};
