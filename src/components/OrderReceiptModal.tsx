import React, { useState } from 'react';
import { Order } from '../types';
import {
  saveReceiptToGoogleDrive,
  sendOrderReceiptViaGmail,
} from '../services/workspaceApi';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  X,
  ArrowRight,
  Download,
  ShieldCheck,
  Mail,
  HardDrive,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface OrderReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenOwnerPortal: () => void;
  workspaceAccessToken?: string | null;
  defaultEmail?: string;
  onRequestGoogleAuth?: () => void;
}

function formatOrderTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getDisplayPaymentMethod(order: Order): string {
  if (order.paymentMethodLabel) return order.paymentMethodLabel;
  if (order.paymentMethod === 'bank_deposit') return 'Bank Transfer (BOC)';
  if (order.paymentMethod === 'ezcash') return 'eZ Cash (0758500536)';
  if (order.paymentMethod === 'ezcash_credit') return 'Web EZ Wallet';
  if (order.paymentMethod === 'redeem_code') return 'Gift Voucher';
  return 'Bank Transfer';
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function generateReceiptImageBlob(order: Order): Promise<Blob> {
  const width = 800;
  const height = 1040;
  const scale = 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Canvas context unavailable'));
  }

  ctx.scale(scale, scale);

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#020617');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  drawRoundedRect(ctx, 28, 28, width - 56, height - 56, 24);
  ctx.fillStyle = '#090f1f';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
  ctx.stroke();

  const headerGrad = ctx.createLinearGradient(28, 28, width - 28, 28);
  headerGrad.addColorStop(0, '#f59e0b');
  headerGrad.addColorStop(0.5, '#facc15');
  headerGrad.addColorStop(1, '#f59e0b');
  drawRoundedRect(ctx, 28, 28, width - 56, 10, 6);
  ctx.fillStyle = headerGrad;
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.font = '900 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOPUP HUB LANKA', 64, 92);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('OFFICIAL DIGITAL TOP-UP RECEIPT', 64, 118);

  const isCompleted = order.status === 'completed';
  const statusLabel = isCompleted ? 'PAID / APPROVED' : 'PENDING VERIFICATION';
  drawRoundedRect(ctx, width - 270, 68, 206, 40, 12);
  ctx.fillStyle = isCompleted ? 'rgba(16, 185, 129, 0.16)' : 'rgba(245, 158, 11, 0.16)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = isCompleted ? '#34d399' : '#fbbf24';
  ctx.stroke();

  ctx.fillStyle = isCompleted ? '#34d399' : '#fbbf24';
  ctx.font = '800 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(statusLabel, width - 167, 93);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, 146);
  ctx.lineTo(width - 64, 146);
  ctx.stroke();

  drawRoundedRect(ctx, 64, 168, width - 128, 86, 16);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.9)';
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px monospace';
  ctx.fillText('ORDER ID', 88, 198);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 22px monospace';
  ctx.fillText(order.id, 88, 230);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px monospace';
  ctx.fillText('DATE & TIME', width - 88, 198);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 16px monospace';
  ctx.fillText(formatOrderTimestamp(order.createdAt), width - 88, 228);
  ctx.textAlign = 'left';

  drawRoundedRect(ctx, 64, 276, width - 128, 140, 16);
  ctx.fillStyle = 'rgba(6, 78, 59, 0.22)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
  ctx.stroke();

  ctx.fillStyle = '#34d399';
  ctx.font = '800 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('VERIFIED PLAYER ACCOUNT', 88, 308);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(order.playerIgn, 88, 344);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 16px monospace';
  ctx.fillText(`Player UID: ${order.playerUid}`, 88, 376);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px monospace';
  ctx.fillText(`Game: ${order.gameName || 'Free Fire'}  ·  Level ${order.playerLevel}`, 88, 400);

  const rows: Array<{ label: string; value: string; highlight?: string }> = [
    { label: 'Purchased Package', value: order.packageName, highlight: '#ffffff' },
    {
      label: 'Package Value',
      value:
        order.diamondsCount > 0
          ? `${order.diamondsCount.toLocaleString()} Credits / Diamonds`
          : order.packageName,
      highlight: '#38bdf8',
    },
    { label: 'Payment Method', value: getDisplayPaymentMethod(order), highlight: '#facc15' },
    { label: 'Transaction Reference', value: order.transactionReference, highlight: '#34d399' },
    {
      label: 'Payment Status',
      value: isCompleted ? 'Paid / Approved' : 'Pending Owner Verification',
      highlight: isCompleted ? '#34d399' : '#fbbf24',
    },
    { label: 'Subtotal', value: `Rs. ${order.amountLKR.toFixed(2)}` },
    { label: 'Processing Charge', value: `Rs. ${order.processingFeeLKR.toFixed(2)}` },
  ];

  let yPos = 458;
  rows.forEach((row, idx) => {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(row.label, 68, yPos);

    ctx.textAlign = 'right';
    ctx.fillStyle = row.highlight || '#e2e8f0';
    ctx.font = '700 16px monospace';
    ctx.fillText(row.value, width - 68, yPos);
    ctx.textAlign = 'left';

    if (idx < rows.length - 1) {
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.95)';
      ctx.beginPath();
      ctx.moveTo(68, yPos + 18);
      ctx.lineTo(width - 68, yPos + 18);
      ctx.stroke();
    }
    yPos += 50;
  });

  drawRoundedRect(ctx, 64, 825, width - 128, 92, 16);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = '800 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOTAL PAID (LKR)', 90, 878);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#facc15';
  ctx.font = '900 32px monospace';
  ctx.fillText(`Rs. ${order.totalPaidLKR.toFixed(2)}`, width - 90, 882);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#64748b';
  ctx.font = '500 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    'Thank you for choosing TopUp Hub Lanka · Fast & Secure Sri Lankan Game Top-Ups',
    64,
    960
  );
  ctx.fillText(`Customer: ${order.billingEmail || order.userEmail || 'Verified Buyer'}`, 64, 984);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate PNG receipt'));
      },
      'image/png',
      1.0
    );
  });
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  onClose,
  onOpenOwnerPortal,
  workspaceAccessToken = null,
  defaultEmail = '',
  onRequestGoogleAuth,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);

  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [gmailSentTo, setGmailSentTo] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  if (!order) return null;

  const isCompleted = order.status === 'completed';
  const paymentLabel = getDisplayPaymentMethod(order);
  const formattedTime = formatOrderTimestamp(order.createdAt);

  const handleCopyDetails = () => {
    const text = [
      'TopUp Hub Lanka — Official Receipt',
      `Order ID: ${order.id}`,
      `Status: ${isCompleted ? 'Paid / Approved' : 'Pending Verification'}`,
      `Date & Time: ${formattedTime}`,
      `Game: ${order.gameName || 'Free Fire'}`,
      `Package: ${order.packageName}`,
      `Player UID: ${order.playerUid}`,
      `Account Name: ${order.playerIgn} (Level ${order.playerLevel})`,
      `Payment Method: ${paymentLabel}`,
      `Reference: ${order.transactionReference}`,
      `Total Paid: Rs. ${order.totalPaidLKR.toFixed(2)}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReceiptImage = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateReceiptImageBlob(order);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TopUpHub-Receipt-${order.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToDrive = async () => {
    setWorkspaceError(null);
    if (!workspaceAccessToken) {
      onRequestGoogleAuth?.();
      return;
    }
    setIsSavingDrive(true);
    try {
      const blob = await generateReceiptImageBlob(order);
      const uploaded = await saveReceiptToGoogleDrive({
        accessToken: workspaceAccessToken,
        order,
        receiptPngBlob: blob,
      });
      setDriveLink(
        uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`
      );
    } catch (err: unknown) {
      setWorkspaceError(
        err instanceof Error ? err.message : 'Unable to save receipt to Google Drive.'
      );
    } finally {
      setIsSavingDrive(false);
    }
  };

  const handleOpenEmailConfirm = () => {
    setWorkspaceError(null);
    if (!workspaceAccessToken) {
      onRequestGoogleAuth?.();
      return;
    }
    setRecipientEmail(defaultEmail || order.userEmail || '');
    setShowEmailConfirm(true);
  };

  const handleConfirmSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceAccessToken) return;
    setWorkspaceError(null);
    setIsSendingGmail(true);
    try {
      const blob = await generateReceiptImageBlob(order);
      await sendOrderReceiptViaGmail({
        accessToken: workspaceAccessToken,
        toEmail: recipientEmail,
        order,
        receiptPngBlob: blob,
      });
      setGmailSentTo(recipientEmail.trim());
      setShowEmailConfirm(false);
    } catch (err: unknown) {
      setWorkspaceError(
        err instanceof Error ? err.message : 'Unable to send receipt email via Gmail.'
      );
    } finally {
      setIsSendingGmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden my-auto">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isCompleted ? 'Payment Approved & Order Confirmed' : 'Order Submitted Successfully'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Order ID: <strong className="text-amber-300">{order.id}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close receipt modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner */}
        <div
          className={`my-4 p-3.5 rounded-xl border flex items-start gap-3 ${
            isCompleted
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          {isCompleted ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className={`text-xs font-bold ${isCompleted ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isCompleted
                ? 'Payment Paid / Approved — Diamonds Credited'
                : 'Pending Store Owner Manual Verification'}
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              {isCompleted
                ? `Your ${order.packageName} purchase for ${order.playerIgn} (UID: ${order.playerUid}) is complete.`
                : `Your ${paymentLabel} reference (${order.transactionReference}) is queued for verification against store number 0758500536.`}
            </p>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
            <span>Order ID:</span>
            <span className="text-amber-300 font-bold">{order.id}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
            <span>Timestamp:</span>
            <span className="text-slate-200 text-right">{formattedTime}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
            <span>Game &amp; Package:</span>
            <span className="text-white font-bold text-right">
              {order.gameName || 'Free Fire'} · {order.packageName}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
            <span>Verified Player UID:</span>
            <span className="text-white font-bold">{order.playerUid}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
            <span>Account Name:</span>
            <span className="text-emerald-400 font-bold">
              {order.playerIgn} (Lv. {order.playerLevel})
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
            <span>Payment Method:</span>
            <span className="text-cyan-300 font-bold">{paymentLabel}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
            <span>Payment Status:</span>
            <span className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isCompleted ? 'Paid / Approved' : 'Pending Verification'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
            <span>Reference / Auth:</span>
            <span className="text-slate-200 font-bold text-right truncate max-w-[220px]">
              {order.transactionReference}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300 pt-1 text-sm font-bold">
            <span>Total Paid (LKR):</span>
            <span className="text-amber-400 text-base">Rs. {order.totalPaidLKR.toFixed(2)}</span>
          </div>
        </div>

        {/* Workspace Confirmation Dialog for Emailing Receipt via Gmail */}
        {showEmailConfirm && (
          <form
            onSubmit={handleConfirmSendGmail}
            className="mt-4 p-4 rounded-xl bg-slate-950 border border-blue-500/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>Confirm Gmail Receipt Delivery</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowEmailConfirm(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This will send an email from your Gmail account containing receipt{' '}
              <strong className="text-white">{order.id}</strong> and its PNG attachment.
            </p>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@gmail.com"
              className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg py-2 px-3 text-xs font-mono text-white outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmailConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingGmail}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
              >
                {isSendingGmail ? 'Sending Email...' : 'Confirm & Send Email'}
              </button>
            </div>
          </form>
        )}

        {workspaceError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{workspaceError}</span>
          </div>
        )}

        {gmailSentTo && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Receipt emailed via Gmail to {gmailSentTo}</span>
          </div>
        )}

        {driveLink && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Saved to Google Drive</span>
            </span>
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline inline-flex items-center gap-1 text-emerald-200 hover:text-white"
            >
              <span>Open</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadReceiptImage}
            disabled={isDownloading}
            className="w-full py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloaded
                ? 'Receipt Image Downloaded!'
                : isDownloading
                ? 'Generating Receipt PNG...'
                : 'Download Receipt (Image)'}
            </span>
          </button>

          {/* Gmail & Google Drive Receipt Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleSaveToDrive}
              disabled={isSavingDrive}
              className="py-2.5 px-3 text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isSavingDrive ? 'Saving...' : 'Save to Drive'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenEmailConfirm}
              className="py-2.5 px-3 text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Email via Gmail</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyDetails}
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Receipt Copied!' : 'Copy Details'}</span>
            </button>

            {!isCompleted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOwnerPortal();
                }}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Owner Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
