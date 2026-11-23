import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { ShieldCheck, Check, Clock, X, AlertCircle, RefreshCw, CheckCircle2, User, Phone, DollarSign } from 'lucide-react';

interface OwnerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onClearOrders: () => void;
}

export const OwnerDashboardModal: React.FC<OwnerDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  onClearOrders,
}) => {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  if (!isOpen) return null;

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  const pendingCount = orders.filter((o) => o.status === 'pending_verification').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const totalLKR = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.amountLKR, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Store Owner Verification Console</h3>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  eZ Cash: 0758500536
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manually verify incoming RN references against your eZ Cash balance to credit player diamonds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-center">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[11px] text-amber-300 font-semibold uppercase block">Pending Verification</span>
            <span className="text-xl font-black text-amber-400 font-mono">{pendingCount}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[11px] text-emerald-300 font-semibold uppercase block">Verified & Sent</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{completedCount}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[11px] text-cyan-300 font-semibold uppercase block">Processed Revenue</span>
            <span className="text-xl font-black text-cyan-400 font-mono">Rs. {totalLKR.toLocaleString()}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Filter Orders:</span>
            {(['all', 'pending_verification', 'completed', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  filter === st
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st === 'all'
                  ? 'All'
                  : st === 'pending_verification'
                  ? 'Pending'
                  : st === 'completed'
                  ? 'Approved'
                  : 'Rejected'}
              </button>
            ))}
          </div>

          {orders.length > 0 && (
            <button
              onClick={onClearOrders}
              className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear Order History
            </button>
          )}
        </div>

        {/* Orders List Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-400">No orders matching this filter.</p>
              <p className="text-xs text-slate-500 mt-1">Submit a top-up on the main page to test verification.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`p-4 rounded-xl border transition-all ${
                  order.status === 'pending_verification'
                    ? 'bg-slate-950/90 border-amber-500/40 shadow-sm'
                    : order.status === 'completed'
                    ? 'bg-slate-950/60 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                      {(order.gameName || 'FF').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{order.playerIgn}</span>
                        <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded">
                          {order.gameName || 'Free Fire'} · Lvl {order.playerLevel}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">ID: {order.playerUid}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Purchased: <strong className="text-slate-200">{order.packageName}</strong> · <span className="font-mono text-amber-400 font-bold">Rs. {order.amountLKR.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] ${
                      order.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : order.status === 'pending_verification'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {order.status === 'completed'
                        ? 'Verified & Sent'
                        : order.status === 'pending_verification'
                        ? 'Pending Review'
                        : 'Rejected'}
                    </span>
                  </div>
                </div>

                {/* Reference & Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-3 font-mono">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {order.paymentMethodLabel ? `${order.paymentMethodLabel} Ref:` : 'Payment Reference:'}
                    </span>
                    <strong className="text-emerald-400 text-sm tracking-wide">{order.transactionReference}</strong>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Sender Mobile:</span>
                    <span className="text-slate-200">{order.senderMobile}</span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Customer Email / WhatsApp:</span>
                    <span className="text-slate-300 truncate block">{order.whatsappNumber || order.userEmail}</span>
                  </div>
                </div>

                {order.customerNote && (
                  <p className="text-xs text-slate-400 italic mt-2 bg-slate-900/50 p-2 rounded border border-slate-800">
                    Note: "{order.customerNote}"
                  </p>
                )}

                {/* Owner Verification Controls */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Order ID: {order.id} · {new Date(order.createdAt).toLocaleTimeString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {order.status !== 'completed' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Approve (Send Diamonds)</span>
                      </button>
                    )}

                    {order.status === 'pending_verification' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'rejected')}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all cursor-pointer"
                      >
                        <span>Reject / Bad RN</span>
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved & Credited</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
