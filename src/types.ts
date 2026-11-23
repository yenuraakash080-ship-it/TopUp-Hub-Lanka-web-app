export type PackageCategory = 'regular' | 'bonus' | 'membership';

export type PaymentMethod =
  | 'card'
  | 'lanka_qr'
  | 'ipay'
  | 'ezcash_credit'
  | 'bank_deposit'
  | 'binance_pay'
  | 'ezcash'
  | 'genuine'
  | 'redeem_code';

export type CheckoutPaymentMethod =
  | 'genuine_gateway'
  | 'bank_transfer'
  | 'ez_cash'
  | 'ez_hub_wallet';

export interface GameItem {
  id: string;
  name: string;
  currencyName: string;
  currencyIcon: string;
  publisher: string;
  themeColor: string;
  badge?: string;
  region?: string;
  isFeatured?: boolean;
  isActiveCatalog?: boolean;
  uidLabel: string;
  uidPlaceholder: string;
  uidHelper: string;
  hasServerSelect?: boolean;
  hasZoneId?: boolean;
  sampleUid: string;
  sampleIgn: string;
  sampleLevel: number;
  imageSrc: string;
}

export interface VerifiedPlayer {
  uid: string;
  ign: string;
  level: number;
  server: string;
  zoneId?: string;
  gameId: string;
  verifiedAt: string;
}

export interface TopUpPackage {
  id: string;
  gameId?: string;
  name: string;
  category: PackageCategory;
  diamonds: number;
  bonusDiamonds?: number;
  priceLKR: number;
  avg30DayPriceLKR?: number;
  badge?: string;
  description: string;
  features?: string[];
  popular?: boolean;
  imageSrc?: string;
}

export interface CartItem {
  package: TopUpPackage;
  game: GameItem;
  quantity: number;
}

export interface UserAccount {
  uid?: string;
  email: string;
  name: string;
  avatarSeed: string;
  isLoggedIn: boolean;
  authProvider: 'google' | 'email';
  avatarUrl?: string;
  rewardCoins?: number;
  role?: 'customer' | 'owner';
}

export type OrderStatus = 'pending_verification' | 'processing' | 'completed' | 'rejected';

export interface Order {
  id: string;
  userId?: string;
  createdAt: string;
  gameId: string;
  gameName: string;
  userEmail: string;
  playerUid: string;
  playerIgn: string;
  playerLevel: number;
  packageId: string;
  packageName: string;
  packageCategory: PackageCategory;
  diamondsCount: number;
  amountLKR: number;
  processingFeeLKR: number;
  totalPaidLKR: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel?: string;
  billingEmail?: string;
  gatewayAuthCode?: string;
  ezCashNumber?: string;
  senderMobile?: string;
  transactionReference: string;
  redeemCode?: string;
  whatsappNumber: string;
  customerNote?: string;
  screenshotUrl?: string;
  status: OrderStatus;
  verifiedAt?: string;
  adminNote?: string;
  cartItems?: CartItem[];
}

export interface CheckoutFormData {
  ezCashRnNumber: string;
  ezCashSenderPhone: string;
  whatsappNumber: string;
  screenshotPreview: string | null;
  screenshotName: string | null;
  cardHolder: string;
  cardBillingEmail: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  redeemCode: string;
  redeemSuccess: string | null;
}
