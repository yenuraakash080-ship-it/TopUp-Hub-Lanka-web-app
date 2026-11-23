import React, { useState, useEffect } from 'react';
import {
  CartItem,
  CheckoutFormData,
  CheckoutPaymentMethod,
  GameItem,
  Order,
  UserAccount,
  VerifiedPlayer,
} from '../types';
import {
  BOC_BANK_DETAILS,
  EZCASH_MERCHANT_NUMBER,
  WHATSAPP_ADMIN_NUMBER,
} from '../data/packages';
import { generateReceiptImageBlob } from './OrderReceiptModal';
import {
  saveReceiptToGoogleDrive,
  sendOrderReceiptViaGmail,
} from '../services/workspaceApi';
import {
  X,
  Landmark,
  Smartphone,
  Copy,
  Check,
  Clock,
  Send,
  Download,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Receipt,
  HardDrive,
  Mail,
  CheckCircle2,
  CreditCard,
  Wallet,
  Lock,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface CheckoutFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  selectedGame: GameItem;
  verifiedPlayer: VerifiedPlayer | null;
  currentUser: UserAccount | null;
  existingOrders: Order[];
  walletBalanceLKR: number;
  selectedMethod: CheckoutPaymentMethod;
  onSelectMethod: (method: CheckoutPaymentMethod) => void;
  formData: CheckoutFormData;
  onUpdateFormData: (patch: Partial<CheckoutFormData>) => void;
  onClaimToHubWallet: (params: {
    amountLKR: number;
    senderMobile: string;
    rnNumber: string;
  }) => { ok: boolean; message: string };
  onSubmitOrder: (order: Order) => void;
  workspaceAccessToken?: string | null;
  onRequestGoogleAuth?: () => void;
}

