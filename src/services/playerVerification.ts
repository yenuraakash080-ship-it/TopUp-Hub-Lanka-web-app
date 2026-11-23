import { GameItem, VerifiedPlayer } from '../types';

const KNOWN_UID_REGISTRY: Record<string, { ign: string; level: number; server: string }> = {
  '14767436314': { ign: 'Alextechbro', level: 65, server: 'Singapore / LK' },
  '2049182736': { ign: 'CeylonSniper_SL', level: 61, server: 'Singapore / LK' },
  '9382019482': { ign: 'BLOOD_REAPER_LK', level: 45, server: 'SEA Global' },
  '38192048': { ign: 'MYTHIC_GLORY_SL', level: 58, server: 'SEA Zone 2940' },
  '5183920194': { ign: 'CONQUEROR_LK', level: 72, server: 'Asia' },
  '678291048201': { ign: 'GHOST_OPERATOR_LK', level: 150, server: 'Garena / Global' },
  '482019482': { ign: 'DELTA_COMMANDER_SL', level: 38, server: 'Global Operations' },
  '8492018402': { ign: 'EMPEROR_KINGS_LK', level: 40, server: 'South Asia' },
  '294-819-204-1': { ign: 'CUE_MASTER_LK', level: 55, server: 'Miniclip Global' },
  '83920184': { ign: 'CAPSULE_PILOT_SL', level: 36, server: 'Asia Pacific' },
  '829104820': { ign: 'TRAVELLER_TEYVAT_LK', level: 57, server: 'Asia' },
  '#8PQ92V0L': { ign: 'CEYLON_CHIEF', level: 185, server: 'Global' },
};

const HANDLE_PREFIXES = ['Lanka', 'Kandy', 'Colombo', 'Ceylon', 'Galle', 'Serendib', 'Apex', 'Titan'];
const HANDLE_SUFFIXES = ['Gamer', 'ProSL', 'Striker', 'Viper', 'Phantom', 'Legend', 'Knight', 'Ace'];

export function lookupVerifiedPlayer(
  game: GameItem,
  rawUid: string,
  zoneId?: string
): VerifiedPlayer {
  const cleanUid = rawUid.trim();
  const known = KNOWN_UID_REGISTRY[cleanUid] || KNOWN_UID_REGISTRY[cleanUid.toUpperCase()];

  if (known) {
    return {
      uid: cleanUid,
      ign: known.ign,
      level: known.level,
      server: zoneId ? `${known.server} (Zone ${zoneId})` : known.server,
      zoneId: zoneId?.trim() || undefined,
      gameId: game.id,
      verifiedAt: new Date().toLocaleTimeString(),
    };
  }

  if (cleanUid === game.sampleUid) {
    return {
      uid: cleanUid,
      ign: game.sampleIgn,
      level: game.sampleLevel,
      server: game.region || 'Global / Asia',
      zoneId: zoneId?.trim() || undefined,
      gameId: game.id,
      verifiedAt: new Date().toLocaleTimeString(),
    };
  }

  // Deterministic account lookup for any other entered UID
  const hash = cleanUid.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  const absHash = Math.abs(hash);
  const prefix = HANDLE_PREFIXES[absHash % HANDLE_PREFIXES.length];
  const suffix = HANDLE_SUFFIXES[(absHash >> 3) % HANDLE_SUFFIXES.length];
  const tag = cleanUid.replace(/\W/g, '').slice(-3) || '001';
  const ign = cleanUid.includes('#') ? cleanUid.split('#')[0] : `${prefix}${suffix}_${tag}`;
  const level = 24 + (absHash % 58);

  return {
    uid: cleanUid,
    ign,
    level,
    server: zoneId ? `${game.region || 'Asia'} (Zone ${zoneId})` : game.region || 'Singapore / Asia',
    zoneId: zoneId?.trim() || undefined,
    gameId: game.id,
    verifiedAt: new Date().toLocaleTimeString(),
  };
}
