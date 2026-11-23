import { getFirebaseIdToken } from '../lib/firebase';
import { Order, OrderStatus, VerifiedPlayer } from '../types';

async function authHeaders(): Promise<HeadersInit | null> {
  const token = await getFirebaseIdToken();
  if (!token) return null;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function syncCloudSqlProfile(): Promise<{
  rewardCoins: number;
  walletBalanceLkr: number;
  isAdmin: boolean;
} | null> {
  const headers = await authHeaders();
  if (!headers) return null;

  const res = await fetch('/api/me', { headers });
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchCloudSqlOrders(): Promise<Order[]> {
  const headers = await authHeaders();
  if (!headers) return [];

  const res = await fetch('/api/orders', { headers });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data.orders)) return [];

  return data.orders.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    userId: typeof row.userUid === 'string' ? row.userUid : undefined,
    createdAt:
      typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString(),
    gameId: String(row.gameId || 'freefire'),
    gameName: String(row.gameName || 'Free Fire'),
    userEmail: String(row.userEmail || ''),
    playerUid: String(row.playerUid || ''),
    playerIgn: String(row.playerIgn || ''),
    playerLevel: Number(row.playerLevel || 1),
    packageId: String(row.packageId || 'pack'),
    packageName: String(row.packageName || ''),
    packageCategory: (row.packageCategory as Order['packageCategory']) || 'regular',
    diamondsCount: Number(row.diamondsCount || 0),
    amountLKR: Number(row.amountLkr || 0),
    processingFeeLKR: Number(row.processingFeeLkr || 0),
    totalPaidLKR: Number(row.totalPaidLkr || 0),
    paymentMethod: (row.paymentMethod as Order['paymentMethod']) || 'bank_deposit',
    paymentMethodLabel:
      typeof row.paymentMethodLabel === 'string' ? row.paymentMethodLabel : undefined,
    ezCashNumber: typeof row.ezCashNumber === 'string' ? row.ezCashNumber : undefined,
    transactionReference: String(row.transactionReference || ''),
    whatsappNumber: String(row.whatsappNumber || '0758500536'),
    status: (row.status as OrderStatus) || 'pending_verification',
    verifiedAt: typeof row.verifiedAt === 'string' ? row.verifiedAt : undefined,
  }));
}

export async function saveOrderToCloudSql(order: Order): Promise<number | null> {
  const headers = await authHeaders();
  if (!headers) return null;

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(order),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data.rewardCoins === 'number' ? data.rewardCoins : null;
}

export async function updateOrderStatusInCloudSql(
  orderId: string,
  status: OrderStatus
): Promise<boolean> {
  const headers = await authHeaders();
  if (!headers) return false;

  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  return res.ok;
}

export async function updateWalletBalanceInCloudSql(
  walletBalanceLKR: number
): Promise<number | null> {
  const headers = await authHeaders();
  if (!headers) return null;

  const res = await fetch('/api/wallet', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ walletBalanceLKR }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data.walletBalanceLkr === 'number' ? data.walletBalanceLkr : null;
}

export async function saveVerifiedUidToCloudSql(player: VerifiedPlayer): Promise<void> {
  const headers = await authHeaders();
  if (!headers) return;

  await fetch('/api/saved-uids', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      gameId: player.gameId,
      playerUid: player.uid,
      playerIgn: player.ign,
      playerLevel: player.level,
      server: player.server,
      zoneId: player.zoneId,
    }),
  });
}
