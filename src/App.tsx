/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserAccount,
  TopUpPackage,
  Order,
  OrderStatus,
  GameItem,
  CartItem,
  VerifiedPlayer,
  CheckoutPaymentMethod,
  CheckoutFormData,
} from './types';
import { ALL_GAMES } from './data/games';
import {
  firebaseLogout,
  getAccessToken,
  subscribeAuthState,
} from './lib/firebase';
import {
  saveOrderToFirestore,
  saveVerifiedPlayerToFirestore,
  subscribeUserOrders,
  syncUserProfileToFirestore,
  updateOrderStatusInFirestore,
  updateUserBalancesInFirestore,
} from './services/firestoreSync';
import {
  fetchCloudSqlOrders,
  saveOrderToCloudSql,
  saveVerifiedUidToCloudSql,
  syncCloudSqlProfile,
  updateOrderStatusInCloudSql,
  updateWalletBalanceInCloudSql,
} from './services/cloudSqlApi';
import {
  clearLegacyGlobalStorage,
  loadActiveEmailSession,
  loadUserAccountData,
  normalizeEmail,
  saveActiveEmailSession,
  saveUserAccountData,
} from './services/userStorage';
import { ShoppingBag } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { GameSelector } from './components/GameSelector';
import { GameDetailView } from './components/GameDetailView';
import { HowItWorksSection } from './components/HowItWorksSection';
import { GoogleLoginModal } from './components/GoogleLoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { WalletModal, WalletTransaction } from './components/WalletModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutFlowModal } from './components/CheckoutFlowModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { OwnerDashboardModal } from './components/OwnerDashboardModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { Footer } from './components/Footer';

const STORAGE_KEY_CART = 'topuphub_cart';

// Clear any legacy un-isolated keys from earlier builds on module startup
clearLegacyGlobalStorage();

