import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  rewardCoins: integer('reward_coins').notNull().default(0),
  walletBalanceLkr: doublePrecision('wallet_balance_lkr').notNull().default(0.0),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  userEmail: text('user_email').notNull(),
  gameId: text('game_id').notNull(),
  gameName: text('game_name').notNull(),
  playerUid: text('player_uid').notNull(),
  playerIgn: text('player_ign').notNull(),
  playerLevel: integer('player_level').notNull().default(1),
  packageId: text('package_id').notNull(),
  packageName: text('package_name').notNull(),
  packageCategory: text('package_category').notNull(),
  diamondsCount: integer('diamonds_count').notNull().default(0),
  amountLkr: doublePrecision('amount_lkr').notNull(),
  processingFeeLkr: doublePrecision('processing_fee_lkr').notNull().default(0),
  totalPaidLkr: doublePrecision('total_paid_lkr').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentMethodLabel: text('payment_method_label'),
  ezCashNumber: text('ez_cash_number'),
  transactionReference: text('transaction_reference').notNull(),
  whatsappNumber: text('whatsapp_number').notNull(),
  status: text('status').notNull().default('pending_verification'),
  verifiedAt: text('verified_at'),
  cartItemsJson: text('cart_items_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savedUids = pgTable('saved_uids', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  gameId: text('game_id').notNull(),
  playerUid: text('player_uid').notNull(),
  playerIgn: text('player_ign').notNull(),
  playerLevel: integer('player_level').notNull().default(1),
  server: text('server').notNull().default('Asia'),
  zoneId: text('zone_id'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  savedUids: many(savedUids),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userUid],
    references: [users.uid],
  }),
}));

export const savedUidsRelations = relations(savedUids, ({ one }) => ({
  user: one(users, {
    fields: [savedUids.userUid],
    references: [users.uid],
  }),
}));
