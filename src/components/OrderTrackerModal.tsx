import React, { useState } from 'react';
import { Order } from '../types';
import { Search, Clock, CheckCircle2, XCircle, X, ShieldAlert, ArrowRight } from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const results = orders.filter((o) => {
    if (!query.trim()) return false;
    const q = query.trim().toUpperCase();
    return (
      o.id.toUpperCase().includes(q) ||
      o.transactionReference.toUpperCase().includes(q) ||
      o.playerUid.includes(q) ||
      Boolean(o.senderMobile?.includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Track Top-Up Order Status</h3>
              <p className="text-xs text-slate-400">Search by Order ID, eZ Cash RN Reference, or UID</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="my-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearched(true);
              }}
              placeholder="Enter Order ID (e.g. THL-8492) or RN Number"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none font-mono"
            />
          </div>

          {/* Quick shortcuts if recent orders exist */}
          {orders.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-slate-400">
              <span className="text-slate-500">Recent:</span>
              {orders.slice(0, 3).map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setQuery(o.id);
                    setSearched(true);
                  }}
                  className="font-mono text-cyan-400 hover:underline cursor-pointer bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
                >
                  {o.id} ({o.playerIgn})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {searched && query.trim() && results.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
              <ShieldAlert className="w-8 h-8 mx-auto text-amber-400/60 mb-2" />
              <p className="text-xs font-semibold text-slate-300">No matching order found.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Please double-check your Order ID or the exact eZ Cash RN number submitted.
              </p>
            </div>
          ) : (
            results.map((order) => (
              <div
                key={order.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white">{order.id}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                    order.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : order.status === 'pending_verification'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {order.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed & Credited</span>
                      </>
                    ) : order.status === 'pending_verification' ? (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Pending Owner Verification</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px] pt-1 border-t border-slate-800/60">
                  <div>Package: <strong className="text-slate-200">{order.packageName}</strong></div>
                  <div>Amount: <strong className="text-amber-400">Rs. {order.totalPaidLKR.toFixed(2)}</strong></div>
                  <div>{order.gameName || 'Player'} UID: <strong className="text-cyan-400">{order.playerUid}</strong></div>
                  <div>Reference: <strong className="text-emerald-400">{order.transactionReference}</strong></div>
                </div>
              </div>
            ))
          )}

          {!query.trim() && orders.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Your Stored Orders:</span>
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => {
                    setQuery(o.id);
                    setSearched(true);
                  }}
                  className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-between cursor-pointer transition-colors text-xs font-mono"
                >
                  <div>
                    <span className="text-white font-bold">{o.id}</span>
                    <span className="text-slate-400 ml-2">{o.packageName}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${
                    o.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {o.status === 'completed' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