export default function App() {
  // 1. User Account State (starts logged-out for new visitors; restores only explicit email session)
  const [initialEmailSession] = useState<UserAccount | null>(() => loadActiveEmailSession());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(initialEmailSession);

  // Track which email currently owns the in-memory wallet/orders state to prevent cross-account writes
  const activeDataEmailRef = useRef<string>(
    initialEmailSession ? normalizeEmail(initialEmailSession.email) : ''
  );

  // In-memory only Google Workspace OAuth access token (never persisted in storage)
  const [workspaceAccessToken, setWorkspaceAccessToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // 2. User-Isolated EZ Hub Wallet Balance & Transactions State (always Rs. 0.00 & [] for new users/logged-out)
  const [walletBalanceLKR, setWalletBalanceLKR] = useState<number>(() =>
    initialEmailSession ? loadUserAccountData(initialEmailSession.email).walletBalanceLKR : 0
  );

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() =>
    initialEmailSession ? loadUserAccountData(initialEmailSession.email).walletTransactions : []
  );

  // 3. Navigation & Catalog View State
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);
  const [catalogMode, setCatalogMode] = useState<'featured' | 'active'>('featured');
  const [verifiedPlayer, setVerifiedPlayer] = useState<VerifiedPlayer | null>(null);
  const [currency, setCurrency] = useState<'LKR' | 'USDT'>('LKR');

  // 4. Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // 5. Checkout Payment Method & Form Data
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<CheckoutPaymentMethod>('genuine_gateway');

  const [checkoutFormData, setCheckoutFormData] = useState<CheckoutFormData>({
    ezCashRnNumber: '',
    ezCashSenderPhone: '',
    whatsappNumber: '',
    screenshotPreview: null,
    screenshotName: null,
    cardHolder: '',
    cardBillingEmail: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    redeemCode: '',
    redeemSuccess: null,
  });

  const handleUpdateCheckoutFormData = useCallback((patch: Partial<CheckoutFormData>) => {
    setCheckoutFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  // 6. User-Isolated Orders State (always empty [] for new users or logged-out visitors)
  const [orders, setOrders] = useState<Order[]>(() =>
    initialEmailSession ? loadUserAccountData(initialEmailSession.email).orders : []
  );

  // 7. Modals & Theme/Language State
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'EN' | 'SI' | 'TA'>('EN');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Firebase Auth listener + Cloud SQL & Firestore synchronization
  useEffect(() => {
    const unsubscribeAuth = subscribeAuthState(async (fbUser, token) => {
      setWorkspaceAccessToken(token || getAccessToken());
      setAuthReady(true);

      if (!fbUser) {
        const emailSession = loadActiveEmailSession();
        if (emailSession) {
          const email = normalizeEmail(emailSession.email);
          const data = loadUserAccountData(email);
          activeDataEmailRef.current = email;
          setCurrentUser({ ...emailSession, rewardCoins: data.rewardCoins });
          setWalletBalanceLKR(data.walletBalanceLKR);
          setWalletTransactions(data.walletTransactions);
          setOrders(data.orders);
        } else {
          activeDataEmailRef.current = '';
          setCurrentUser(null);
          setWalletBalanceLKR(0);
          setWalletTransactions([]);
          setOrders([]);
          setVerifiedPlayer(null);
          setLatestOrder(null);
        }
        return;
      }

      // Google Firebase user signed in: clear any local email-only session marker
      saveActiveEmailSession(null);

      const email = normalizeEmail(fbUser.email || '');
      const name = fbUser.displayName || email.split('@')[0] || 'Player';
      const localData = loadUserAccountData(email);

      activeDataEmailRef.current = email;
      setWalletBalanceLKR(localData.walletBalanceLKR);
      setWalletTransactions(localData.walletTransactions);
      setOrders(localData.orders);
      setVerifiedPlayer(null);

      const baseAccount: UserAccount = {
        uid: fbUser.uid,
        email,
        name,
        avatarSeed: (name[0] || email[0] || 'P').toUpperCase(),
        avatarUrl: fbUser.photoURL || undefined,
        isLoggedIn: true,
        authProvider: 'google',
        rewardCoins: localData.rewardCoins,
        role: 'customer',
      };
      setCurrentUser(baseAccount);

      let syncedBalance = localData.walletBalanceLKR;
      let syncedCoins = localData.rewardCoins;

      try {
        const fsProfile = await syncUserProfileToFirestore({
          uid: fbUser.uid,
          email,
          name,
          rewardCoins: localData.rewardCoins,
          walletBalanceLKR: localData.walletBalanceLKR,
        });
        syncedCoins = fsProfile.rewardCoins;
        syncedBalance = fsProfile.walletBalanceLKR;
        if (activeDataEmailRef.current === email) {
          setCurrentUser((prev) =>
            prev ? { ...prev, rewardCoins: syncedCoins } : baseAccount
          );
          setWalletBalanceLKR(syncedBalance);
          saveUserAccountData(email, {
            walletBalanceLKR: syncedBalance,
            walletTransactions: localData.walletTransactions,
            orders: localData.orders,
            rewardCoins: syncedCoins,
          });
        }
      } catch (err) {
        console.error('Firestore profile sync skipped:', err);
      }

      try {
        const sqlProfile = await syncCloudSqlProfile();
        if (sqlProfile && activeDataEmailRef.current === email) {
          const isAdmin = Boolean(sqlProfile.isAdmin);
          const nextCoins = sqlProfile.rewardCoins ?? syncedCoins;
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  rewardCoins: nextCoins,
                  role: isAdmin ? 'owner' : 'customer',
                }
              : prev
          );
          const sqlOrders = await fetchCloudSqlOrders();
          const scopedOrders = isAdmin
            ? sqlOrders
            : sqlOrders.filter(
                (o) => normalizeEmail(o.userEmail || '') === email || o.userId === fbUser.uid
              );
          const seen = new Set(scopedOrders.map((o) => o.id));
          const remaining = localData.orders.filter((o) => !seen.has(o.id));
          const merged = [...scopedOrders, ...remaining].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(merged);
          saveUserAccountData(email, {
            walletBalanceLKR: syncedBalance,
            walletTransactions: localData.walletTransactions,
            orders: merged,
            rewardCoins: nextCoins,
          });
        }
      } catch (err) {
        console.error('Cloud SQL sync unavailable:', err);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Attach Firestore orders real-time listener only when auth is ready & Google-authenticated
  useEffect(() => {
    if (!authReady || !currentUser?.isLoggedIn || !currentUser.uid) return;
    const activeEmail = normalizeEmail(currentUser.email);
    const isAdmin = currentUser.role === 'owner';

    const unsubscribeOrders = subscribeUserOrders(
      currentUser.uid,
      isAdmin,
      (remoteOrders) => {
        if (activeDataEmailRef.current !== activeEmail) return;
        const scopedRemote = isAdmin
          ? remoteOrders
          : remoteOrders.filter(
              (o) => normalizeEmail(o.userEmail || '') === activeEmail || o.userId === currentUser.uid
            );
        if (scopedRemote.length > 0) {
          setOrders((prev) => {
            const ownPrev = prev.filter(
              (o) => normalizeEmail(o.userEmail || '') === activeEmail || o.userId === currentUser.uid
            );
            const seen = new Set(scopedRemote.map((o) => o.id));
            const localOnly = ownPrev.filter((o) => !seen.has(o.id));
            return [...scopedRemote, ...localOnly].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
      }
    );

    return () => unsubscribeOrders();
  }, [authReady, currentUser?.isLoggedIn, currentUser?.uid, currentUser?.email, currentUser?.role]);

  // Persist current logged-in user's isolated wallet & order history strictly under their normalized email key
  useEffect(() => {
    if (!currentUser?.isLoggedIn || !currentUser.email) return;
    const email = normalizeEmail(currentUser.email);
    if (!email || activeDataEmailRef.current !== email) return;

    saveUserAccountData(email, {
      walletBalanceLKR,
      walletTransactions,
      orders,
      rewardCoins: currentUser.rewardCoins ?? 0,
    });
  }, [currentUser, walletBalanceLKR, walletTransactions, orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
  }, [cartItems]);

  // Game selection -> Open Game Detail Page
  const handleSelectGame = (game: GameItem) => {
    setActiveGame(game);
    if (verifiedPlayer && verifiedPlayer.gameId !== game.id) {
      setVerifiedPlayer(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verified Player handler -> also persists to Firestore & Cloud SQL when Google-signed-in
  const handleVerifyPlayer = (player: VerifiedPlayer | null) => {
    setVerifiedPlayer(player);
    if (player && currentUser?.isLoggedIn && currentUser.uid) {
      saveVerifiedPlayerToFirestore(currentUser.uid, player).catch((err) =>
        console.error('Saved UID Firestore sync error:', err)
      );
      saveVerifiedUidToCloudSql(player).catch((err) =>
        console.error('Saved UID Cloud SQL sync error:', err)
      );
    }
  };

  // Package stepper updates from GameDetailView
  const handleSetPackageQuantity = (game: GameItem, pkg: TopUpPackage, newQty: number) => {
    setCartItems((prev) => {
      if (newQty <= 0) {
        return prev.filter((item) => item.package.id !== pkg.id);
      }
      const existing = prev.find((item) => item.package.id === pkg.id);
      if (existing) {
        return prev.map((item) =>
          item.package.id === pkg.id ? { ...item, game, quantity: newQty } : item
        );
      }
      return [...prev, { package: pkg, game, quantity: newQty }];
    });
  };

  // Cart drawer quantity adjustments
  const handleUpdateCartQuantity = (packageId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.package.id === packageId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (packageId: string) => {
    setCartItems((prev) => prev.filter((item) => item.package.id !== packageId));
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  // Dual Login Handler (Google Sign-In or Direct Email Sign-In)
  const handleLogin = (user: UserAccount) => {
    const cleanEmail = normalizeEmail(user.email);
    const isolatedData = loadUserAccountData(cleanEmail);

    activeDataEmailRef.current = cleanEmail;
    setWalletBalanceLKR(isolatedData.walletBalanceLKR);
    setWalletTransactions(isolatedData.walletTransactions);
    setOrders(isolatedData.orders);
    setVerifiedPlayer(null);
    setLatestOrder(null);

    if (user.authProvider === 'email') {
      // Ensure any prior Google Firebase session is cleared before activating email session
      firebaseLogout().catch(() => {});
      setWorkspaceAccessToken(null);
      const emailUser: UserAccount = {
        ...user,
        email: cleanEmail,
        rewardCoins: isolatedData.rewardCoins,
        role: 'customer',
      };
      saveActiveEmailSession(emailUser);
      setCurrentUser(emailUser);
    } else {
      saveActiveEmailSession(null);
      setCurrentUser({
        ...user,
        email: cleanEmail,
        rewardCoins: isolatedData.rewardCoins,
      });
    }

    setIsLoginModalOpen(false);
  };

  // Complete Sign Out -> clears active session & resets in-memory wallet/orders state
  const handleLogout = async () => {
    saveActiveEmailSession(null);
    activeDataEmailRef.current = '';
    setWorkspaceAccessToken(null);
    setCurrentUser(null);
    setWalletBalanceLKR(0);
    setWalletTransactions([]);
    setOrders([]);
    setVerifiedPlayer(null);
    setLatestOrder(null);
    setIsProfileModalOpen(false);
    setIsWalletModalOpen(false);
    setIsLoginModalOpen(false);
    setIsOwnerModalOpen(false);

    try {
      await firebaseLogout();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Wallet balance & transaction updates (persisted per email & synced to cloud for Google users)
  const handleUpdateWalletBalance = (newBalance: number) => {
    if (!currentUser?.isLoggedIn || !currentUser.email) return;
    const safeBalance = Math.max(0, Number(newBalance.toFixed(2)));
    setWalletBalanceLKR(safeBalance);

    if (currentUser.uid) {
      updateUserBalancesInFirestore({
        uid: currentUser.uid,
        walletBalanceLKR: safeBalance,
      }).catch((err) => console.error('Balance Firestore write error:', err));

      updateWalletBalanceInCloudSql(safeBalance).catch((err) =>
        console.error('Wallet Cloud SQL write error:', err)
      );
    }
  };

  const handleAddWalletTransaction = (newTxn: WalletTransaction) => {
    if (!currentUser?.isLoggedIn || !currentUser.email) return;
    setWalletTransactions((prev) => [newTxn, ...prev]);
  };

  const handleClaimToHubWallet = (params: {
    amountLKR: number;
    senderMobile: string;
    rnNumber: string;
  }): { ok: boolean; message: string } => {
    if (!currentUser?.isLoggedIn || !currentUser.email) {
      return { ok: false, message: 'Please sign in first to claim to your eZ Hub Wallet.' };
    }
    const cleanRn = params.rnNumber.trim().toUpperCase();
    const cleanSender = params.senderMobile.trim();
    const amountNum = Math.max(0, Number(params.amountLKR.toFixed(2)));

    if (!cleanRn || cleanRn.length < 6) {
      return { ok: false, message: 'Please enter a valid eZ Cash RN Number.' };
    }
    if (!cleanSender || cleanSender.length < 9) {
      return { ok: false, message: 'Please enter your valid eZ Cash mobile number.' };
    }
    if (!amountNum || amountNum < 50) {
      return { ok: false, message: 'Minimum reload amount is Rs. 50.00.' };
    }

    const alreadyClaimed = walletTransactions.some((t) =>
      t.method.toUpperCase().includes(cleanRn)
    );
    if (alreadyClaimed) {
      return {
        ok: false,
        message: `RN Number ${cleanRn} has already been claimed to your eZ Hub Wallet.`,
      };
    }

    const nextBalance = Number((walletBalanceLKR + amountNum).toFixed(2));
    const newTxn: WalletTransaction = {
      id: `TXN-EZ-${Date.now().toString().slice(-6)}`,
      type: 'deposit',
      title: 'eZ Cash Direct Reload Claim',
      amountLKR: amountNum,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'completed',
      method: `eZ Cash ${cleanSender} · ${cleanRn}`,
    };

    handleUpdateWalletBalance(nextBalance);
    setWalletTransactions((prev) => [newTxn, ...prev]);

    return {
      ok: true,
      message: `Claimed Rs. ${amountNum.toFixed(2)} to your eZ Hub Wallet! New balance: Rs. ${nextBalance.toFixed(2)}.`,
    };
  };

  // Order submission inside CheckoutFlowModal
  const handleOrderSubmitted = (newOrder: Order) => {
    const orderEmail = currentUser?.isLoggedIn ? normalizeEmail(currentUser.email) : newOrder.userEmail;
    const scopedOrder: Order = {
      ...newOrder,
      userEmail: orderEmail || '',
    };

    setOrders((prev) => [scopedOrder, ...prev]);

    let nextWalletBalance = walletBalanceLKR;
    if (scopedOrder.paymentMethod === 'ezcash_credit' && currentUser?.isLoggedIn) {
      nextWalletBalance = Math.max(0, walletBalanceLKR - scopedOrder.totalPaidLKR);
      setWalletBalanceLKR(nextWalletBalance);
      const newTxn: WalletTransaction = {
        id: `TXN-ORD-${Date.now().toString().slice(-6)}`,
        type: 'purchase',
        title: `${scopedOrder.gameName} Top-Up (${scopedOrder.packageName})`,
        amountLKR: scopedOrder.totalPaidLKR,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'completed',
        method: 'Web EZ Wallet',
      };
      setWalletTransactions((prev) => [newTxn, ...prev]);
    }

    // Award 2% Reward Coins for logged-in user
    if (currentUser?.isLoggedIn) {
      const earnedCoins = Math.max(5, Math.round(scopedOrder.totalPaidLKR * 0.02));
      const nextCoins = (currentUser.rewardCoins ?? 0) + earnedCoins;
      setCurrentUser((prev) => (prev ? { ...prev, rewardCoins: nextCoins } : null));

      if (currentUser.uid) {
        const uid = currentUser.uid;
        saveOrderToFirestore(uid, { ...scopedOrder, userId: uid }).catch((err) =>
          console.error('Order Firestore write error:', err)
        );
        updateUserBalancesInFirestore({
          uid,
          rewardCoins: nextCoins,
          walletBalanceLKR: nextWalletBalance,
        }).catch((err) => console.error('Balance Firestore write error:', err));

        saveOrderToCloudSql(scopedOrder).catch((err) =>
          console.error('Order Cloud SQL write error:', err)
        );
      }
    }

    // Clear cart and sensitive CVV
    setCartItems([]);
    setCheckoutFormData((prev) => ({
      ...prev,
      ezCashRnNumber: '',
      screenshotPreview: null,
      screenshotName: null,
      cardCvv: '',
    }));
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              verifiedAt: newStatus === 'completed' ? new Date().toLocaleTimeString() : undefined,
            }
          : o
      )
    );
    if (latestOrder && latestOrder.id === orderId) {
      setLatestOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              verifiedAt: newStatus === 'completed' ? new Date().toLocaleTimeString() : undefined,
            }
          : null
      );
    }

    if (currentUser?.isLoggedIn && currentUser.uid) {
      updateOrderStatusInFirestore(orderId, newStatus).catch((err) =>
        console.error('Order status Firestore error:', err)
      );
      updateOrderStatusInCloudSql(orderId, newStatus).catch((err) =>
        console.error('Order status Cloud SQL error:', err)
      );
    }
  };

  const handleClearOrders = () => {
    setOrders([]);
  };

  // Navbar Navigation Handlers
  const scrollToElement = (id: string) => {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const handleNavigateHome = () => {
    setActiveGame(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateGames = () => {
    setActiveGame(null);
    setCatalogMode('featured');
    scrollToElement('games-section');
  };

  const handleNavigateRegionGames = () => {
    setActiveGame(null);
    setCatalogMode('active');
    scrollToElement('games-section');
  };

  const handleNavigateHowItWorks = () => {
    setActiveGame(null);
    scrollToElement('how-it-works-section');
  };

  const handleOpenOrderHistory = () => {
    if (currentUser?.isLoggedIn) {
      setIsProfileModalOpen(true);
    } else {
      setIsTrackerModalOpen(true);
    }
  };

  const handleOpenSupport = () => {
    scrollToElement('support-section');
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotalLKR = cartItems.reduce(
    (sum, item) => sum + item.package.priceLKR * item.quantity,
    0
  );
  const checkoutActiveGame = activeGame || cartItems[0]?.game || ALL_GAMES[0];

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-[#F5C400]/30 selection:text-[#F5C400] transition-colors ${
        isDarkMode ? 'bg-[#0B0B0D] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Navigation Header (Cart hidden from top bar; moved to bottom-right) */}
      <Navbar
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        selectedLanguage={selectedLanguage}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onChangeLanguage={setSelectedLanguage}
        onOpenAuth={() => setIsLoginModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateGames={handleNavigateGames}
        onNavigateRegionGames={handleNavigateRegionGames}
        onNavigateHowItWorks={handleNavigateHowItWorks}
        onOpenOrderHistory={handleOpenOrderHistory}
        onOpenSupport={handleOpenSupport}
      />

      {activeGame ? (
        /* Game Detail View (Step 1: Verify Player ID + Step 2: Select Packages) */
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <GameDetailView
            game={activeGame}
            verifiedPlayer={verifiedPlayer}
            onVerifyPlayer={handleVerifyPlayer}
            cartItems={cartItems}
            onSetPackageQuantity={handleSetPackageQuantity}
            onOpenCart={() => setIsCartOpen(true)}
            onProceedToPayment={() => setIsCheckoutModalOpen(true)}
            onBackToGames={() => setActiveGame(null)}
            currency={currency}
            onChangeCurrency={setCurrency}
          />
        </main>
      ) : (
        /* Homepage View */
        <>
          <HeroBanner
            onScrollToStore={() => scrollToElement('games-section')}
            onSelectGame={handleSelectGame}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
            {/* Multi-Game Catalog Grid + Active Regional Catalog + Explore All Regions Banner */}
            <GameSelector
              selectedGame={activeGame}
              catalogMode={catalogMode}
              onChangeCatalogMode={setCatalogMode}
              onSelectGame={handleSelectGame}
            />

            {/* How It Works: Simple 3 Steps */}
            <HowItWorksSection />
          </main>
        </>
      )}

      {/* Slide-Over "Your Cart" Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        currency={currency}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Secure Checkout Modal (Genuine Gateway, eZ Hub Wallet, eZ Cash Direct Reload, BOC) */}
      <CheckoutFlowModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cartItems}
        selectedGame={checkoutActiveGame}
        verifiedPlayer={verifiedPlayer}
        currentUser={currentUser}
        existingOrders={orders}
        walletBalanceLKR={walletBalanceLKR}
        selectedMethod={selectedPaymentMethod}
        onSelectMethod={setSelectedPaymentMethod}
        formData={checkoutFormData}
        onUpdateFormData={handleUpdateCheckoutFormData}
        onClaimToHubWallet={handleClaimToHubWallet}
        onSubmitOrder={handleOrderSubmitted}
        workspaceAccessToken={workspaceAccessToken}
        onRequestGoogleAuth={() => setIsLoginModalOpen(true)}
      />

      {/* Dual Login (Google + Email) / Account Modal */}
      <GoogleLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        walletBalanceLKR={walletBalanceLKR}
        hasWorkspaceToken={Boolean(workspaceAccessToken)}
        onGoogleConnected={(token) => setWorkspaceAccessToken(token)}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenWallet={() => {
          setIsLoginModalOpen(false);
          setIsWalletModalOpen(true);
        }}
        onOpenOrders={() => {
          setIsLoginModalOpen(false);
          setIsProfileModalOpen(true);
        }}
        isMandatory={false}
      />

      {/* User Profile, Order History, Google Drive & Gmail Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        orders={orders}
        walletBalanceLKR={walletBalanceLKR}
        workspaceAccessToken={workspaceAccessToken}
        onConnectGoogleWorkspace={() => {
          setIsProfileModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onOpenWallet={() => setIsWalletModalOpen(true)}
        onViewOrderReceipt={(order) => setLatestOrder(order)}
        onLogout={handleLogout}
      />

      {/* TopUp Hub Lanka Web EZ Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        currentUser={currentUser}
        walletBalanceLKR={walletBalanceLKR}
        onUpdateWalletBalance={handleUpdateWalletBalance}
        transactions={walletTransactions}
        onAddTransaction={handleAddWalletTransaction}
      />

      {/* Order Receipt Modal */}
      <OrderReceiptModal
        order={latestOrder}
        onClose={() => setLatestOrder(null)}
        onOpenOwnerPortal={() => {
          setLatestOrder(null);
          setIsOwnerModalOpen(true);
        }}
        workspaceAccessToken={workspaceAccessToken}
        defaultEmail={currentUser?.email || ''}
        onRequestGoogleAuth={() => setIsLoginModalOpen(true)}
      />

      {/* Store Owner Manual Verification Dashboard Modal */}
      <OwnerDashboardModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onClearOrders={handleClearOrders}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        orders={orders}
      />

      {/* Footer */}
      <Footer />

      {/* Floating Bottom-Right Your Cart Launcher */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        aria-label="Open Your Cart"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#141416]/95 hover:bg-[#1C1C20] border border-[#F5C400]/60 hover:border-[#F5C400] text-white shadow-2xl shadow-black/60 backdrop-blur-md transition-all cursor-pointer active:scale-95"
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-[#F5C400] text-[#0B0B0D]">
          <ShoppingBag className="w-4 h-4" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow">
              {totalCartCount}
            </span>
          )}
        </div>
        <div className="text-left leading-tight">
          <span className="block text-xs font-black text-white">Your Cart</span>
          <span className="block text-[10px] font-mono text-[#F5C400] tabular-nums">
            {totalCartCount > 0
              ? `${totalCartCount} ${totalCartCount === 1 ? 'item' : 'items'} · Rs. ${cartSubtotalLKR.toFixed(0)}`
              : 'Empty'}
          </span>
        </div>
      </button>
    </div>
  );
}
