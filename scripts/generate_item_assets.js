import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/assets/items');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Copy diamond_cluster_raw.png to diamond_100.png if exists
const rawCluster = path.join(outDir, 'diamond_cluster_raw.png');
if (fs.existsSync(rawCluster)) {
  fs.copyFileSync(rawCluster, path.join(outDir, 'diamond_100.png'));
}

const assets = {
  // Free Fire 25 Diamonds - Single Radiant Gem
  'diamond_25.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="facet1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e0f2fe"/>
        <stop offset="50%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0369a1"/>
      </linearGradient>
      <linearGradient id="facet2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#7dd3fc"/>
      </linearGradient>
      <linearGradient id="facetTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#bae6fd"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="65" r="45" fill="url(#glow)"/>
    <!-- Diamond Body -->
    <polygon points="40,35 80,35 98,55 60,100 22,55" fill="#0284c7" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))"/>
    <polygon points="40,35 80,35 70,55 50,55" fill="url(#facetTop)"/>
    <polygon points="22,55 40,35 50,55" fill="url(#facet1)"/>
    <polygon points="80,35 98,55 70,55" fill="url(#facet2)"/>
    <polygon points="22,55 50,55 60,100" fill="#0369a1"/>
    <polygon points="50,55 70,55 60,100" fill="url(#facet1)"/>
    <polygon points="70,55 98,55 60,100" fill="#0284c7"/>
    <!-- Facet outlines & sparkles -->
    <polygon points="50,55 60,100 50,55" stroke="#ffffff" stroke-width="0.5" fill="none"/>
    <path d="M 60,20 L 62,28 L 70,30 L 62,32 L 60,40 L 58,32 L 50,30 L 58,28 Z" fill="#ffffff" opacity="0.9"/>
    <path d="M 85,45 L 86,49 L 90,50 L 86,51 L 85,55 L 84,51 L 80,50 L 84,49 Z" fill="#ffffff" opacity="0.8"/>
  </svg>`,

  // Free Fire 310 Diamonds - Trio of Diamonds
  'diamond_310.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="glow310" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gem" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0f9ff"/>
        <stop offset="40%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="65" r="50" fill="url(#glow310)"/>
    <!-- Left Gem -->
    <g transform="translate(18, 45) scale(0.65) rotate(-15)">
      <polygon points="40,30 80,30 96,48 60,90 24,48" fill="#0284c7"/>
      <polygon points="40,30 80,30 70,48 50,48" fill="#e0f2fe"/>
      <polygon points="24,48 40,30 50,48" fill="#38bdf8"/>
      <polygon points="80,30 96,48 70,48" fill="#0284c7"/>
      <polygon points="50,48 70,48 60,90" fill="url(#gem)"/>
      <polygon points="24,48 50,48 60,90" fill="#0369a1"/>
      <polygon points="70,48 96,48 60,90" fill="#075985"/>
    </g>
    <!-- Right Gem -->
    <g transform="translate(56, 45) scale(0.65) rotate(15)">
      <polygon points="40,30 80,30 96,48 60,90 24,48" fill="#0284c7"/>
      <polygon points="40,30 80,30 70,48 50,48" fill="#e0f2fe"/>
      <polygon points="24,48 40,30 50,48" fill="#38bdf8"/>
      <polygon points="80,30 96,48 70,48" fill="#0284c7"/>
      <polygon points="50,48 70,48 60,90" fill="url(#gem)"/>
      <polygon points="24,48 50,48 60,90" fill="#0369a1"/>
      <polygon points="70,48 96,48 60,90" fill="#075985"/>
    </g>
    <!-- Center Main Gem -->
    <g transform="translate(32, 25) scale(0.9)">
      <polygon points="35,25 75,25 94,45 55,92 16,45" fill="#0284c7"/>
      <polygon points="35,25 75,25 65,45 45,45" fill="#ffffff"/>
      <polygon points="16,45 35,25 45,45" fill="#bae6fd"/>
      <polygon points="75,25 94,45 65,45" fill="#38bdf8"/>
      <polygon points="45,45 65,45 55,92" fill="url(#gem)"/>
      <polygon points="16,45 45,45 55,92" fill="#0369a1"/>
      <polygon points="65,45 94,45 55,92" fill="#075985"/>
      <path d="M 55,15 L 57,22 L 64,24 L 57,26 L 55,33 L 53,26 L 46,24 L 53,22 Z" fill="#ffffff"/>
    </g>
  </svg>`,

  // Free Fire 520 Diamonds - Glowing Stack
  'diamond_520.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="glow520" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
        <stop offset="60%" stop-color="#0284c7" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="60" cy="65" r="50" fill="url(#glow520)"/>
    <!-- Stack of 5 Crystals -->
    <g fill="#0284c7" stroke="#38bdf8" stroke-width="0.75">
      <!-- Base layer -->
      <polygon points="20,70 45,55 70,70 45,95" fill="#0369a1"/>
      <polygon points="50,70 75,55 100,70 75,95" fill="#0284c7"/>
      <polygon points="35,80 60,65 85,80 60,105" fill="#075985"/>
      <!-- Top layer gems -->
      <polygon points="30,45 55,30 80,45 55,75" fill="#38bdf8"/>
      <polygon points="45,30 65,15 85,30 65,60" fill="#7dd3fc"/>
      <polygon points="55,30 75,18 95,30 75,58" fill="#bae6fd"/>
    </g>
    <!-- Facet reflections -->
    <polygon points="45,30 55,30 65,45 55,45" fill="#ffffff" opacity="0.9"/>
    <polygon points="65,15 75,18 70,30 60,30" fill="#ffffff" opacity="0.9"/>
    <!-- Sparkles -->
    <circle cx="28" cy="40" r="2" fill="#ffffff"/>
    <circle cx="95" cy="35" r="2.5" fill="#ffffff"/>
    <path d="M 65,8 L 67,14 L 73,16 L 67,18 L 65,24 L 63,18 L 57,16 L 63,14 Z" fill="#ffffff"/>
  </svg>`,

  // Free Fire 1060 Diamonds - Pouch of Diamonds
  'diamond_1060.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="pouchGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="pouchLeather" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#78350f"/>
        <stop offset="50%" stop-color="#b45309"/>
        <stop offset="100%" stop-color="#451a03"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="65" r="50" fill="url(#pouchGlow)"/>
    <!-- Bag base -->
    <ellipse cx="60" cy="85" rx="36" ry="24" fill="url(#pouchLeather)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <path d="M 28,75 Q 24,55 35,50 Q 60,45 85,50 Q 96,55 92,75 Z" fill="#92400e"/>
    <!-- Tie string -->
    <path d="M 34,52 Q 60,56 86,52" stroke="#f59e0b" stroke-width="3" fill="none"/>
    <circle cx="60" cy="54" r="4" fill="#fbbf24"/>
    <!-- Overflowing Diamonds on Top -->
    <polygon points="40,42 55,30 70,42 55,56" fill="#38bdf8" stroke="#bae6fd" stroke-width="0.5"/>
    <polygon points="50,30 65,18 80,30 65,46" fill="#bae6fd" stroke="#ffffff" stroke-width="0.5"/>
    <polygon points="25,48 40,36 55,48 40,62" fill="#0284c7" stroke="#7dd3fc" stroke-width="0.5"/>
    <polygon points="65,40 80,28 95,40 80,54" fill="#0ea5e9" stroke="#bae6fd" stroke-width="0.5"/>
    <!-- Glistening Sparkle -->
    <path d="M 65,12 L 67,17 L 72,19 L 67,21 L 65,26 L 63,21 L 58,19 L 63,17 Z" fill="#ffffff"/>
    <path d="M 88,32 L 89,35 L 92,36 L 89,37 L 88,40 L 87,37 L 84,36 L 87,35 Z" fill="#ffffff"/>
  </svg>`,

  // Free Fire 2180 Diamonds - Golden Treasure Chest
  'diamond_2180.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="chestGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="goldPlate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#a16207"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="65" r="50" fill="url(#chestGlow)"/>
    <!-- Chest Body -->
    <rect x="22" y="58" width="76" height="42" rx="4" fill="#451a03" stroke="#eab308" stroke-width="2"/>
    <rect x="22" y="70" width="76" height="6" fill="#eab308"/>
    <!-- Overflowing Diamonds inside lid -->
    <ellipse cx="60" cy="56" rx="34" ry="14" fill="#0369a1"/>
    <polygon points="35,50 50,38 65,50 50,64" fill="#38bdf8"/>
    <polygon points="50,44 65,30 80,44 65,58" fill="#bae6fd"/>
    <polygon points="65,48 80,36 95,48 80,62" fill="#38bdf8"/>
    <polygon points="40,40 55,26 70,40 55,54" fill="#ffffff" opacity="0.85"/>
    <!-- Chest Open Lid -->
    <path d="M 20,56 Q 60,34 100,56 L 96,48 Q 60,26 24,48 Z" fill="url(#goldPlate)"/>
    <!-- Golden lock & corner brackets -->
    <rect x="54" y="66" width="12" height="14" rx="2" fill="url(#goldPlate)"/>
    <circle cx="60" cy="72" r="2.5" fill="#1e293b"/>
    <!-- Radiating burst -->
    <path d="M 60,18 L 62,25 L 69,27 L 62,29 L 60,36 L 58,29 L 51,27 L 58,25 Z" fill="#ffffff"/>
    <path d="M 30,34 L 32,38 L 36,39 L 32,40 L 30,44 L 28,40 L 24,39 L 28,38 Z" fill="#ffffff"/>
  </svg>`,

  // Free Fire 5600 Diamonds - Vault of Diamonds
  'diamond_5600.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="vaultGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
        <stop offset="60%" stop-color="#a855f7" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="cyberSteel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#334155"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="65" r="52" fill="url(#vaultGlow)"/>
    <!-- Armored Vault Crate -->
    <rect x="18" y="52" width="84" height="48" rx="6" fill="url(#cyberSteel)" stroke="#38bdf8" stroke-width="2"/>
    <line x1="18" y1="64" x2="102" y2="64" stroke="#eab308" stroke-width="2"/>
    <circle cx="60" cy="78" r="10" fill="#0f172a" stroke="#eab308" stroke-width="2"/>
    <!-- Vault Wheel -->
    <line x1="60" y1="68" x2="60" y2="88" stroke="#eab308" stroke-width="2"/>
    <line x1="50" y1="78" x2="70" y2="78" stroke="#eab308" stroke-width="2"/>
    <!-- Massive Diamond Pile on top -->
    <polygon points="30,48 45,34 60,48 45,62" fill="#0284c7"/>
    <polygon points="45,40 60,24 75,40 60,56" fill="#38bdf8"/>
    <polygon points="60,42 75,28 90,42 75,56" fill="#0284c7"/>
    <polygon points="38,32 53,16 68,32 53,48" fill="#bae6fd"/>
    <polygon points="53,28 68,12 83,28 68,44" fill="#ffffff"/>
    <!-- Aura Stars -->
    <path d="M 68,6 L 70,11 L 75,13 L 70,15 L 68,20 L 66,15 L 61,13 L 66,11 Z" fill="#fef08a"/>
    <path d="M 22,38 L 24,42 L 28,43 L 24,44 L 22,48 L 20,44 L 16,43 L 20,42 Z" fill="#ffffff"/>
    <path d="M 98,34 L 100,38 L 104,39 L 100,40 L 98,44 L 96,40 L 92,39 L 96,38 Z" fill="#ffffff"/>
  </svg>`,

  // Free Fire 11500 Diamonds - Royal Diamond Treasury
  'diamond_11500.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="treasuryGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#38bdf8" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="goldBar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#854d0e"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="65" r="54" fill="url(#treasuryGlow)"/>
    <!-- Royal Base & Crown -->
    <rect x="14" y="60" width="92" height="42" rx="6" fill="#1e1b4b" stroke="url(#goldBar)" stroke-width="2.5"/>
    <rect x="20" y="74" width="80" height="4" fill="url(#goldBar)"/>
    <!-- Crown Emblem on chest -->
    <path d="M 50,78 L 54,72 L 60,76 L 66,72 L 70,78 Z" fill="url(#goldBar)"/>
    <!-- Colossal Diamond Pyramid -->
    <polygon points="40,54 60,32 80,54 60,76" fill="#0284c7"/>
    <polygon points="26,48 44,30 62,48 44,66" fill="#0369a1"/>
    <polygon points="58,48 76,30 94,48 76,66" fill="#0284c7"/>
    <polygon points="42,36 60,14 78,36 60,58" fill="url(#goldBar)"/>
    <polygon points="48,32 60,16 72,32 60,48" fill="#ffffff"/>
    <!-- Top Crown -->
    <path d="M 52,14 L 54,8 L 60,12 L 66,8 L 68,14 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>
    <!-- Mega Sparkles -->
    <path d="M 60,2 L 62,7 L 67,8 L 62,9 L 60,14 L 58,9 L 53,8 L 58,7 Z" fill="#ffffff"/>
    <path d="M 16,30 L 18,34 L 22,35 L 18,36 L 16,40 L 14,36 L 10,35 L 14,34 Z" fill="#fef08a"/>
    <path d="M 104,30 L 106,34 L 110,35 L 106,36 L 104,40 L 102,36 L 98,35 L 102,34 Z" fill="#fef08a"/>
  </svg>`,

  // Bonus Pack Crate
  'bonus_crate.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="bonusGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#b45309" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="crateMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24"/>
        <stop offset="50%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="65" r="50" fill="url(#bonusGlow)"/>
    <!-- Sci-fi Drop Crate -->
    <rect x="22" y="44" width="76" height="56" rx="6" fill="#1c1917" stroke="url(#crateMetal)" stroke-width="2.5"/>
    <line x1="22" y1="72" x2="98" y2="72" stroke="#f59e0b" stroke-width="2"/>
    <line x1="60" y1="44" x2="60" y2="100" stroke="#f59e0b" stroke-width="2"/>
    <!-- Yellow Caution Stripes -->
    <rect x="26" y="48" width="8" height="20" fill="#f59e0b" transform="skewX(-20)"/>
    <rect x="42" y="48" width="8" height="20" fill="#f59e0b" transform="skewX(-20)"/>
    <rect x="68" y="48" width="8" height="20" fill="#f59e0b" transform="skewX(-20)"/>
    <rect x="84" y="48" width="8" height="20" fill="#f59e0b" transform="skewX(-20)"/>
    <!-- Glowing Gem on Top -->
    <polygon points="45,36 60,20 75,36 60,52" fill="#38bdf8" stroke="#ffffff" stroke-width="1"/>
    <polygon points="50,34 60,22 70,34 60,46" fill="#ffffff" opacity="0.8"/>
    <!-- BONUS Stamp Banner -->
    <rect x="30" y="78" width="60" height="16" rx="3" fill="#dc2626" stroke="#fef08a" stroke-width="1"/>
    <text x="60" y="90" font-family="Arial, sans-serif" font-weight="900" font-size="9" fill="#ffffff" text-anchor="middle" letter-spacing="1">BONUS</text>
  </svg>`,

  // Weekly Lite Membership Card
  'pass_weekly_lite.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="cardLite" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="50%" stop-color="#0369a1"/>
        <stop offset="100%" stop-color="#082f49"/>
      </linearGradient>
    </defs>
    <!-- Membership Card Container -->
    <rect x="15" y="28" width="90" height="64" rx="8" fill="url(#cardLite)" stroke="#38bdf8" stroke-width="2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <!-- Chip -->
    <rect x="25" y="42" width="16" height="12" rx="2" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>
    <!-- Card Text -->
    <text x="25" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#ffffff" letter-spacing="1">WEEKLY LITE</text>
    <text x="25" y="80" font-family="Arial, sans-serif" font-weight="700" font-size="7" fill="#38bdf8">FREE FIRE PASS</text>
    <!-- Winged Emblem Right -->
    <polygon points="85,45 92,35 88,52" fill="#7dd3fc"/>
    <polygon points="80,50 90,48 83,56" fill="#38bdf8"/>
    <polygon points="76,46 84,38 88,48 80,60 72,50" fill="#bae6fd"/>
  </svg>`,

  // Weekly Membership Card (Gold)
  'pass_weekly.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="cardWeekly" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#713f12"/>
      </linearGradient>
    </defs>
    <rect x="15" y="28" width="90" height="64" rx="8" fill="url(#cardWeekly)" stroke="#fde047" stroke-width="2.5" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.6))"/>
    <rect x="25" y="42" width="16" height="12" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.5"/>
    <text x="25" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#451a03" letter-spacing="1">WEEKLY VIP</text>
    <text x="25" y="80" font-family="Arial, sans-serif" font-weight="800" font-size="7" fill="#78350f">450 DIAMONDS TOTAL</text>
    <!-- Crown on Right -->
    <path d="M 72,50 L 76,40 L 82,46 L 88,40 L 92,50 Z" fill="#451a03"/>
    <circle cx="82" cy="54" r="3" fill="#0284c7"/>
  </svg>`,

  // Monthly Membership Pass (Obsidian Platinum)
  'pass_monthly.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="cardMonthly" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#475569"/>
        <stop offset="40%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#312e81"/>
      </linearGradient>
    </defs>
    <rect x="15" y="28" width="90" height="64" rx="8" fill="url(#cardMonthly)" stroke="#c084fc" stroke-width="2.5" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.6))"/>
    <rect x="25" y="42" width="16" height="12" rx="2" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>
    <text x="25" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#f8fafc" letter-spacing="1">MONTHLY VIP</text>
    <text x="25" y="80" font-family="Arial, sans-serif" font-weight="800" font-size="7" fill="#a855f7">2,600 DIAMONDS + BADGE</text>
    <!-- Diamond Emblem Right -->
    <polygon points="74,48 82,36 90,48 82,60" fill="#a855f7" stroke="#ffffff" stroke-width="0.75"/>
  </svg>`,

  // VIP Membership Crest
  'pass_vip.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="vipGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#854d0e"/>
      </linearGradient>
    </defs>
    <!-- Shield Background -->
    <path d="M 60,18 L 88,32 L 84,72 Q 60,102 60,102 Q 60,102 36,72 L 32,32 Z" fill="#1e1b4b" stroke="url(#vipGold)" stroke-width="3" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <!-- Gold Crown -->
    <path d="M 46,45 L 50,35 L 60,42 L 70,35 L 74,45 Z" fill="url(#vipGold)"/>
    <text x="60" y="66" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="url(#vipGold)" text-anchor="middle" letter-spacing="1">VIP</text>
    <text x="60" y="78" font-family="Arial, sans-serif" font-weight="800" font-size="7" fill="#38bdf8" text-anchor="middle">OFFICIAL</text>
  </svg>`,

  // Super VIP Membership Crest
  'pass_super_vip.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="svipFlame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ef4444"/>
        <stop offset="50%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#7f1d1d"/>
      </linearGradient>
    </defs>
    <path d="M 60,14 L 92,30 L 88,74 Q 60,106 60,106 Q 60,106 32,74 L 28,30 Z" fill="#450a0a" stroke="url(#svipFlame)" stroke-width="3.5" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.7))"/>
    <polygon points="60,25 65,38 78,38 67,46 71,59 60,51 49,59 53,46 42,38 55,38" fill="#fbbf24"/>
    <text x="60" y="74" font-family="Arial, sans-serif" font-weight="900" font-size="12" fill="#fef08a" text-anchor="middle" letter-spacing="1">SUPER VIP</text>
    <text x="60" y="86" font-family="Arial, sans-serif" font-weight="800" font-size="7" fill="#fca5a5" text-anchor="middle">ROYAL ELITE</text>
  </svg>`,

  // PUBG Mobile UC Coin
  'pubg_uc.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <circle cx="60" cy="60" r="48" fill="#eab308" stroke="#fef08a" stroke-width="3" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <circle cx="60" cy="60" r="40" fill="#a16207" stroke="#ca8a04" stroke-width="2"/>
    <text x="60" y="72" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="#fef08a" text-anchor="middle" letter-spacing="1">UC</text>
  </svg>`,

  // Blood Strike Gold
  'bloodstrike_gold.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <polygon points="60,16 98,38 98,82 60,104 22,82 22,38" fill="#b91c1c" stroke="#f59e0b" stroke-width="3.5" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <polygon points="60,26 88,42 88,78 60,94 32,78 32,42" fill="#7f1d1d"/>
    <text x="60" y="74" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="#fde047" text-anchor="middle">G</text>
  </svg>`,

  // Mobile Legends Diamonds & Starlight
  'mlbb_diamonds.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <polygon points="60,18 96,44 80,98 40,98 24,44" fill="#0284c7" stroke="#38bdf8" stroke-width="3" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <polygon points="60,18 80,44 60,98 40,44" fill="#bae6fd"/>
    <polygon points="40,44 60,18 24,44" fill="#0369a1"/>
    <polygon points="60,18 80,44 96,44" fill="#7dd3fc"/>
  </svg>`,

  // Call of Duty Mobile CP
  'codm_cp.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <circle cx="60" cy="60" r="46" fill="#1c1917" stroke="#eab308" stroke-width="4" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <circle cx="60" cy="60" r="38" fill="#292524" stroke="#ca8a04" stroke-width="2"/>
    <text x="60" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#fde047" text-anchor="middle" letter-spacing="1">CP</text>
  </svg>`,

  // Valorant Points (VP)
  'valorant_vp.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <polygon points="60,15 92,45 80,105 40,105 28,45" fill="#dc2626" stroke="#f87171" stroke-width="3" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <polygon points="60,28 82,50 60,95 38,50" fill="#fca5a5"/>
    <text x="60" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">VP</text>
  </svg>`,

  // Roblox Robux
  'roblox_robux.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <polygon points="60,18 96,38 96,82 60,102 24,82 24,38" fill="#0284c7" stroke="#38bdf8" stroke-width="3.5" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <polygon points="60,40 76,50 76,70 60,80 44,70 44,50" fill="#ffffff"/>
  </svg>`,

  // Genshin Genesis Crystals
  'genshin_crystals.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <polygon points="60,14 88,60 60,106 32,60" fill="#38bdf8" stroke="#bae6fd" stroke-width="2.5" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"/>
    <polygon points="60,14 74,60 60,106 46,60" fill="#ffffff" opacity="0.9"/>
  </svg>`
};

for (const [filename, content] of Object.entries(assets)) {
  fs.writeFileSync(path.join(outDir, filename), content.trim());
  console.log(`Generated: ${filename}`);
}

console.log('All item picture assets successfully generated!');
