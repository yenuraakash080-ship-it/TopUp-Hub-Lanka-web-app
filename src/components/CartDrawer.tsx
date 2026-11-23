import React from 'react';
import { CartItem } from '../types';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: 'LKR' | 'USDT';
  onUpdateQuantity: (packageId: string, delta: number) => void;
  onRemoveItem: (packageId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

const LKR_PER_USDT = 300.0;

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const subtotalLKR = cartItems.reduce(
    (sum, item) => sum + item.package.priceLKR * item.quantity,
    0
  );

  const formatMoney = (amountLKR: number) => {
    if (currency === 'USDT') {
      return `${(amountLKR / LKR_PER_USDT).toFixed(2)} USDT`;
    }
    return `Rs. ${amountLKR.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0B0B0D] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100">
          {/* Header: Shopping bag icon + "Your Cart" + Close X */}
          <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141416]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-[#F5C400]/15 text-amber-600 dark:text-[#F5C400] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">Your Cart</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {cartItems.reduce((sum, i) => sum + i.quantity, 0)} items selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close Your Cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cartItems.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#141416] border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  Your cart is empty
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Select a game and tap + on any top-up package to add it to Your Cart.
                </p>
              </div>
            ) : (
              cartItems.map((item) => {
                const lineTotalLKR = item.package.priceLKR * item.quantity;
                return (
                  <div
                    key={item.package.id}
                    className="bg-slate-50 dark:bg-[#141416] border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-white dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={item.package.imageSrc || item.game.imageSrc}
                          alt={item.package.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Title + Unit price x qty */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {item.package.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.game.name}
                        </p>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5 tabular-nums">
                          {formatMoney(item.package.priceLKR)} x {item.quantity}
                        </p>
                      </div>

                      {/* Line Total */}
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                          {formatMoney(lineTotalLKR)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper + Remove */}
                    <div className="pt-2.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.package.id)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>

                      <div className="flex items-center bg-white dark:bg-[#0B0B0D] border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.package.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold font-mono tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.package.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Total Summary + Checkout Now Button */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141416] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Total Amount
                </span>
                <span className="text-xl font-black font-mono tabular-nums text-blue-600 dark:text-blue-400">
                  {formatMoney(subtotalLKR)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-[#F5C400] to-orange-500 hover:from-amber-400 hover:to-orange-400 text-[#0B0B0D] text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
