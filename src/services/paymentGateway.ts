// Clean payment gateway interface structured for easy replacement with real backend / PG endpoints later.

export interface CardPaymentDetails {
  cardHolder: string;
  billingEmail: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  amountLKR: number;
}

export interface EmailOtpChallenge {
  challengeId: string;
  maskedEmail: string;
  billingEmail: string;
  cardLast4: string;
  cardBrand: string;
  amountLKR: number;
  expiresInSeconds: number;
  // Discreet sandbox OTP code returned in simulated mode so users can test end-to-end without SMTP
  simulatedOtpCode: string;
}

export interface CardOtpVerifyResult {
  approved: boolean;
  transactionReference?: string;
  gatewayAuthCode?: string;
  paidAt?: string;
  error?: string;
}

export function detectCardBrand(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MasterCard';
  if (clean.startsWith('3')) return 'AMEX';
  return 'Card';
}

export function maskEmailAddress(email: string): string {
  const trimmed = email.trim();
  const [local, domain] = trimmed.split('@');
  if (!local || !domain) return trimmed;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(5, Math.max(2, local.length - 2)))}@${domain}`;
}

export function validateCardDetails(details: CardPaymentDetails): string | null {
  const cleanDigits = details.cardNumber.replace(/\D/g, '');
  const cleanExpiry = details.cardExpiry.replace(/\D/g, '');
  const cleanCvv = details.cardCvv.replace(/\D/g, '');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!details.cardHolder.trim() || details.cardHolder.trim().length < 2) {
    return 'Please enter the cardholder full name.';
  }
  if (!details.billingEmail.trim() || !emailRegex.test(details.billingEmail.trim())) {
    return 'Please enter a valid cardholder billing email address for OTP verification.';
  }
  if (cleanDigits.length < 13 || cleanDigits.length > 16) {
    return 'Please enter a valid 13–16 digit Credit / Debit Card number.';
  }
  if (cleanExpiry.length !== 4) {
    return 'Please enter a valid expiry date in MM/YY format.';
  }
  const month = parseInt(cleanExpiry.slice(0, 2), 10);
  if (month < 1 || month > 12) {
    return 'Card expiry month must be between 01 and 12.';
  }
  if (cleanCvv.length < 3 || cleanCvv.length > 4) {
    return 'Please enter a valid 3 or 4 digit CVV security code.';
  }
  return null;
}

/**
 * Initiates a card payment session and dispatches a 6-digit Bank OTP to the cardholder's email.
 * Replace internals with `fetch('/api/payments/card/send-otp', ...)` when connecting a live payment gateway.
 */
export async function sendCardEmailOtp(details: CardPaymentDetails): Promise<EmailOtpChallenge> {
  const validationError = validateCardDetails(details);
  if (validationError) {
    throw new Error(validationError);
  }

  await new Promise((resolve) => setTimeout(resolve, 450));

  const cleanDigits = details.cardNumber.replace(/\D/g, '');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const challengeId = `OTP-${Date.now().toString(36).toUpperCase()}`;

  return {
    challengeId,
    maskedEmail: maskEmailAddress(details.billingEmail),
    billingEmail: details.billingEmail.trim(),
    cardLast4: cleanDigits.slice(-4),
    cardBrand: detectCardBrand(cleanDigits),
    amountLKR: details.amountLKR,
    expiresInSeconds: 60,
    simulatedOtpCode: otp,
  };
}

/**
 * Verifies the cardholder's 6-digit Email OTP and captures the card charge.
 * Replace internals with `fetch('/api/payments/card/verify-otp', ...)` when connecting a live payment gateway.
 */
export async function verifyCardEmailOtpAndCharge(params: {
  challenge: EmailOtpChallenge;
  otpInput: string;
}): Promise<CardOtpVerifyResult> {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const cleanOtp = params.otpInput.replace(/\D/g, '');
  if (cleanOtp.length !== 6) {
    return {
      approved: false,
      error: 'Please enter the 6-digit OTP code sent to your email.',
    };
  }

  if (cleanOtp !== params.challenge.simulatedOtpCode) {
    return {
      approved: false,
      error: 'Incorrect Email OTP code. Please check your inbox and try again.',
    };
  }

  const authSuffix = Math.floor(100000 + Math.random() * 900000);
  return {
    approved: true,
    transactionReference: `CARD-${params.challenge.cardLast4}-${authSuffix}`,
    gatewayAuthCode: `AUTH-${authSuffix}`,
    paidAt: new Date().toLocaleTimeString(),
  };
}
