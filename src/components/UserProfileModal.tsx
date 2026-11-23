import React, { useState } from 'react';
import { Order, UserAccount } from '../types';
import {
  deleteDriveReceiptFile,
  DriveReceiptFile,
  GmailPaymentMessage,
  listDriveReceiptFiles,
  searchGmailPaymentMessages,
} from '../services/workspaceApi';
import {
  X,
  LogOut,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  ShoppingBag,
  HardDrive,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  orders: Order[];
  walletBalanceLKR: number;
  workspaceAccessToken?: string | null;
  onConnectGoogleWorkspace?: () => void;
  onOpenWallet: () => void;
  onViewOrderReceipt: (order: Order) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  orders,
  walletBalanceLKR,
  workspaceAccessToken = null,
  onConnectGoogleWorkspace,
  onOpenWallet,
  onViewOrderReceipt,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'drive' | 'gmail'>('orders');
  const [driveFiles, setDriveFiles] = useState<DriveReceiptFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveReceiptFile | null>(null);
  const [isDeletingDrive, setIsDeletingDrive] = useState(false);

  const [gmailQuery, setGmailQuery] = useState('eZ Cash OR BOC OR TopUp Hub');
  const [gmailMessages, setGmailMessages] = useState<GmailPaymentMessage[]>([]);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleLoadDrive = async () => {
    setWorkspaceError(null);
    if (!workspaceAccessToken) return;
    setIsLoadingDrive(true);
    try {
      const files = await listDriveReceiptFiles(workspaceAccessToken);
      setDriveFiles(files);
    } catch (err: unknown) {
      setWorkspaceError(
        err instanceof Error ? err.message : 'Unable to load Google Drive receipts.'
      );
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleConfirmDeleteDriveFile = async () => {
    if (!workspaceAccessToken || !confirmDeleteFile) return;
    setIsDeletingDrive(true);
    setWorkspaceError(null);
    try {
      await deleteDriveReceiptFile(workspaceAccessToken, confirmDeleteFile.id);
      setDriveFiles((prev) => prev.filter((f) => f.id !== confirmDeleteFile.id));
      setConfirmDeleteFile(null);
    } catch (err: unknown) {
      setWorkspaceError(
        err instanceof Error ? err.message : 'Failed to delete file from Google Drive.'
      );
    } finally {
      setIsDeletingDrive(false);
    }
  };

  const handleSearchGmail = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setWorkspaceError(null);
    if (!workspaceAccessToken) return;
    setIsLoadingGmail(true);
    try {
      const msgs = await searchGmailPaymentMessages(workspaceAccessToken, gmailQuery);
      setGmailMessages(msgs);
    } catch (err: unknown) {
      setWorkspaceError(
        err instanceof Error ? err.message : 'Unable to search Gmail messages.'
      );
    } finally {
      setIsLoadingGmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B0B0B] border border-[#FACC15]/30 rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#111111]">
          <div className="flex items-center gap-3.5">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full border-2 border-[#FACC15] object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#1A1A1A] border-2 border-[#FACC15] flex items-center justify-center text-[#FACC15] font-black text-base shadow-md shadow-yellow-500/15">
                {currentUser.avatarSeed || currentUser.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h3 className="text-base font-extrabold text-white">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#FACC15]" />
                <span>{currentUser.email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Wallet Summary Row */}
          <div className="p-4 rounded-xl bg-[#141414] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FACC15]/15 border border-[#FACC15]/30 flex items-center justify-center text-[#FACC15]">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  eZ Hub Wallet Balance
                </span>
                <span className="text-lg font-black text-[#FACC15] font-mono">
                  Rs.{' '}
                  {walletBalanceLKR.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWallet();
              }}
              className="px-4 py-2 text-xs font-extrabold text-[#0B0B0B] bg-[#FACC15] hover:bg-yellow-300 rounded-xl transition-colors cursor-pointer"
            >
              Manage / Reload Wallet
            </button>
          </div>

          {/* Section Switcher: Orders / Google Drive Receipts / Gmail Reference Finder */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#141414] rounded-xl border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'orders'
                  ? 'bg-[#FACC15] text-[#0B0B0B]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('drive');
                if (workspaceAccessToken && driveFiles.length === 0) {
                  handleLoadDrive();
                }
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'drive'
                  ? 'bg-[#FACC15] text-[#0B0B0B]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Drive Receipts</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('gmail');
                if (workspaceAccessToken && gmailMessages.length === 0) {
                  handleSearchGmail();
                }
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'gmail'
                  ? 'bg-[#FACC15] text-[#0B0B0B]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail Slips</span>
            </button>
          </div>

          {workspaceError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{workspaceError}</span>
            </div>
          )}

          {/* TAB 1: Order History */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[#141414] border border-white/10 text-slate-400 space-y-1.5">
                  <Receipt className="w-7 h-7 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold text-slate-300">No orders placed yet</p>
                  <p className="text-[11px] text-slate-500">
                    Your completed and pending top-up orders will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {orders.map((order) => {
                    const isCompleted = order.status === 'completed';
                    const isRejected = order.status === 'rejected';
                    return (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-xl bg-[#141414] border border-white/10 hover:border-[#FACC15]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[#FACC15]">
                              {order.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                isCompleted
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : isRejected
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : isRejected ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>
                                {isCompleted
                                  ? 'Paid / Approved'
                                  : isRejected
                                  ? 'Rejected'
                                  : 'Pending Verification'}
                              </span>
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white truncate">
                            {order.gameName} · {order.packageName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {new Date(order.createdAt).toLocaleString()} · Rs.{' '}
                            {order.totalPaidLKR.toFixed(2)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewOrderReceipt(order);
                          }}
                          className="px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:text-[#0B0B0B] bg-white/5 hover:bg-[#FACC15] border border-white/10 hover:border-[#FACC15] rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Google Drive Backed-up Receipts */}
          {activeTab === 'drive' && (
            <div className="space-y-3">
              {!workspaceAccessToken ? (
                <div className="p-6 text-center rounded-xl bg-[#141414] border border-white/10 space-y-3">
                  <HardDrive className="w-8 h-8 mx-auto text-[#FACC15]" />
                  <p className="text-xs font-bold text-white">
                    Connect Google Drive for This Session
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Sign in with Google to view or manage your backed-up TopUp Hub Lanka receipt files.
                  </p>
                  <button
                    type="button"
                    onClick={() => onConnectGoogleWorkspace?.()}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#1F1F1F] text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Sign in with Google</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Saved in &quot;TopUp Hub Lanka Receipts&quot;
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadDrive}
                      disabled={isLoadingDrive}
                      className="px-2.5 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-[11px] font-bold text-[#FACC15] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {confirmDeleteFile && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                      <p className="text-xs font-bold text-rose-200">
                        Delete &quot;{confirmDeleteFile.name}&quot; from Google Drive?
                      </p>
                      <p className="text-[11px] text-rose-300/80">
                        This permanently removes the selected receipt file from your Google Drive.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFile(null)}
                          className="flex-1 py-2 rounded-lg bg-white/10 text-xs font-bold text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmDeleteDriveFile}
                          disabled={isDeletingDrive}
                          className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                        >
                          {isDeletingDrive ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                      </div>
                    </div>
                  )}

                  {driveFiles.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-[#141414] border border-white/10 text-xs text-slate-400">
                      {isLoadingDrive
                        ? 'Loading Google Drive receipts...'
                        : 'No receipt PNGs saved to Google Drive yet.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{file.name}</p>
                            {file.createdTime && (
                              <p className="text-[11px] font-mono text-slate-400">
                                {new Date(file.createdTime).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-[#FACC15] inline-flex items-center gap-1"
                              >
                                <span>View</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteFile(file)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                              title="Delete receipt from Google Drive"
                              aria-label={`Delete ${file.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: Gmail Payment Reference Search */}
          {activeTab === 'gmail' && (
            <div className="space-y-3">
              {!workspaceAccessToken ? (
                <div className="p-6 text-center rounded-xl bg-[#141414] border border-white/10 space-y-3">
                  <Mail className="w-8 h-8 mx-auto text-[#FACC15]" />
                  <p className="text-xs font-bold text-white">Connect Gmail for This Session</p>
                  <p className="text-[11px] text-slate-400">
                    Sign in with Google to search eZ Cash, BOC transfer alerts, or TopUp Hub receipts in Gmail.
                  </p>
                  <button
                    type="button"
                    onClick={() => onConnectGoogleWorkspace?.()}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#1F1F1F] text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Sign in with Google</span>
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSearchGmail} className="flex gap-2">
                    <input
                      type="text"
                      value={gmailQuery}
                      onChange={(e) => setGmailQuery(e.target.value)}
                      placeholder="Search BOC, eZ Cash, or TopUp Hub..."
                      className="flex-1 bg-[#141414] border border-white/15 focus:border-[#FACC15] rounded-xl py-2 px-3 text-xs text-white outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingGmail}
                      className="px-3.5 py-2 rounded-xl bg-[#FACC15] text-[#0B0B0B] text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isLoadingGmail ? 'Searching...' : 'Search'}</span>
                    </button>
                  </form>

                  {gmailMessages.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-[#141414] border border-white/10 text-xs text-slate-400">
                      {isLoadingGmail
                        ? 'Searching Gmail messages...'
                        : 'No matching payment emails found.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {gmailMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 rounded-xl bg-[#141414] border border-white/10 space-y-1"
                        >
                          <p className="text-xs font-bold text-white truncate">{msg.subject}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {msg.from} · {msg.date}
                          </p>
                          {msg.snippet && (
                            <p className="text-[11px] text-slate-300 line-clamp-2">{msg.snippet}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#111111] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2 text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
