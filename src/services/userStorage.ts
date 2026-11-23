import { Order, UserAccount } from '../types';
import { WalletTransaction } from '../components/WalletModal';

export interface UserAccountData {
  walletBalanceLKR: number;
  walletTransactions: WalletTransaction[];
  orders: Order[];
  rewardCoins: number;
}

const ACCOUNT_DATA_PREFIX = 'topuphub_account_v1:';
const ACTIVE_EMAIL_SESSION_KEY = 'topuphub_active_email_session_v1';

const LEGACY_SHARED_KEYS = [
  'topuphub_user',
  'topuphub_orders',
  'topuphub_wallet_balance',
  'topuphub_wallet_txns',
];

export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function isValidEmailAddress(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

export function clearLegacyGlobalStorage(): void {
  try {
    LEGACY_SHARED_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // ignore storage errors
  }
}

export function createEmptyAccountData(): UserAccountData {
  return {
    walletBalanceLKR: 0,
    walletTransactions: [],
    orders: [],
    rewardCoins: 0,
  };
}

export function loadUserAccountData(email: string): UserAccountData {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return createEmptyAccountData();

  try {
    const raw = localStorage.getItem(`${ACCOUNT_DATA_PREFIX}${cleanEmail}`);
    if (!raw) return createEmptyAccountData();
    const parsed = JSON.parse(raw) as Partial<UserAccountData>;

    const walletBalanceLKR =
      typeof parsed.walletBalanceLKR === 'number' && Number.isFinite(parsed.walletBalanceLKR)
        ? Math.max(0, parsed.walletBalanceLKR)
        : 0;

    const walletTransactions = Array.isArray(parsed.walletTransactions)
      ? parsed.walletTransactions
      : [];

    const orders = Array.isArray(parsed.orders)
      ? parsed.orders.filter(
          (o) => o && typeof o.id === 'string' && normalizeEmail(o.userEmail || cleanEmail) === cleanEmail
        )
      : [];

    const rewardCoins =
      typeof parsed.rewardCoins === 'number' && Number.isFinite(parsed.rewardCoins)
        ? Math.max(0, Math.round(parsed.rewardCoins))
        : 0;

    return {
      walletBalanceLKR,
      walletTransactions,
      orders,
      rewardCoins,
    };
  } catch {
    return createEmptyAccountData();
  }
}

export function saveUserAccountData(email: string, data: UserAccountData): void {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return;

  try {
    const payload: UserAccountData = {
      walletBalanceLKR: Math.max(0, Number((data.walletBalanceLKR || 0).toFixed(2))),
      walletTransactions: Array.isArray(data.walletTransactions) ? data.walletTransactions : [],
      orders: Array.isArray(data.orders) ? data.orders : [],
      rewardCoins: Math.max(0, Math.round(data.rewardCoins || 0)),
    };
    localStorage.setItem(`${ACCOUNT_DATA_PREFIX}${cleanEmail}`, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

export function loadActiveEmailSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_EMAIL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserAccount>;
    const cleanEmail = normalizeEmail(parsed.email || '');
    if (!cleanEmail || !isValidEmailAddress(cleanEmail)) {
      localStorage.removeItem(ACTIVE_EMAIL_SESSION_KEY);
      return null;
    }
    const name = (parsed.name || cleanEmail.split('@')[0] || 'Player').trim();
    const accountData = loadUserAccountData(cleanEmail);
    return {
      email: cleanEmail,
      name,
      avatarSeed: (name[0] || cleanEmail[0] || 'P').toUpperCase(),
      isLoggedIn: true,
      authProvider: 'email',
      rewardCoins: accountData.rewardCoins,
      role: 'customer',
    };
  } catch {
    return null;
  }
}

export function saveActiveEmailSession(user: UserAccount | null): void {
  try {
    if (!user || !user.isLoggedIn || user.authProvider !== 'email') {
      localStorage.removeItem(ACTIVE_EMAIL_SESSION_KEY);
      return;
    }
    const cleanEmail = normalizeEmail(user.email);
    if (!cleanEmail) {
      localStorage.removeItem(ACTIVE_EMAIL_SESSION_KEY);
      return;
    }
    localStorage.setItem(
      ACTIVE_EMAIL_SESSION_KEY,
      JSON.stringify({
        email: cleanEmail,
        name: user.name,
        authProvider: 'email',
      })
    );
  } catch {
    // ignore storage errors
  }
}
