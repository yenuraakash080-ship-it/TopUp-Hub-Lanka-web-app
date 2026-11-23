import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';
import { addRewardCoins, getOrCreateUser, updateWalletBalanceLkr } from './src/db/users.ts';
import {
  createOrderRecord,
  listOrdersForUser,
  listSavedUidsForUser,
  updateOrderStatusRecord,
  upsertSavedUidRecord,
} from './src/db/orders.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function isOwnerUser(email?: string): boolean {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) return false;
  return (email || '').trim().toLowerCase() === adminEmail;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      const name = req.user!.name || email.split('@')[0] || 'Player';
      const picture = req.user!.picture || undefined;
      const user = await getOrCreateUser(uid, email, name, picture);
      res.json({
        ...user,
        isAdmin: isOwnerUser(email),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load profile.';
      console.error('GET /api/me error:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      await getOrCreateUser(uid, email, req.user!.name, req.user!.picture);
      const rows = await listOrdersForUser(uid, isOwnerUser(email));
      res.json({ orders: rows });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load orders.';
      console.error('GET /api/orders error:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      await getOrCreateUser(uid, email, req.user!.name, req.user!.picture);

      const body = req.body || {};
      const orderId = typeof body.id === 'string' ? body.id.trim().slice(0, 32) : '';
      const gameId = typeof body.gameId === 'string' ? body.gameId.trim().slice(0, 64) : '';
      const gameName = typeof body.gameName === 'string' ? body.gameName.trim().slice(0, 100) : '';
      const playerUid = typeof body.playerUid === 'string' ? body.playerUid.trim().slice(0, 64) : '';
      const playerIgn = typeof body.playerIgn === 'string' ? body.playerIgn.trim().slice(0, 80) : 'Player Account';
      const packageId = typeof body.packageId === 'string' ? body.packageId.trim().slice(0, 64) : 'pack';
      const packageName = typeof body.packageName === 'string' ? body.packageName.trim().slice(0, 200) : '';
      const packageCategory =
        body.packageCategory === 'bonus' || body.packageCategory === 'membership'
          ? body.packageCategory
          : 'regular';
      const paymentMethod =
        typeof body.paymentMethod === 'string' ? body.paymentMethod.trim().slice(0, 32) : 'bank_deposit';
      const transactionReference =
        typeof body.transactionReference === 'string' ? body.transactionReference.trim().slice(0, 100) : '';
      const whatsappNumber =
        typeof body.whatsappNumber === 'string' ? body.whatsappNumber.trim().slice(0, 20) : '0758500536';

      const amountLkr = Number(body.amountLKR);
      const processingFeeLkr = Number(body.processingFeeLKR || 0);
      const totalPaidLkr = Number(body.totalPaidLKR);
      const diamondsCount = Math.max(0, Math.round(Number(body.diamondsCount || 0)));
      const playerLevel = Math.max(1, Math.round(Number(body.playerLevel || 1)));

      if (
        !orderId ||
        !gameId ||
        !gameName ||
        playerUid.length < 4 ||
        !packageName ||
        transactionReference.length < 3 ||
        !Number.isFinite(amountLkr) ||
        amountLkr <= 0 ||
        !Number.isFinite(totalPaidLkr) ||
        totalPaidLkr <= 0
      ) {
        return res.status(400).json({ error: 'Invalid order details.' });
      }

      const saved = await createOrderRecord({
        id: orderId,
        userUid: uid,
        userEmail: email,
        gameId,
        gameName,
        playerUid,
        playerIgn,
        playerLevel,
        packageId,
        packageName,
        packageCategory,
        diamondsCount,
        amountLkr,
        processingFeeLkr: Number.isFinite(processingFeeLkr) ? processingFeeLkr : 0,
        totalPaidLkr,
        paymentMethod,
        paymentMethodLabel:
          typeof body.paymentMethodLabel === 'string' ? body.paymentMethodLabel.slice(0, 80) : undefined,
        ezCashNumber:
          typeof body.ezCashNumber === 'string' ? body.ezCashNumber.slice(0, 20) : undefined,
        transactionReference,
        whatsappNumber,
        cartItemsJson: Array.isArray(body.cartItems) ? JSON.stringify(body.cartItems).slice(0, 20000) : undefined,
      });

      const earnedCoins = Math.max(5, Math.round(totalPaidLkr * 0.02));
      const updatedUser = await addRewardCoins(uid, earnedCoins);

      res.status(201).json({
        order: saved,
        rewardCoins: updatedUser?.rewardCoins,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create order.';
      console.error('POST /api/orders error:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.patch('/api/orders/:id/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user!.email || '';
      if (!isOwnerUser(email)) {
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
      }
      const orderId = decodeURIComponent(req.params.id);
      const nextStatus = req.body?.status;
      if (
        nextStatus !== 'pending_verification' &&
        nextStatus !== 'processing' &&
        nextStatus !== 'completed' &&
        nextStatus !== 'rejected'
      ) {
        return res.status(400).json({ error: 'Invalid order status.' });
      }
      const updated = await updateOrderStatusRecord(orderId, nextStatus);
      if (!updated) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      res.json({ order: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update order status.';
      console.error('PATCH /api/orders/:id/status error:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.patch('/api/wallet', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      await getOrCreateUser(uid, email, req.user!.name, req.user!.picture);
      const nextBalance = Number(req.body?.walletBalanceLKR);
      if (!Number.isFinite(nextBalance) || nextBalance < 0 || nextBalance > 100000000) {
        return res.status(400).json({ error: 'Invalid wallet balance.' });
      }
      const updated = await updateWalletBalanceLkr(uid, nextBalance);
      res.json({ walletBalanceLkr: updated?.walletBalanceLkr ?? nextBalance });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update wallet balance.';
      console.error('PATCH /api/wallet error:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.get('/api/saved-uids', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const rows = await listSavedUidsForUser(uid);
      res.json({ savedUids: rows });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load saved UIDs.';
      console.error('GET /api/saved-uids error:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/saved-uids', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      await getOrCreateUser(uid, email, req.user!.name, req.user!.picture);

      const body = req.body || {};
      const gameId = typeof body.gameId === 'string' ? body.gameId.trim().slice(0, 64) : '';
      const playerUid = typeof body.playerUid === 'string' ? body.playerUid.trim().slice(0, 64) : '';
      const playerIgn = typeof body.playerIgn === 'string' ? body.playerIgn.trim().slice(0, 80) : '';
      const playerLevel = Math.max(1, Math.round(Number(body.playerLevel || 1)));
      const server = typeof body.server === 'string' ? body.server.trim().slice(0, 60) : 'Asia';
      const zoneId = typeof body.zoneId === 'string' ? body.zoneId.trim().slice(0, 32) : undefined;

      if (!gameId || playerUid.length < 4 || !playerIgn) {
        return res.status(400).json({ error: 'Invalid player UID data.' });
      }

      const saved = await upsertSavedUidRecord({
        userUid: uid,
        gameId,
        playerUid,
        playerIgn,
        playerLevel,
        server,
        zoneId,
      });
      res.status(201).json({ savedUid: saved });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save player UID.';
      console.error('POST /api/saved-uids error:', error);
      res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
