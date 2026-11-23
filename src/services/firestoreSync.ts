import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus, VerifiedPlayer } from '../types';

function sanitizeDocId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || `ORD-${Date.now()}`;
}

export async function syncUserProfileToFirestore(params: {
  uid: string;
  email: string;
  name: string;
  rewardCoins: number;
  walletBalanceLKR: number;
}): Promise<{ rewardCoins: number; walletBalanceLKR: number }> {
  const path = `users/${params.uid}`;
  const ref = doc(db, 'users', params.uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const safeName = (params.name || 'Player').trim().slice(0, 120) || 'Player';
  const safeEmail = (params.email || '').trim().slice(0, 160);

  if (!existingSnap.exists()) {
    const coins = Math.max(0, Math.round(params.rewardCoins));
    const wallet = Math.max(0, Number(params.walletBalanceLKR.toFixed(2)));
    try {
      await setDoc(ref, {
        uid: params.uid,
        email: safeEmail,
        name: safeName,
        rewardCoins: coins,
        walletBalanceLKR: wallet,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return { rewardCoins: coins, walletBalanceLKR: wallet };
  }

  const data = existingSnap.data();
  const coins = typeof data.rewardCoins === 'number' ? data.rewardCoins : params.rewardCoins;
  const wallet =
    typeof data.walletBalanceLKR === 'number' ? data.walletBalanceLKR : params.walletBalanceLKR;

  try {
    await updateDoc(ref, {
      email: safeEmail,
      name: safeName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  return { rewardCoins: coins, walletBalanceLKR: wallet };
}

export async function updateUserBalancesInFirestore(params: {
  uid: string;
  rewardCoins?: number;
  walletBalanceLKR?: number;
}) {
  const path = `users/${params.uid}`;
  const ref = doc(db, 'users', params.uid);
  const patch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (typeof params.rewardCoins === 'number') {
    patch.rewardCoins = Math.max(0, Math.round(params.rewardCoins));
  }
  if (typeof params.walletBalanceLKR === 'number') {
    patch.walletBalanceLKR = Math.max(0, Number(params.walletBalanceLKR.toFixed(2)));
  }

  try {
    await updateDoc(ref, patch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveOrderToFirestore(uid: string, order: Order) {
  const docId = sanitizeDocId(order.id);
  const path = `orders/${docId}`;
  const ref = doc(db, 'orders', docId);

  const payload: Record<string, unknown> = {
    orderId: order.id.slice(0, 32),
    userId: uid.slice(0, 128),
    userEmail: (order.userEmail || '').slice(0, 160),
    gameId: (order.gameId || 'freefire').slice(0, 64),
    gameName: (order.gameName || 'Free Fire').slice(0, 100),
    playerUid: (order.playerUid || '0000').slice(0, 64),
    playerIgn: (order.playerIgn || 'Player Account').slice(0, 80),
    playerLevel: Math.max(1, Math.min(999, Math.round(order.playerLevel || 1))),
    packageId: (order.packageId || 'pack').slice(0, 64),
    packageName: (order.packageName || 'Top-Up Package').slice(0, 200),
    packageCategory: order.packageCategory || 'regular',
    diamondsCount: Math.max(0, Math.round(order.diamondsCount || 0)),
    amountLKR: Math.max(1, Number(order.amountLKR.toFixed(2))),
    processingFeeLKR: Math.max(0, Number((order.processingFeeLKR || 0).toFixed(2))),
    totalPaidLKR: Math.max(1, Number(order.totalPaidLKR.toFixed(2))),
    paymentMethod: order.paymentMethod || 'bank_deposit',
    transactionReference: (order.transactionReference || 'REF').slice(0, 100),
    whatsappNumber: (order.whatsappNumber || '0758500536').slice(0, 20),
    status: 'pending_verification',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (order.paymentMethodLabel) {
    payload.paymentMethodLabel = order.paymentMethodLabel.slice(0, 80);
  }
  if (order.ezCashNumber) {
    payload.ezCashNumber = order.ezCashNumber.slice(0, 20);
  }

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: OrderStatus
) {
  const docId = sanitizeDocId(orderId);
  const path = `orders/${docId}`;
  const ref = doc(db, 'orders', docId);
  const patch: Record<string, unknown> = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };
  if (newStatus === 'completed') {
    patch.verifiedAt = new Date().toLocaleTimeString().slice(0, 64);
  }

  try {
    await updateDoc(ref, patch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveVerifiedPlayerToFirestore(
  uid: string,
  player: VerifiedPlayer
) {
  const savedDocId = sanitizeDocId(`${player.gameId}_${player.uid}`);
  const path = `users/${uid}/savedUids/${savedDocId}`;
  const ref = doc(db, 'users', uid, 'savedUids', savedDocId);

  const payload: Record<string, unknown> = {
    userId: uid.slice(0, 128),
    gameId: player.gameId.slice(0, 64),
    playerUid: player.uid.slice(0, 64),
    playerIgn: player.ign.slice(0, 80),
    playerLevel: Math.max(1, Math.min(999, Math.round(player.level || 1))),
    server: (player.server || 'Asia').slice(0, 60),
    updatedAt: serverTimestamp(),
  };

  if (player.zoneId) {
    payload.zoneId = player.zoneId.slice(0, 32);
  }

  try {
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function mapDocToOrder(data: Record<string, unknown>): Order {
  const createdAtRaw = data.createdAt;
  const createdAtIso =
    createdAtRaw instanceof Timestamp
      ? createdAtRaw.toDate().toISOString()
      : typeof createdAtRaw === 'string'
      ? createdAtRaw
      : new Date().toISOString();

  return {
    id: String(data.orderId || '#ORD-1024'),
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    createdAt: createdAtIso,
    gameId: String(data.gameId || 'freefire'),
    gameName: String(data.gameName || 'Free Fire'),
    userEmail: String(data.userEmail || ''),
    playerUid: String(data.playerUid || ''),
    playerIgn: String(data.playerIgn || 'Player Account'),
    playerLevel: Number(data.playerLevel || 1),
    packageId: String(data.packageId || 'pack'),
    packageName: String(data.packageName || ''),
    packageCategory: (data.packageCategory as Order['packageCategory']) || 'regular',
    diamondsCount: Number(data.diamondsCount || 0),
    amountLKR: Number(data.amountLKR || 0),
    processingFeeLKR: Number(data.processingFeeLKR || 0),
    totalPaidLKR: Number(data.totalPaidLKR || 0),
    paymentMethod: (data.paymentMethod as Order['paymentMethod']) || 'bank_deposit',
    paymentMethodLabel:
      typeof data.paymentMethodLabel === 'string' ? data.paymentMethodLabel : undefined,
    ezCashNumber: typeof data.ezCashNumber === 'string' ? data.ezCashNumber : undefined,
    transactionReference: String(data.transactionReference || ''),
    whatsappNumber: String(data.whatsappNumber || '0758500536'),
    status: (data.status as OrderStatus) || 'pending_verification',
    verifiedAt: typeof data.verifiedAt === 'string' ? data.verifiedAt : undefined,
  };
}

export function subscribeUserOrders(
  uid: string,
  isAdmin: boolean,
  onOrders: (orders: Order[]) => void
) {
  const ordersRef = collection(db, 'orders');
  const q = isAdmin ? query(ordersRef) : query(ordersRef, where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToOrder(d.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onOrders(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  );
}

export async function fetchSavedUidsFromFirestore(uid: string) {
  const path = `users/${uid}/savedUids`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'savedUids'));
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
