import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

function getConfiguredAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string,
  avatarUrl?: string
) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const displayName = (name || cleanEmail.split('@')[0] || 'Player').slice(0, 120);
  const adminEmail = getConfiguredAdminEmail();
  const role = adminEmail && cleanEmail === adminEmail ? 'owner' : 'customer';

  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        name: displayName,
        avatarUrl: avatarUrl || null,
        rewardCoins: 0,
        walletBalanceLkr: 0.0,
        role,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: cleanEmail,
          name: displayName,
          avatarUrl: avatarUrl || null,
          role,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Failed to load user profile.', { cause: error });
  }
}

export async function addRewardCoins(uid: string, coinsToAdd: number) {
  try {
    const existing = await getUserByUid(uid);
    if (!existing) return null;
    const nextCoins = Math.max(0, existing.rewardCoins + Math.max(0, Math.round(coinsToAdd)));
    const updated = await db
      .update(users)
      .set({ rewardCoins: nextCoins, updatedAt: new Date() })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('Database query failed in addRewardCoins:', error);
    throw new Error('Failed to update reward coins.', { cause: error });
  }
}

export async function updateWalletBalanceLkr(uid: string, newBalanceLkr: number) {
  try {
    const safeBalance = Math.max(0, Number(newBalanceLkr.toFixed(2)));
    const updated = await db
      .update(users)
      .set({ walletBalanceLkr: safeBalance, updatedAt: new Date() })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('Database query failed in updateWalletBalanceLkr:', error);
    throw new Error('Failed to update wallet balance.', { cause: error });
  }
}