function generateUniqueOrderId(existingOrders: Order[]): string {
  const existingNumbers = existingOrders
    .map((o) => {
      const match = o.id.match(/^#?ORD-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n >= 1024);

  const nextNum =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1024;
  return `#ORD-${nextNum}`;
}

function buildWhatsAppReceiptUrl(params: {
  orderId: string;
  gameName: string;
  playerUid: string;
  playerIgn?: string;
  packageSummary: string;
  amountLKR: number;
  paymentMethodLabel: string;
  referenceId: string;
}): string {
  const message = [
    '*TopUp Hub Lanka - Payment Confirmation*',
    '',
    `Order ID: ${params.orderId}`,
    `Game: ${params.gameName}`,
    `Game UID: ${params.playerUid}${params.playerIgn ? ` (${params.playerIgn})` : ''}`,
    `Selected Package: ${params.packageSummary}`,
    `Amount: Rs. ${params.amountLKR.toFixed(2)}`,
    `Payment Method: ${params.paymentMethodLabel}`,
    `Reference ID: ${params.referenceId}`,
    '',
    'Please find my payment screenshot attached below.',
  ].join('\n');

  return `https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;
}

function formatCardNumberDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiryDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function detectCardBrand(cardNumber: string): 'VISA' | 'Mastercard' | 'AMEX' | 'UnionPay' {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.startsWith('4')) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'AMEX';
  if (digits.startsWith('62')) return 'UnionPay';
  return 'VISA';
}

export const CheckoutFlowModal: React.FC<CheckoutFlowModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  selectedGame,
  verifiedPlayer,
  currentUser,
  existingOrders,
  walletBalanceLKR,
  selectedMethod,
  onSelectMethod,
  formData,
  onUpdateFormData,
  onClaimToHubWallet,
  onSubmitOrder,
  workspaceAccessToken = null,
  onRequestGoogleAuth,
}) => {
  const [copiedKey, setCopiedKey] = useState<'boc' | 'ezcash' | null>(null);
  const [referenceInput, setReferenceInput] = useState('');
  const [ezCashSenderInput, setEzCashSenderInput] = useState('');
  const [ezCashReloadAmount, setEzCashReloadAmount] = useState('');
  const [manualUidInput, setManualUidInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [claimBanner, setClaimBanner] = useState<{ ok: boolean; text: string } | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  // Genuine Payment Gateway multi-step state (Card Entry -> Waiting Confirmation -> 3DS OTP)
  const [gatewayStep, setGatewayStep] = useState<'card_form' | 'waiting' | 'otp'>('card_form');
  const [otpInput, setOtpInput] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(420);
  const [otpResentBanner, setOtpResentBanner] = useState(false);

  const primaryGame = cartItems[0]?.game || selectedGame;
  const subtotalLKR = cartItems.reduce(
    (sum, item) => sum + item.package.priceLKR * item.quantity,
    0
  );
  const totalDiamonds = cartItems.reduce(
    (sum, item) => sum + item.package.diamonds * item.quantity,
    0
  );
  const packageSummary =
    cartItems.length > 0
      ? cartItems
          .map((i) => (i.quantity > 1 ? `${i.quantity}x ${i.package.name}` : i.package.name))
          .join(', ')
      : 'Top-Up Package';

  useEffect(() => {
    if (isOpen) {
      setSubmittedOrder(null);
      setWhatsappUrl('');
      setFormError(null);
      setClaimBanner(null);
      setReferenceInput(formData.ezCashRnNumber || '');
      setEzCashSenderInput(formData.ezCashSenderPhone || '');
      setEzCashReloadAmount(subtotalLKR > 0 ? subtotalLKR.toFixed(0) : '1000');
      setManualUidInput(verifiedPlayer?.uid || '');
      setCopiedKey(null);
      setDriveUrl(null);
      setShowEmailConfirm(false);
      setEmailSentTo(null);
      setWorkspaceError(null);
      setGatewayStep('card_form');
      setOtpInput('');
      setOtpCountdown(420);
      setOtpResentBanner(false);
    }
  }, [isOpen, verifiedPlayer, formData.ezCashRnNumber, formData.ezCashSenderPhone, subtotalLKR]);

  useEffect(() => {
    if (!isOpen || gatewayStep !== 'otp') return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, gatewayStep]);

  if (!isOpen) return null;

  const handleCopyNumber = async (text: string, key: 'boc' | 'ezcash') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.className = 'sr-only';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const getValidatedUid = (): string | null => {
    if (cartItems.length === 0) {
      setFormError('Your cart is empty. Please add a top-up package first.');
      return null;
    }
    const effectiveUid = (verifiedPlayer?.uid || manualUidInput).trim();
    if (!effectiveUid || effectiveUid.length < 4) {
      setFormError('Please enter your Game UID before continuing.');
      return null;
    }
    return effectiveUid;
  };

  const finalizeOrder = (params: {
    paymentMethod: Order['paymentMethod'];
    paymentMethodLabel: string;
    referenceId: string;
    ezCashNumber?: string;
    senderMobile?: string;
    gatewayAuthCode?: string;
    openWhatsApp?: boolean;
  }) => {
    const effectiveUid = getValidatedUid();
    if (!effectiveUid) return;

    const orderId = generateUniqueOrderId(existingOrders);
    const primaryItem = cartItems[0];
    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      gameId: primaryItem?.game.id || primaryGame.id,
      gameName: primaryItem?.game.name || primaryGame.name,
      userEmail: currentUser?.email || '',
      playerUid: effectiveUid,
      playerIgn: verifiedPlayer?.ign || 'Player Account',
      playerLevel: verifiedPlayer?.level || primaryGame.sampleLevel,
      packageId: primaryItem?.package.id || 'pack',
      packageName: packageSummary,
      packageCategory: primaryItem?.package.category || 'regular',
      diamondsCount: totalDiamonds,
      amountLKR: subtotalLKR,
      processingFeeLKR: 0,
      totalPaidLKR: subtotalLKR,
      paymentMethod: params.paymentMethod,
      paymentMethodLabel: params.paymentMethodLabel,
      ezCashNumber: params.ezCashNumber,
      senderMobile: params.senderMobile,
      gatewayAuthCode: params.gatewayAuthCode,
      transactionReference: params.referenceId,
      whatsappNumber: EZCASH_MERCHANT_NUMBER,
      status: 'pending_verification',
      cartItems: [...cartItems],
    };

    const waLink = buildWhatsAppReceiptUrl({
      orderId,
      gameName: newOrder.gameName,
      playerUid: effectiveUid,
      playerIgn: verifiedPlayer?.ign,
      packageSummary,
      amountLKR: subtotalLKR,
      paymentMethodLabel: params.paymentMethodLabel,
      referenceId: params.referenceId,
    });

    setWhatsappUrl(waLink);
    setSubmittedOrder(newOrder);
    onSubmitOrder(newOrder);

    if (params.openWhatsApp) {
      const linkEl = document.createElement('a');
      linkEl.href = waLink;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
    }
  };

  // Handler 1: Genuine Payment Gateway (Card Form -> Waiting Confirmation -> OTP)
  const handleStartGenuineGateway = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!getValidatedUid()) return;

    const holder = formData.cardHolder.trim();
    const digits = formData.cardNumber.replace(/\D/g, '');
    const expiry = formData.cardExpiry.trim();
    const cvv = formData.cardCvv.trim();

    if (holder.length < 2) {
      setFormError('Please enter the cardholder name.');
      return;
    }
    if (digits.length < 13 || digits.length > 16) {
      setFormError('Please enter a valid 13 to 16-digit Debit or Credit card number.');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setFormError('Please enter card expiry in MM/YY format.');
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      setFormError('Please enter a valid 3 or 4-digit CVV.');
      return;
    }

    setGatewayStep('waiting');
    setTimeout(() => {
      setOtpCountdown(420);
      setOtpInput('');
      setGatewayStep('otp');
    }, 1350);
  };

  const handleConfirmGatewayOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanOtp = otpInput.replace(/\D/g, '');
    if (cleanOtp.length < 4 || cleanOtp.length > 8) {
      setFormError('Please enter the 4–6 digit OTP verification code.');
      return;
    }

    const digits = formData.cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4) || '0000';
    const brand = detectCardBrand(digits);
    const authCode = `PG-${Date.now().toString().slice(-6)}`;

    // Immediately clear card digits and CVV before finalizing
    onUpdateFormData({ cardNumber: '', cardExpiry: '', cardCvv: '' });
    setGatewayStep('card_form');

    finalizeOrder({
      paymentMethod: 'genuine',
      paymentMethodLabel: `Genuine Payment Gateway (${brand} •••• ${last4})`,
      referenceId: `${authCode} (•••• ${last4})`,
      gatewayAuthCode: authCode,
      openWhatsApp: false,
    });
  };

  // Handler 2: eZ Hub Wallet Instant Pay
  const handlePayWithHubWallet = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!currentUser?.isLoggedIn) {
      onRequestGoogleAuth?.();
      return;
    }
    if (!getValidatedUid()) return;

    if (walletBalanceLKR < subtotalLKR) {
      setFormError(
        `Insufficient eZ Hub Wallet balance. You need Rs. ${(subtotalLKR - walletBalanceLKR).toFixed(2)} more.`
      );
      return;
    }

    const walletRef = `HUB-WLT-${Date.now().toString().slice(-6)}`;
    finalizeOrder({
      paymentMethod: 'ezcash_credit',
      paymentMethodLabel: 'eZ Hub Wallet Balance',
      referenceId: walletRef,
      openWhatsApp: false,
    });
  };

  // Handler 3A: Claim eZ Cash Direct Reload into Hub Wallet
  const handleClaimToHubWalletClick = () => {
    setFormError(null);
    setClaimBanner(null);

    if (!currentUser?.isLoggedIn) {
      onRequestGoogleAuth?.();
      return;
    }

    const cleanSender = ezCashSenderInput.trim();
    if (!cleanSender || cleanSender.length < 9) {
      setFormError('Please enter your eZ Cash mobile number to reload.');
      return;
    }

    const cleanRn = referenceInput.trim().toUpperCase();
    if (!cleanRn || cleanRn.length < 6) {
      setFormError('Please enter your eZ Cash RN Number to claim to Hub Wallet.');
      return;
    }

    const amountNum = parseFloat(ezCashReloadAmount) || subtotalLKR;
    if (!amountNum || amountNum < 50) {
      setFormError('Minimum eZ Cash reload amount is Rs. 50.00.');
      return;
    }

    const result = onClaimToHubWallet({
      amountLKR: amountNum,
      senderMobile: cleanSender,
      rnNumber: cleanRn,
    });

    setClaimBanner({ ok: result.ok, text: result.message });
    if (result.ok) {
      onUpdateFormData({ ezCashRnNumber: '', ezCashSenderPhone: cleanSender });
      setReferenceInput('');
    }
  };

  // Handler 3B & 4: Submit Direct eZ Cash or BOC Bank Transfer Order + WhatsApp
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!getValidatedUid()) return;

    const cleanRef = referenceInput.trim();
    if (!cleanRef || cleanRef.length < 3) {
      setFormError('Please enter your Transaction Reference ID / RN Number.');
      return;
    }

    if (selectedMethod === 'ez_cash') {
      const cleanSender = ezCashSenderInput.trim();
      if (!cleanSender || cleanSender.length < 9) {
        setFormError('Please enter your eZ Cash mobile number.');
        return;
      }
      onUpdateFormData({ ezCashRnNumber: cleanRef, ezCashSenderPhone: cleanSender });
      finalizeOrder({
        paymentMethod: 'ezcash',
        paymentMethodLabel: `eZ Cash Direct Reload (${cleanSender})`,
        referenceId: cleanRef,
        ezCashNumber: EZCASH_MERCHANT_NUMBER,
        senderMobile: cleanSender,
        openWhatsApp: true,
      });
    } else {
      onUpdateFormData({ ezCashRnNumber: cleanRef });
      finalizeOrder({
        paymentMethod: 'bank_deposit',
        paymentMethodLabel: 'Bank Transfer (BOC)',
        referenceId: cleanRef,
        openWhatsApp: true,
      });
    }
  };

  const handleDownloadReceipt = async () => {
    if (!submittedOrder) return;
    setIsDownloadingReceipt(true);
    try {
      const blob = await generateReceiptImageBlob(submittedOrder);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TopUpHub-Receipt-${submittedOrder.id.replace('#', '')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!submittedOrder) return;
    setWorkspaceError(null);
    if (!workspaceAccessToken) {
      onRequestGoogleAuth?.();
      return;
    }
    setIsSavingDrive(true);
    try {
      const blob = await generateReceiptImageBlob(submittedOrder);
      const file = await saveReceiptToGoogleDrive({
        accessToken: workspaceAccessToken,
        order: submittedOrder,
        receiptPngBlob: blob,
      });
      setDriveUrl(file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`);
    } catch (err: unknown) {
      setWorkspaceError(
        err instanceof Error ? err.message : 'Unable to save receipt to Google Drive.'
      );
    } finally {
      setIsSavingDrive(false);
    }
  };

  const handleOpenEmailConfirm = () => {
    if (!submittedOrder) return;
    setWorkspaceError(null);
    if (!workspaceAccessToken) {
      onRequestGoogleAuth?.();
      return;
    }
    setEmailRecipient(currentUser?.email || submittedOrder.userEmail || '');
    setShowEmailConfirm(true);
  };

  const handleConfirmSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedOrder || !workspaceAccessToken) return;
    setWorkspaceError(null);
    setIsSendingEmail(true);
    try {
      const blob = await generateReceiptImageBlob(submittedOrder);
      await sendOrderReceiptViaGmail({
        accessToken: workspaceAccessToken,
        toEmail: emailRecipient,
        order: submittedOrder,
        receiptPngBlob: blob,
      });
      setEmailSentTo(emailRecipient.trim());
      setShowEmailConfirm(false);
    } catch (err: unknown) {
      setWorkspaceError(
        err instanceof Error ? err.message : 'Unable to send receipt email via Gmail.'
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const methodOptions: {
    id: CheckoutPaymentMethod;
    title: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'genuine_gateway',
      title: 'Genuine Payment Gateway',
      subtitle: 'Debit / Credit Card (Visa, MC, Amex, UnionPay)',
      icon: CreditCard,
      badge: 'OTP Secured',
    },
    {
      id: 'ez_hub_wallet',
      title: 'eZ Hub Wallet',
      subtitle: currentUser?.isLoggedIn
        ? `Balance: Rs. ${walletBalanceLKR.toFixed(2)}`
        : 'Sign in to use wallet balance',
      icon: Wallet,
      badge: 'Instant',
    },
    {
      id: 'ez_cash',
      title: 'eZ Cash Direct Reload',
      subtitle: 'My eZ Cash No + RN No · Claim Hub Wallet',
      icon: Smartphone,
    },
    {
      id: 'bank_transfer',
      title: 'Bank Transfer (BOC)',
      subtitle: `BOC Account ${BOC_BANK_DETAILS.accountNumber}`,
      icon: Landmark,
    },
  ];

  const isWaitingOrOtp = selectedMethod === 'genuine_gateway' && gatewayStep !== 'card_form';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B0B0D] border border-[#F5C400]/30 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5C400]/15 border border-[#F5C400]/40 text-[#F5C400] flex items-center justify-center">
              {submittedOrder ? (
                <Clock className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#F5C400]">
                {submittedOrder
                  ? 'Order Submitted — Confirmation'
                  : 'Secure Payment & Checkout'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {submittedOrder
                  ? `Order ${submittedOrder.id} saved to your order history`
                  : 'Genuine Card Gateway, eZ Hub Wallet, eZ Cash Direct Reload & BOC Transfer'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close payment modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!submittedOrder ? (
          <div className="p-5 sm:p-6 space-y-5 max-h-[84vh] overflow-y-auto">
            {/* Order Summary Strip */}
            <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Selected Package ({primaryGame.name})
                </p>
                <p className="text-sm font-extrabold text-white truncate">
                  {packageSummary}
                </p>
                {verifiedPlayer ? (
                  <p className="text-xs font-mono text-emerald-400">
                    UID: {verifiedPlayer.uid} · {verifiedPlayer.ign}
                  </p>
                ) : (
                  <p className="text-xs text-amber-300">
                    Enter your {primaryGame.name} UID below
                  </p>
                )}
              </div>

              <div className="sm:text-right shrink-0">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Payable Amount
                </span>
                <span className="text-2xl font-black font-mono tabular-nums text-[#F5C400]">
                  Rs. {subtotalLKR.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Game UID Input when player wasn't pre-verified */}
            {!verifiedPlayer && !isWaitingOrOtp && (
              <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10">
                <label
                  htmlFor="checkout-game-uid"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  Game UID ({primaryGame.name}) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="checkout-game-uid"
                  type="text"
                  required
                  value={manualUidInput}
                  onChange={(e) => {
                    setManualUidInput(e.target.value);
                    setFormError(null);
                  }}
                  placeholder={primaryGame.uidPlaceholder || 'Enter your Game UID'}
                  className="w-full bg-[#0B0B0D] border border-white/15 focus:border-[#F5C400] rounded-xl py-2.5 px-3.5 text-sm font-mono text-white placeholder-slate-500 outline-none"
                />
              </div>
            )}

            {/* Payment Method Selector Grid + Unavailable Methods Notice */}
            {!isWaitingOrOtp && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {methodOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = selectedMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onSelectMethod(opt.id);
                          setFormError(null);
                          setClaimBanner(null);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          active
                            ? 'bg-[#19160E] border-[#F5C400] ring-1 ring-[#F5C400]/30'
                            : 'bg-[#141416] border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-[#F5C400] text-[#0B0B0D]'
                              : 'bg-white/5 text-[#F5C400] border border-white/10'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-black text-white truncate">
                              {opt.title}
                            </span>
                            {opt.badge && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#F5C400]/15 text-[#F5C400] border border-[#F5C400]/30 shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {opt.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Unavailable Channels: LankaQR, iPay, Binance Pay */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'LankaQR', note: 'QR Payments' },
                    { name: 'iPay', note: 'App Checkout' },
                    { name: 'Binance Pay', note: 'USDT Crypto' },
                  ].map((unavailable) => (
                    <div
                      key={unavailable.name}
                      aria-disabled="true"
                      className="p-2.5 rounded-xl bg-[#101012] border border-white/5 opacity-60 cursor-not-allowed flex flex-col justify-between gap-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-400 truncate">
                          {unavailable.name}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25 shrink-0">
                          Unavailable
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate">
                        {unavailable.note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. GENUINE PAYMENT GATEWAY (Card Entry -> Waiting Confirmation -> 3DS OTP) */}
            {selectedMethod === 'genuine_gateway' && (
              <div className="rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl overflow-hidden">
                {/* Dialog Pay Business Banner Header */}
                <div className="bg-gradient-to-r from-[#0F2942] via-[#133A5E] to-[#1D4E7B] px-5 py-3.5 text-white flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-sky-200 font-bold">
                      Genuine Payment Gateway
                    </p>
                    <p className="text-sm font-black tracking-wide">
                      TOPUP HUB LANKA
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-sky-200 block">Transaction amount</span>
                    <span className="text-base font-black font-mono">
                      Rs {subtotalLKR.toFixed(2)}
                    </span>
                  </div>
                </div>

                {gatewayStep === 'card_form' && (
                  <form onSubmit={handleStartGenuineGateway} className="p-5 space-y-4">
                    {/* Card Brand Row matching Reference Screenshot */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-4 border-[#1D6FD6] bg-white inline-block" />
                        <span className="text-sm font-bold text-slate-800">
                          Debit / Credit Card
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black">
                        <span className="px-1.5 py-0.5 rounded bg-teal-600 text-white">UnionPay</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-900 text-white">VISA</span>
                        <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white">Mastercard</span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-600 text-white">AMEX</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Name on card
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.cardHolder}
                        onChange={(e) => {
                          onUpdateFormData({ cardHolder: e.target.value });
                          setFormError(null);
                        }}
                        placeholder="Name on card"
                        className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={formData.cardNumber}
                        onChange={(e) => {
                          onUpdateFormData({
                            cardNumber: formatCardNumberDisplay(e.target.value),
                          });
                          setFormError(null);
                        }}
                        placeholder="1234 1234 1234 1234"
                        maxLength={19}
                        className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl py-2.5 px-3.5 text-sm font-mono text-slate-900 placeholder-slate-400 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          MM/YY
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={formData.cardExpiry}
                          onChange={(e) => {
                            onUpdateFormData({
                              cardExpiry: formatExpiryDisplay(e.target.value),
                            });
                            setFormError(null);
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl py-2.5 px-3.5 text-sm font-mono text-slate-900 placeholder-slate-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          required
                          value={formData.cardCvv}
                          onChange={(e) => {
                            onUpdateFormData({
                              cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                            });
                            setFormError(null);
                          }}
                          placeholder="CVV"
                          maxLength={4}
                          className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl py-2.5 px-3.5 text-sm font-mono text-slate-900 placeholder-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 px-5 rounded-xl bg-[#1D6FD6] hover:bg-[#175BB3] text-white text-sm font-extrabold shadow-md transition-all cursor-pointer"
                    >
                      Pay Rs {subtotalLKR.toFixed(2)}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Payment secured and powered by Genuine Payment Gateway</span>
                    </div>
                  </form>
                )}

                {gatewayStep === 'waiting' && (
                  <div className="p-8 text-center space-y-4">
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#1D6FD6]">TOPUP HUB LANKA</p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5">
                        Rs {subtotalLKR.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">Transaction amount</p>
                    </div>

                    <div className="py-8 flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 text-slate-800 animate-spin" />
                      <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
                        Waiting for confirmation. Please do not close or navigate away from this screen.
                      </p>
                    </div>
                  </div>
                )}

                {gatewayStep === 'otp' && (
                  <form onSubmit={handleConfirmGatewayOtp} className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                      <span className="font-extrabold text-slate-800">
                        Lanka Bank Secure 3DS
                      </span>
                      <span className="font-bold text-orange-600">
                        mastercard ID Check / Verified by VISA
                      </span>
                    </div>

                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-extrabold text-[#1F3A60]">
                        Purchase Authentication
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                        We have sent you a text message with an OTP code to your registered mobile
                        number and email address. You are paying merchant{' '}
                        <strong>TOPUP HUB LANKA</strong> the amount of{' '}
                        <strong>LKR {subtotalLKR.toFixed(2)}</strong>.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="gateway-otp-input"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Enter your code below:
                      </label>
                      <input
                        id="gateway-otp-input"
                        type="text"
                        inputMode="numeric"
                        required
                        value={otpInput}
                        onChange={(e) => {
                          setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                          setFormError(null);
                        }}
                        placeholder="Enter 6-digit OTP code (e.g. 123456)"
                        className="w-full bg-white border border-slate-300 focus:border-[#0077B6] rounded-xl py-2.5 px-3.5 text-sm font-mono tracking-widest text-slate-900 outline-none"
                      />
                    </div>

                    {otpResentBanner && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                        A fresh OTP verification code has been dispatched.
                      </p>
                    )}

                    {formError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#0077B6] hover:bg-[#006299] text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        CONFIRM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCountdown(420);
                          setOtpResentBanner(true);
                        }}
                        className="w-full py-2.5 rounded-lg bg-slate-500 hover:bg-slate-600 text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        RESEND
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGatewayStep('card_form');
                          setOtpInput('');
                          setFormError(null);
                        }}
                        className="w-full py-2.5 rounded-lg bg-slate-400 hover:bg-slate-500 text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        CANCEL
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 text-center">
                      The page will automatically timeout after {otpCountdown} seconds.
                    </p>
                  </form>
                )}
              </div>
            )}

            {/* 2. EZ HUB WALLET INSTANT CHECKOUT */}
            {selectedMethod === 'ez_hub_wallet' && (
              <form
                onSubmit={handlePayWithHubWallet}
                className="p-5 rounded-2xl bg-[#141416] border border-[#F5C400]/30 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0B0B0D] border border-white/10">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                      My eZ Hub Wallet Balance
                    </span>
                    <span className="text-2xl font-black font-mono text-[#F5C400]">
                      Rs. {walletBalanceLKR.toFixed(2)}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 block">Order Total</span>
                    <span className="text-base font-black font-mono text-white">
                      Rs. {subtotalLKR.toFixed(2)}
                    </span>
                  </div>
                </div>

                {!currentUser?.isLoggedIn ? (
                  <div className="space-y-3 text-center py-2">
                    <p className="text-xs text-slate-300">
                      Sign in with Google or your Email address to access and pay using your personal eZ Hub Wallet.
                    </p>
                    <button
                      type="button"
                      onClick={() => onRequestGoogleAuth?.()}
                      className="w-full py-3 px-4 rounded-xl bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D] text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Sign In to Use eZ Hub Wallet
                    </button>
                  </div>
                ) : walletBalanceLKR < subtotalLKR ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Your eZ Hub Wallet needs{' '}
                        <strong className="font-mono">
                          Rs. {(subtotalLKR - walletBalanceLKR).toFixed(2)}
                        </strong>{' '}
                        more. Use <strong>eZ Cash Direct Reload</strong> to claim funds via your eZ Cash number &amp; RN number!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectMethod('ez_cash');
                        setFormError(null);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B0B0D] text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Go to eZ Cash Direct Reload →
                    </button>
                  </div>
                ) : (
                  <>
                    {formError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#F5C400] to-[#FFB800] hover:from-[#FFD22E] hover:to-[#F5C400] text-[#0B0B0D] text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Pay Rs. {subtotalLKR.toFixed(2)} with eZ Hub Wallet</span>
                    </button>
                  </>
                )}
              </form>
            )}

            {/* 3. EZ CASH DIRECT RELOAD (My eZ Cash Number + RN Number + Claim Hub Wallet button) */}
            {selectedMethod === 'ez_cash' && (
              <form
                onSubmit={handleManualSubmit}
                className="p-4 sm:p-5 rounded-2xl bg-[#141416] border border-emerald-500/30 space-y-4"
              >
                <div className="p-3.5 rounded-xl bg-[#0B0B0D] border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Send eZ Cash Reload To Store Number
                    </span>
                    <span className="text-lg font-black font-mono tracking-wider text-emerald-400">
                      {EZCASH_MERCHANT_NUMBER}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyNumber(EZCASH_MERCHANT_NUMBER, 'ezcash')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0 ${
                      copiedKey === 'ezcash'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D]'
                    }`}
                  >
                    {copiedKey === 'ezcash' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="checkout-ezcash-sender"
                      className="block text-xs font-bold text-slate-300 mb-1.5"
                    >
                      My eZ Cash Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="checkout-ezcash-sender"
                      type="tel"
                      required
                      value={ezCashSenderInput}
                      onChange={(e) => {
                        setEzCashSenderInput(e.target.value);
                        setFormError(null);
                      }}
                      placeholder="0771234567"
                      className="w-full bg-[#0B0B0D] border border-white/15 focus:border-[#F5C400] rounded-xl py-2.5 px-3 text-sm font-mono text-white placeholder-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-ezcash-rn"
                      className="block text-xs font-bold text-slate-300 mb-1.5"
                    >
                      RN Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="checkout-ezcash-rn"
                      type="text"
                      required
                      value={referenceInput}
                      onChange={(e) => {
                        setReferenceInput(e.target.value.toUpperCase());
                        setFormError(null);
                      }}
                      placeholder="RN20261123001234"
                      className="w-full bg-[#0B0B0D] border border-white/15 focus:border-[#F5C400] rounded-xl py-2.5 px-3 text-sm font-mono uppercase text-white placeholder-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-ezcash-amount"
                      className="block text-xs font-bold text-slate-300 mb-1.5"
                    >
                      Reload Amount (LKR)
                    </label>
                    <input
                      id="checkout-ezcash-amount"
                      type="number"
                      min="50"
                      step="10"
                      value={ezCashReloadAmount}
                      onChange={(e) => {
                        setEzCashReloadAmount(e.target.value);
                        setFormError(null);
                      }}
                      placeholder={subtotalLKR.toFixed(0)}
                      className="w-full bg-[#0B0B0D] border border-white/15 focus:border-[#F5C400] rounded-xl py-2.5 px-3 text-sm font-mono text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                {claimBanner && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                      claimBanner.ok
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {claimBanner.ok ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{claimBanner.text}</span>
                    </span>
                    {claimBanner.ok && (
                      <button
                        type="button"
                        onClick={() => onSelectMethod('ez_hub_wallet')}
                        className="px-2.5 py-1 rounded-lg bg-[#F5C400] text-[#0B0B0D] font-black text-[11px] shrink-0 cursor-pointer"
                      >
                        Pay via Wallet →
                      </button>
                    )}
                  </div>
                )}

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleClaimToHubWalletClick}
                    className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B0B0D] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Claim Hub Wallet</span>
                  </button>

                  <button
                    type="submit"
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#F5C400] to-[#FFB800] hover:from-[#FFD22E] hover:to-[#F5C400] text-[#0B0B0D] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit &amp; Send on WhatsApp</span>
                  </button>
                </div>
              </form>
            )}

            {/* 4. BANK TRANSFER (BOC 84845021 - Strictly NO QR codes) */}
            {selectedMethod === 'bank_transfer' && (
              <form
                onSubmit={handleManualSubmit}
                className="p-4 sm:p-5 rounded-2xl bg-[#141416] border border-white/10 space-y-4"
              >
                <div className="p-3.5 rounded-xl bg-[#0B0B0D] border border-white/10 space-y-2.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Bank Name:</span>
                    <span className="font-bold text-white">{BOC_BANK_DETAILS.bankName}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#141416] border border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Account Number</span>
                      <span className="text-base font-black font-mono tracking-wider text-[#F5C400]">
                        {BOC_BANK_DETAILS.accountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(BOC_BANK_DETAILS.accountNumber, 'boc')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0 ${
                        copiedKey === 'boc'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#F5C400] hover:bg-[#FFB800] text-[#0B0B0D]'
                      }`}
                    >
                      {copiedKey === 'boc' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="font-semibold text-slate-200">{BOC_BANK_DETAILS.accountName}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Branch:</span>
                    <span className="font-semibold text-slate-200">{BOC_BANK_DETAILS.branch}</span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="transaction-reference-input"
                    className="block text-xs font-bold text-slate-300 mb-1.5"
                  >
                    Transaction Reference ID / Receipt Number
                  </label>
                  <input
                    id="transaction-reference-input"
                    type="text"
                    required
                    value={referenceInput}
                    onChange={(e) => {
                      setReferenceInput(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="e.g., BOC-928410 / Slip Receipt No."
                    className="w-full bg-[#0B0B0D] border border-white/15 focus:border-[#F5C400] rounded-xl py-2.5 px-3.5 text-sm font-mono text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#F5C400] to-[#FFB800] hover:from-[#FFD22E] hover:to-[#F5C400] text-[#0B0B0D] text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit &amp; Send Receipt on WhatsApp</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Post-Submit Confirmation View */
          <div className="p-5 sm:p-6 space-y-5 max-h-[84vh] overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <span>Pending Verification</span>
              </div>
              <h4 className="text-xl font-black text-white">
                Order {submittedOrder.id} Saved!
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {submittedOrder.paymentMethod === 'bank_deposit' ||
                submittedOrder.paymentMethod === 'ezcash'
                  ? 'Send your payment screenshot on WhatsApp to 0758500536 so our team can verify and credit your package.'
                  : 'Your payment authorization has been recorded and queued for fast top-up delivery.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Receipt className="w-4 h-4 text-[#F5C400]" />
                <span className="font-extrabold text-sm text-white">Transaction Summary</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID</span>
                <span className="font-mono font-bold text-[#F5C400]">{submittedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-amber-300">Pending Verification</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Selected Package</span>
                <span className="font-bold text-white text-right">{submittedOrder.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Game UID</span>
                <span className="font-mono font-bold text-white">{submittedOrder.playerUid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method</span>
                <span className="font-bold text-slate-200">{submittedOrder.paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reference ID</span>
                <span className="font-mono font-bold text-emerald-400">
                  {submittedOrder.transactionReference}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="text-slate-400 font-semibold">Amount</span>
                <span className="font-mono font-black text-[#F5C400]">
                  Rs. {submittedOrder.totalPaidLKR.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {(submittedOrder.paymentMethod === 'bank_deposit' ||
                submittedOrder.paymentMethod === 'ezcash') && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B0B0D] text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Screenshot on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={handleDownloadReceipt}
                disabled={isDownloadingReceipt}
                className="w-full py-3 px-4 rounded-xl bg-[#141416] hover:bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-[#F5C400]" />
                <span>
                  {isDownloadingReceipt ? 'PREPARING RECEIPT...' : 'Download Receipt (PNG)'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveToDrive}
                  disabled={isSavingDrive}
                  className="py-2.5 px-3 rounded-xl bg-[#141416] hover:bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                >
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSavingDrive ? 'Saving...' : 'Save to Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenEmailConfirm}
                  className="py-2.5 px-3 rounded-xl bg-[#141416] hover:bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Email via Gmail</span>
                </button>
              </div>

              {showEmailConfirm && (
                <form
                  onSubmit={handleConfirmSendEmail}
                  className="p-3.5 rounded-xl bg-[#141416] border border-blue-500/40 space-y-2.5"
                >
                  <p className="text-[11px] text-slate-300">
                    Confirm sending receipt <strong className="text-white">{submittedOrder.id}</strong> via Gmail to:
                  </p>
                  <input
                    type="email"
                    required
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="recipient@gmail.com"
                    className="w-full bg-[#0B0B0D] border border-white/15 focus:border-blue-500 rounded-lg py-2 px-3 text-xs font-mono text-white outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmailConfirm(false)}
                      className="flex-1 py-2 rounded-lg bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingEmail}
                      className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                    >
                      {isSendingEmail ? 'Sending...' : 'Confirm & Send'}
                    </button>
                  </div>
                </form>
              )}

              {workspaceError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{workspaceError}</span>
                </div>
              )}

              {driveUrl && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Saved to Google Drive</span>
                  </span>
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline inline-flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {emailSentTo && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Receipt sent via Gmail to {emailSentTo}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
