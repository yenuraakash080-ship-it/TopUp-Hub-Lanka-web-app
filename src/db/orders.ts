import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { orders, savedUids } from './schema.ts';

export interface CreateOrderInput {
  id: string;
  userUid: string;
  userEmail: string;
  gameId: string;
  gameName: string;
  playerUid: string;
  playerIgn: string;
  playerLevel: number;
  packageId: string;
  packageName: string;
  packageCategory: string;
  diamondsCount: number;
  amountLkr: number;
  processingFeeLkr: number;
  totalPaidLkr: number;
  paymentMethod: string;
  paymentMethodLabel?: string;
  ezCashNumber?: string;
  transactionReference: string;
  whatsappNumber: string;
  cartItemsJson?: string;
}

export async function listOrdersForUser(userUid: string, isOwner: boolean) {
  try {
    if (isOwner) {
      return await db.select().from(orders).orderBy(desc(orders.createdAt));
    }
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userUid, userUid))
      .orderBy(desc(orders.createdAt));
  } catch (error) {
    console.error('Database query failed in listOrdersForUser:', error);
    throw new Error('Failed to load orders.', { cause: error });
  }
}

export async function createOrderRecord(input: CreateOrderInput) {
  try {
    const inserted = await db
      .insert(orders)
      .values({
        id: input.id,
        userUid: input.userUid,
        userEmail: input.userEmail,
        gameId: input.gameId,
        gameName: input.gameName,
        playerUid: input.playerUid,
        playerIgn: input.playerIgn,
        playerLevel: input.playerLevel,
        packageId: input.packageId,
        packageName: input.packageName,
        packageCategory: input.packageCategory,
        diamondsCount: input.diamondsCount,
        amountLkr: input.amountLkr,
        processingFeeLkr: input.processingFeeLkr,
        totalPaidLkr: input.totalPaidLkr,
        paymentMethod: input.paymentMethod,
        paymentMethodLabel: input.paymentMethodLabel || null,
        ezCashNumber: input.ezCashNumber || null,
        transactionReference: input.transactionReference,
        whatsappNumber: input.whatsappNumber,
        status: 'pending_verification',
        cartItemsJson: input.cartItemsJson || null,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length > 0) return inserted[0];

    const fallback = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, input.id), eq(orders.userUid, input.userUid)))
      .limit(1);
    return fallback[0] || null;
  } catch (error) {
    console.error('Database query failed in createOrderRecord:', error);
    throw new Error('Failed to save order.', { cause: error });
  }
}

export async function updateOrderStatusRecord(
  orderId: string,
  nextStatus: 'pending_verification' | 'processing' | 'completed' | 'rejected'
) {
  try {
    const updated = await db
      .update(orders)
      .set({
        status: nextStatus,
        verifiedAt: nextStatus === 'completed' ? new Date().toLocaleTimeString() : null,
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Database query failed in updateOrderStatusRecord:', error);
    throw new Error('Failed to update order status.', { cause: error });
  }
}

export async function listSavedUidsForUser(userUid: string) {
  try {
    return await db
      .select()
      .from(savedUids)
      .where(eq(savedUids.userUid, userUid))
      .orderBy(desc(savedUids.updatedAt));
  } catch (error) {
    console.error('Database query failed in listSavedUidsForUser:', error);
    throw new Error('Failed to load saved player UIDs.', { cause: error });
  }
}

export async function upsertSavedUidRecord(params: {
  userUid: string;
  gameId: string;
  playerUid: string;
  playerIgn: string;
  playerLevel: number;
  server: string;
  zoneId?: string;
}) {
  try {
    const existing = await db
      .select()
      .from(savedUids)
      .where(
        and(
          eq(savedUids.userUid, params.userUid),
          eq(savedUids.gameId, params.gameId),
          eq(savedUids.playerUid, params.playerUid)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(savedUids)
        .set({
          playerIgn: params.playerIgn,
          playerLevel: params.playerLevel,
          server: params.server,
          zoneId: params.zoneId || null,
          updatedAt: new Date(),
        })
        .where(eq(savedUids.id, existing[0].id))
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(savedUids)
      .values({
        userUid: params.userUid,
        gameId: params.gameId,
        playerUid: params.playerUid,
        playerIgn: params.playerIgn,
        playerLevel: params.playerLevel,
        server: params.server,
        zoneId: params.zoneId || null,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database query failed in upsertSavedUidRecord:', error);
    throw new Error('Failed to save player UID.', { cause: error });
  }
}
