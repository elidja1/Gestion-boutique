// Unified Global Application State Manager with Decimal Support (Kg) and Supabase Live Sync
'use client';

import { useState, useEffect, useCallback } from 'react';
import { normalizePriceTiers } from './utils';
import { triggerDesktopPushAndSound } from './pushNotifications';
import {
  Company,
  Store,
  UserProfile,
  Category,
  Supplier,
  Product,
  Customer,
  Sale,
  StockTransfer,
  StockMovement,
  CashSession,
  Expense,
  CustomerReview,
  NotificationItem,
  AuditLog,
  UserRoleType,
  SyncStatusType,
  TransferStatus,
} from './types';
import {
  INITIAL_COMPANY,
  INITIAL_STORES,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_TRANSFERS,
  INITIAL_MOVEMENTS,
  INITIAL_CASH_SESSIONS,
  INITIAL_EXPENSES,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './mockData';
import {
  fetchFullSupabaseSnapshot,
  syncSaleToSupabase,
  syncProductToSupabase,
  syncExpenseToSupabase,
  syncCashSessionToSupabase,
  syncStaffToSupabase,
  syncStoreToSupabase,
  syncTransferToSupabase,
  syncStockMovementToSupabase,
  syncNotificationToSupabase,
  syncDeleteNotificationFromSupabase,
  syncClearAllNotificationsFromSupabase,
  syncDeleteStaffFromSupabase,
  syncDeleteProductFromSupabase,
  syncDeleteStoreFromSupabase,
  syncCategoryToSupabase,
  syncDeleteCategoryFromSupabase,
} from './supabaseSync';

const LOCAL_STORAGE_KEY = 'vgm_app_state_v4';
const AUTH_STORAGE_KEY = 'vgm_auth_session_v4';

export interface AppState {
  company: Company;
  stores: Store[];
  users: UserProfile[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  transfers: StockTransfer[];
  movements: StockMovement[];
  cashSessions: CashSession[];
  expenses: Expense[];
  reviews: CustomerReview[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  activeStoreId: string;
  currentRole: UserRoleType;
  currentUserId: string;
  isAuthenticated: boolean;
  syncStatus: SyncStatusType;
  lastSyncTime: string | null;
}

export const defaultState: AppState = {
  company: INITIAL_COMPANY,
  stores: INITIAL_STORES,
  users: INITIAL_USERS,
  categories: INITIAL_CATEGORIES,
  suppliers: INITIAL_SUPPLIERS,
  products: INITIAL_PRODUCTS,
  customers: INITIAL_CUSTOMERS,
  sales: INITIAL_SALES,
  transfers: INITIAL_TRANSFERS,
  movements: INITIAL_MOVEMENTS,
  cashSessions: INITIAL_CASH_SESSIONS,
  expenses: INITIAL_EXPENSES,
  reviews: INITIAL_REVIEWS,
  notifications: INITIAL_NOTIFICATIONS,
  auditLogs: INITIAL_AUDIT_LOGS,
  activeStoreId: 'ALL',
  currentRole: 'OWNER',
  currentUserId: '',
  isAuthenticated: false,
  syncStatus: 'idle',
  lastSyncTime: null,
};

type Listener = (state: AppState) => void;
let globalState: AppState = defaultState;
const listeners = new Set<Listener>();

function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const authRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    let state = defaultState;

    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...defaultState, ...parsed };
    }

    if (authRaw) {
      try {
        const auth = JSON.parse(authRaw);
        state.isAuthenticated = auth.isAuthenticated === true;
        state.currentUserId = auth.currentUserId || state.currentUserId;
        state.currentRole = auth.currentRole || state.currentRole;
      } catch {
        state.isAuthenticated = false;
      }
    } else {
      state.isAuthenticated = false;
    }

    // Role normalization: Only SUPERADMIN and OWNER have administrative rights. All other collaborators are SELLER.
    if (state.currentRole !== 'SUPERADMIN' && state.currentRole !== 'OWNER') {
      state.currentRole = 'SELLER';
    }

    state.users = (state.users || []).map((u) => {
      const r = (u.role_code || '').toUpperCase();
      const normalizedRole: UserRoleType = (r === 'SUPERADMIN' || r === 'OWNER') ? r : 'SELLER';
      return { ...u, role_code: normalizedRole };
    });

    // Unified Stock Normalization: Ensure all products have consistent stock_by_store and carton_stock
    state.products = (state.products || []).map((p) => {
      const stockMap: Record<string, number> = { ...(p.stock_by_store || {}) };
      const stores = state.stores || [];
      const hasAnyStoreStock = Object.keys(stockMap).length > 0;

      stores.forEach((st) => {
        if (stockMap[st.id] === undefined) {
          // New stores get 0 stock, not a copy of total_stock (which would inflate totals)
          stockMap[st.id] = 0;
        }
      });

      // If no store stock existed yet (brand new data), seed from total_stock for the first store only
      const total = hasAnyStoreStock
        ? Object.values(stockMap).reduce((a, b) => a + (Number(b) || 0), 0)
        : (p.total_stock ?? 0);

      const cartonStock = (p.carton_weight_kg && p.carton_weight_kg > 0)
        ? Math.floor(total / p.carton_weight_kg)
        : p.carton_stock;

      return {
        ...p,
        price_tiers: normalizePriceTiers(p.price_tiers),
        stock_by_store: stockMap,
        total_stock: Number(total.toFixed(3)),
        carton_stock: cartonStock,
      };
    });

    return state;
  } catch (e) {
    console.warn('Failed to load state from localStorage', e);
  }
  return defaultState;
}

function saveState(newState: AppState) {
  globalState = newState;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          isAuthenticated: newState.isAuthenticated,
          currentUserId: newState.currentUserId,
          currentRole: newState.currentRole,
        })
      );
    } catch (e) {
      console.warn('Failed to persist state', e);
    }
  }
  listeners.forEach((l) => l(globalState));
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(globalState);

  const syncWithSupabase = useCallback(async () => {
    saveState({ ...globalState, syncStatus: 'syncing' });
    try {
      const snapshot = await fetchFullSupabaseSnapshot();
      if (snapshot && snapshot.company) {
        // Use Supabase data as canonical source of truth when online
        const remoteStores = snapshot.stores !== undefined && snapshot.stores.length > 0 ? snapshot.stores : globalState.stores;
        const remoteProducts = snapshot.products !== undefined ? snapshot.products : globalState.products;
        const remoteUsers = snapshot.users !== undefined && snapshot.users.length > 0 ? snapshot.users : globalState.users;
        const remoteTransfers = snapshot.transfers !== undefined ? snapshot.transfers : globalState.transfers;
        const remoteMovements = snapshot.movements !== undefined ? snapshot.movements : globalState.movements;
        const remoteNotifs = snapshot.notifications !== undefined ? snapshot.notifications : globalState.notifications;

        // Normalize users to prevent non-admin roles
        const normalizedUsers = remoteUsers.map((u) => {
          const r = (u.role_code || '').toUpperCase();
          const normalizedRole: UserRoleType = (r === 'SUPERADMIN' || r === 'OWNER') ? r : 'SELLER';
          return { ...u, role_code: normalizedRole };
        });

        // Normalize products stock, carton & price_tiers
        const normalizedProducts = remoteProducts.map((p) => {
          const stockMap: Record<string, number> = { ...(p.stock_by_store || {}) };
          const hasExistingStock = Object.keys(stockMap).length > 0;
          remoteStores.forEach((st) => {
            if (stockMap[st.id] === undefined) {
              // New stores get 0 stock (not a copy of total_stock which would inflate totals)
              stockMap[st.id] = 0;
            }
          });
          const total = hasExistingStock
            ? Object.values(stockMap).reduce((a, b) => a + (Number(b) || 0), 0)
            : (p.total_stock ?? 0);
          const cartonStock = (p.carton_weight_kg && p.carton_weight_kg > 0)
            ? Math.floor(total / p.carton_weight_kg)
            : p.carton_stock;

          // Merge price_tiers: preserve local tiers if remote doesn't provide them
          const localMatch = globalState.products.find((lp) => lp.id === p.id);
          const remoteTiers = normalizePriceTiers(p.price_tiers);
          const localTiers = normalizePriceTiers(localMatch?.price_tiers);
          const effectiveTiers = remoteTiers.length > 0 ? remoteTiers : localTiers;

          return {
            ...p,
            price_tiers: effectiveTiers,
            stock_by_store: stockMap,
            total_stock: Number(total.toFixed(3)),
            carton_stock: cartonStock,
          };
        });

        // Sync HTML banner if broadcasted via Supabase
        const bannerNotif = remoteNotifs.find((n) => n.id === '00000000-0000-4000-8000-0000000000bb' || n.type === 'SYSTEM_BANNER' as any);
        if (bannerNotif && typeof window !== 'undefined') {
          try {
            const bannerData = JSON.parse(bannerNotif.message);
            localStorage.setItem('vgm_superadmin_banner_v1', JSON.stringify(bannerData));
            window.dispatchEvent(new CustomEvent('vgm-banner-update', { detail: bannerData }));
          } catch {}
        }

        // === Admin: detect new remote notifications from collaborator sales and fire local push ===
        const currentRole = globalState.currentRole;
        const isAdminOrOwner = currentRole === 'OWNER' || currentRole === 'MANAGER' || currentRole === 'SUPERADMIN';
        if (isAdminOrOwner && typeof window !== 'undefined') {
          const knownIds = new Set(globalState.notifications.map((n) => n.id));
          const newRemoteNotifs = remoteNotifs.filter(
            (n) =>
              !knownIds.has(n.id) &&
              n.id !== '00000000-0000-4000-8000-0000000000bb' &&
              (n.type as string) !== 'SYSTEM_BANNER'
          );
          newRemoteNotifs.forEach((n) => {
            const isSaleNotif = n.title?.includes('Vente') || n.title?.includes('💰');
            const isLowStockNotif = (n.type as string) === 'LOW_STOCK' || n.title?.includes('Stock bas');
            if (isSaleNotif || isLowStockNotif) {
              triggerDesktopPushAndSound({
                title: n.title,
                body: n.message,
                url: '/',
                soundType: isSaleNotif ? 'cash' : 'error',
              }).catch(() => {});
            }
          });
        }

        saveState({
          ...globalState,
          company: snapshot.company,
          stores: remoteStores,
          users: normalizedUsers,
          categories: snapshot.categories !== undefined ? snapshot.categories : globalState.categories,
          suppliers: snapshot.suppliers !== undefined ? snapshot.suppliers : globalState.suppliers,
          products: normalizedProducts,
          customers: snapshot.customers !== undefined ? snapshot.customers : globalState.customers,
          sales: snapshot.sales !== undefined ? snapshot.sales : globalState.sales,
          transfers: remoteTransfers,
          movements: remoteMovements,
          cashSessions: snapshot.cashSessions !== undefined ? snapshot.cashSessions : globalState.cashSessions,
          expenses: snapshot.expenses !== undefined ? snapshot.expenses : globalState.expenses,
          notifications: remoteNotifs,
          auditLogs: snapshot.auditLogs !== undefined ? snapshot.auditLogs : globalState.auditLogs,
          syncStatus: 'synced',
          lastSyncTime: new Date().toLocaleTimeString(),
        });
        return { success: true };
      } else {
        saveState({ ...globalState, syncStatus: 'offline' });
        return { success: false };
      }
    } catch (e) {
      console.warn('Supabase sync error:', e);
      saveState({ ...globalState, syncStatus: 'error' });
      return { success: false };
    }
  }, []);

  useEffect(() => {
    const loaded = loadState();
    globalState = loaded;
    setState(loaded);

    const listener: Listener = (nextState) => {
      setState(nextState);
    };
    listeners.add(listener);

    // Initial silent sync with Supabase in background
    syncWithSupabase();

    // Periodic polling for admin/manager/owner: detect new sales from collaborators in near-real-time
    const POLL_INTERVAL = 30_000; // 30 seconds
    const pollingTimer = setInterval(() => {
      const role = globalState.currentRole;
      if (role === 'OWNER' || role === 'MANAGER' || role === 'SUPERADMIN') {
        syncWithSupabase();
      }
    }, POLL_INTERVAL);

    return () => {
      listeners.delete(listener);
      clearInterval(pollingTimer);
    };
  }, [syncWithSupabase]);

  const login = async (
    identifier: string,
    passwordOrPin: string
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanSecret = passwordOrPin.trim();
    const cleanPhone = cleanId.replace(/[\s\-\+\(\)]/g, '');

    // 1. Superadmin (Developer Account)
    if (
      (cleanId === 'superadmin' || cleanId === 'superadmin@vgm.local' || cleanId === 'dev') &&
      (cleanSecret === 'superadmin' || cleanSecret === 'dev')
    ) {
      const superUser: UserProfile = globalState.users.find((u) => u.role_code === 'SUPERADMIN') || {
        id: 'u0000000-0000-0000-0000-000000000000',
        company_id: globalState.company.id,
        role_id: 'b0000000-0000-0000-0000-000000000000',
        role_code: 'SUPERADMIN',
        code: 'SUPERADMIN',
        full_name: 'Développeur / Super Admin',
        email: 'superadmin@vgm.local',
        phone: '+229 00 00 00 00',
        is_active: true,
        monthly_sales_target: 0,
      };

      saveState({
        ...globalState,
        isAuthenticated: true,
        currentRole: 'SUPERADMIN',
        currentUserId: superUser.id,
        activeStoreId: 'ALL',
      });
      return { success: true, message: 'Bienvenue dans la Console Développeur Super Admin !', user: superUser };
    }

    // 2. Client Admin (Owner)
    if (
      (cleanId === 'admin' || cleanId === 'admin@vertudegloire.bj' || cleanId === 'direction@vertudegloire.bj') &&
      (cleanSecret === 'admin' || cleanSecret === 'Boutique@2026')
    ) {
      const ownerUser = globalState.users.find((u) => u.role_code === 'OWNER') || globalState.users[0];
      saveState({
        ...globalState,
        isAuthenticated: true,
        currentRole: 'OWNER',
        currentUserId: ownerUser.id,
        activeStoreId: 'ALL',
      });
      return { success: true, message: `Connexion réussie : ${ownerUser.full_name}`, user: ownerUser };
    }

    // 3. Match against loaded users by Code, Email, Phone, Full Name or Username
    const matchedUser = globalState.users.find((u) => {
      const userEmail = (u.email || '').toLowerCase();
      const userCode = (u.code || '').toLowerCase();
      const userName = (u.full_name || '').toLowerCase();
      const userPhone = (u.phone || '').replace(/[\s\-\+\(\)]/g, '');
      const userUsername = userName.replace(/\s+/g, '');

      const matchIdentifier =
        cleanId === userEmail ||
        cleanId === userCode ||
        cleanId === userName ||
        cleanId === userUsername ||
        (cleanPhone.length >= 6 && userPhone.includes(cleanPhone));

      const matchSecret =
        (u.password && u.password === cleanSecret) ||
        (u.pin_code && u.pin_code === cleanSecret) ||
        (cleanSecret === 'Boutique@2026') ||
        (cleanSecret === '1234');

      return matchIdentifier && matchSecret;
    });

    if (matchedUser) {
      const targetStoreId = matchedUser.store_id || (matchedUser.role_code === 'OWNER' ? globalState.activeStoreId : globalState.stores[0]?.id || 'b0000000-0000-4000-8000-000000000001');
      saveState({
        ...globalState,
        isAuthenticated: true,
        currentRole: matchedUser.role_code,
        currentUserId: matchedUser.id,
        activeStoreId: targetStoreId,
      });
      syncWithSupabase().catch(() => {});
      return { success: true, message: `Connexion réussie : ${matchedUser.full_name}`, user: matchedUser };
    }

    // 4. Direct Fallback PIN or Code match (for cashier quick login)
    const pinUser = globalState.users.find((u) => u.pin_code === cleanSecret || (cleanId && u.pin_code === cleanId));
    if (pinUser) {
      const targetStoreId = pinUser.store_id || globalState.stores[0]?.id || 'b0000000-0000-4000-8000-000000000001';
      saveState({
        ...globalState,
        isAuthenticated: true,
        currentRole: pinUser.role_code,
        currentUserId: pinUser.id,
        activeStoreId: targetStoreId,
      });
      syncWithSupabase().catch(() => {});
      return { success: true, message: `Session déverrouillée : ${pinUser.full_name}`, user: pinUser };
    }

    return { success: false, message: 'Identifiant, mot de passe ou code PIN incorrect.' };
  };

  const logout = () => {
    saveState({
      ...globalState,
      isAuthenticated: false,
    });
  };

  const setActiveStoreId = (storeId: string) => {
    saveState({ ...globalState, activeStoreId: storeId });
  };

  const setCurrentRole = (role: UserRoleType) => {
    const matchingUser = globalState.users.find((u) => u.role_code === role) || globalState.users[0];
    saveState({
      ...globalState,
      currentRole: role,
      currentUserId: matchingUser.id,
      activeStoreId: matchingUser.store_id || (role === 'OWNER' || role === 'SUPERADMIN' || role === 'ACCOUNTANT' ? globalState.activeStoreId : globalState.stores[0].id),
    });
  };

  const updateCompany = (company: Company) => {
    saveState({
      ...globalState,
      company,
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'UPDATE_COMPANY',
          entity_type: 'Entreprise',
          details: 'Modification des mentions légales et facturation',
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const addSale = (sale: Sale) => {
    // 1. Deduct stock locally with unified store stock fallback
    const updatedProducts = globalState.products.map((prod) => {
      const soldItem = sale.items.find((item) => item.product.id === prod.id);
      if (soldItem) {
        const storeStock = { ...(prod.stock_by_store || {}) };
        const currentStoreQty = typeof storeStock[sale.store_id] === 'number'
          ? storeStock[sale.store_id]
          : (prod.total_stock ?? 0);
        const newQty = Math.max(0, currentStoreQty - soldItem.quantity);
        storeStock[sale.store_id] = Number(newQty.toFixed(3));

        // Ensure other stores are accounted for (new stores get 0, not a copy of total_stock)
        globalState.stores.forEach((s) => {
          if (storeStock[s.id] === undefined) {
            storeStock[s.id] = 0;
          }
        });

        const total = Object.values(storeStock).reduce((a, b) => a + Number(b), 0);
        const cartonStock = (prod.carton_weight_kg && prod.carton_weight_kg > 0)
          ? Math.floor(total / prod.carton_weight_kg)
          : prod.carton_stock;

        return {
          ...prod,
          stock_by_store: storeStock,
          total_stock: Number(total.toFixed(3)),
          carton_stock: cartonStock,
        };
      }
      return prod;
    });

    // 2. Add movements
    const newMovements: StockMovement[] = sale.items.map((item) => {
      const prod = globalState.products.find((p) => p.id === item.product.id);
      const prevQty = prod?.stock_by_store?.[sale.store_id] ?? prod?.total_stock ?? 0;
      return {
        id: `mov-${Date.now()}-${item.product.id}`,
        company_id: globalState.company.id,
        store_id: sale.store_id,
        store_name: sale.store_name || '',
        product_id: item.product.id,
        product_name: item.product.name,
        user_name: sale.seller_name || '',
        type: 'SALE',
        quantity: -item.quantity,
        previous_quantity: prevQty,
        new_quantity: Math.max(0, prevQty - item.quantity),
        unit: item.product.unit,
        reason: `Vente #${sale.invoice_number} (${item.quantity} ${item.product.unit})`,
        created_at: new Date().toISOString(),
      };
    });

    // 3. Customer loyalty
    let updatedCustomers = globalState.customers;
    if (sale.customer_id) {
      const pointsEarned = Math.floor(sale.total_amount / globalState.company.loyalty_rate_amount);
      updatedCustomers = globalState.customers.map((c) => {
        if (c.id === sale.customer_id) {
          return {
            ...c,
            total_spent: c.total_spent + sale.total_amount,
            total_orders: c.total_orders + 1,
            loyalty_points: c.loyalty_points + pointsEarned,
            last_order_at: new Date().toISOString(),
          };
        }
        return c;
      });
    }

    // 4. Update store metrics
    const updatedStores = globalState.stores.map((s) => {
      if (s.id === sale.store_id) {
        return {
          ...s,
          today_sales_count: (s.today_sales_count || 0) + 1,
          today_revenue: (s.today_revenue || 0) + sale.total_amount,
        };
      }
      return s;
    });

    // 5. Cash Session sync
    const cashAmount = sale.payments.filter((p) => p.payment_method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const momoAmount = sale.payments.filter((p) => p.payment_method !== 'CASH').reduce((sum, p) => sum + p.amount, 0);

    const updatedCashSessions = globalState.cashSessions.map((cs) => {
      if (cs.store_id === sale.store_id && cs.status === 'OPEN') {
        return {
          ...cs,
          total_sales_cash: cs.total_sales_cash + cashAmount,
          total_sales_momo: cs.total_sales_momo + momoAmount,
          closing_balance_system: cs.closing_balance_system + cashAmount,
        };
      }
      return cs;
    });

    const newAudit: AuditLog = {
      id: `aud-${Date.now()}`,
      store_id: sale.store_id,
      store_name: sale.store_name,
      user_name: getCurrentUser().full_name,
      action: 'SALE_COMPLETED',
      entity_type: 'Vente',
      details: `Facture #${sale.invoice_number} - Total: ${sale.total_amount.toLocaleString()} FCFA (${sale.items.length} articles)`,
      created_at: new Date().toISOString(),
    };

    // Items breakdown with remaining stock for admin notification
    const itemsSummary = sale.items
      .map((item) => {
        const prod = updatedProducts.find((p) => p.id === item.product.id);
        const remainingStock = prod?.stock_by_store?.[sale.store_id] ?? prod?.total_stock ?? 0;
        return `${item.product.name} (x${item.quantity} ${item.product.unit}) [Reste: ${remainingStock} ${item.product.unit}]`;
      })
      .join(' • ');

    const saleNotification: NotificationItem = {
      id: `notif-sale-${Date.now()}`,
      title: `💰 Vente #${sale.invoice_number} (${sale.total_amount.toLocaleString()} FCFA)`,
      message: `${sale.store_name || 'Boutique'} • Caissier: ${sale.seller_name || 'Vendeur'} • ${itemsSummary}`,
      type: 'BIG_SALE',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    saveState({
      ...globalState,
      sales: [sale, ...globalState.sales],
      products: updatedProducts,
      movements: [...newMovements, ...globalState.movements],
      customers: updatedCustomers,
      stores: updatedStores,
      cashSessions: updatedCashSessions,
      notifications: [saleNotification, ...globalState.notifications],
      auditLogs: [newAudit, ...globalState.auditLogs],
    });

    // Asynchronously sync to Supabase (with updated stock and movements)
    syncSaleToSupabase(sale, updatedProducts).catch((e) => console.warn('Background Supabase sale sync failed:', e));
    syncNotificationToSupabase(saleNotification).catch((e) => console.warn('Notification sync failed:', e));

    const sellerRole = globalState.currentRole;
    const isAdminSeller = sellerRole === 'OWNER' || sellerRole === 'MANAGER' || sellerRole === 'SUPERADMIN';

    // === Web Push vente — uniquement sur l'appareil admin (pas pour les collaborateurs) ===
    // Les collaborateurs voient leur confirmation à l'écran. L'admin reçoit la push.
    if (isAdminSeller) {
      triggerDesktopPushAndSound({
        title: `💰 Vente #${sale.invoice_number} — ${sale.total_amount.toLocaleString()} FCFA`,
        body: `Vendeur: ${sale.seller_name || 'Caisse'} • Boutique: ${sale.store_name || '—'}\n${itemsSummary}`,
        url: '/',
        soundType: 'cash',
      }).catch((e) => console.warn('Desktop notification dispatch warning:', e));
    }

    // === Alerte Stock Bas (< 5 unités/kg) — uniquement visible pour l'admin ===
    // Les collaborateurs ne doivent pas voir les alertes de stock
    if (isAdminSeller) {
      const LOW_STOCK_THRESHOLD = 5;
      const lowStockItems = sale.items.filter((item) => {
        const updatedProd = updatedProducts.find((p) => p.id === item.product.id);
        const remaining = updatedProd?.stock_by_store?.[sale.store_id] ?? updatedProd?.total_stock ?? 0;
        return remaining < LOW_STOCK_THRESHOLD && remaining >= 0;
      });

      if (lowStockItems.length > 0) {
        const ts = Date.now();
        const lowStockNotifs: NotificationItem[] = lowStockItems.map((item) => {
          const updatedProd = updatedProducts.find((p) => p.id === item.product.id);
          const remaining = updatedProd?.stock_by_store?.[sale.store_id] ?? updatedProd?.total_stock ?? 0;
          const storeName = globalState.stores.find((s) => s.id === sale.store_id)?.name || sale.store_name || 'Boutique';
          return {
            id: `notif-lowstock-${item.product.id}-${ts}`,
            title: `⚠️ Stock bas : ${item.product.name}`,
            message: `Boutique ${storeName} — Reste: ${remaining} ${item.product.unit}. Pensez à réapprovisionner !`,
            type: 'LOW_STOCK' as any,
            is_read: false,
            created_at: new Date().toISOString(),
          };
        });

        // Sync each low-stock notif to Supabase (admin on other devices will also be alerted on next sync)
        lowStockNotifs.forEach((notif) => {
          syncNotificationToSupabase(notif).catch(() => {});
          triggerDesktopPushAndSound({
            title: notif.title,
            body: notif.message,
            url: '/',
            soundType: 'error',
          }).catch(() => {});
        });

        saveState({
          ...globalState,
          notifications: [...lowStockNotifs, ...globalState.notifications],
        });
      }
    }
  };

  const addProduct = (product: Product) => {
    const stockMap: Record<string, number> = {};
    const stores = globalState.stores || [];
    stores.forEach((s) => {
      stockMap[s.id] = typeof product.stock_by_store?.[s.id] === 'number'
        ? product.stock_by_store[s.id]
        : (product.total_stock ?? 0);
    });

    const cartonStock = (product.carton_weight_kg && product.carton_weight_kg > 0)
      ? Math.floor((product.total_stock ?? 0) / product.carton_weight_kg)
      : (product.carton_stock ?? null);

    const normalizedProduct: Product = {
      ...product,
      price_tiers: normalizePriceTiers(product.price_tiers),
      stock_by_store: stockMap,
      carton_stock: cartonStock,
    };

    saveState({
      ...globalState,
      products: [normalizedProduct, ...globalState.products],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'CREATE_PRODUCT',
          entity_type: 'Produit',
          details: `Ajout article : ${product.name} (SKU: ${product.sku}) - Stock: ${product.total_stock} ${product.unit}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncProductToSupabase(normalizedProduct).catch((e) => console.warn('Background Supabase product sync failed:', e));
  };

  const updateProduct = (product: Product) => {
    const stockMap: Record<string, number> = {};
    const stores = globalState.stores || [];
    stores.forEach((s) => {
      stockMap[s.id] = typeof product.stock_by_store?.[s.id] === 'number'
        ? product.stock_by_store[s.id]
        : (product.total_stock ?? 0);
    });

    const cartonStock = (product.carton_weight_kg && product.carton_weight_kg > 0)
      ? Math.floor((product.total_stock ?? 0) / product.carton_weight_kg)
      : (product.carton_stock ?? null);

    const normalizedProduct: Product = {
      ...product,
      price_tiers: normalizePriceTiers(product.price_tiers),
      stock_by_store: stockMap,
      carton_stock: cartonStock,
    };

    saveState({
      ...globalState,
      products: globalState.products.map((p) => (p.id === product.id ? normalizedProduct : p)),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'UPDATE_PRODUCT',
          entity_type: 'Produit',
          details: `Modification article : ${product.name} (Prix: ${product.selling_price} FCFA)`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncProductToSupabase(normalizedProduct).catch((e) => console.warn('Background Supabase product sync failed:', e));
  };

  const deleteProduct = (productId: string) => {
    const prod = globalState.products.find((p) => p.id === productId);
    saveState({
      ...globalState,
      products: globalState.products.filter((p) => p.id !== productId),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'DELETE_PRODUCT',
          entity_type: 'Produit',
          details: `Suppression du produit : ${prod?.name || productId}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncDeleteProductFromSupabase(productId).catch((e) => console.warn('Background Supabase product delete failed:', e));
  };

  const adjustStock = (
    productId: string,
    storeId: string,
    quantityDelta: number,
    reason: string,
    movementType: StockMovement['type'] = 'ADJUSTMENT_POS'
  ) => {
    const prod = globalState.products.find((p) => p.id === productId);
    if (!prod) return;

    const store = globalState.stores.find((s) => s.id === storeId);
    const storeStock = { ...(prod.stock_by_store || {}) };
    const currentQty = typeof storeStock[storeId] === 'number' ? storeStock[storeId] : (prod.total_stock ?? 0);
    const newQty = Math.max(0, currentQty + quantityDelta);
    storeStock[storeId] = Number(newQty.toFixed(3));

    globalState.stores.forEach((s) => {
      if (storeStock[s.id] === undefined) {
        // New stores get 0, not a copy of total_stock
        storeStock[s.id] = 0;
      }
    });

    const total = Object.values(storeStock).reduce((a, b) => a + Number(b), 0);
    const cartonStock = (prod.carton_weight_kg && prod.carton_weight_kg > 0)
      ? Math.floor(newQty / prod.carton_weight_kg)
      : prod.carton_stock;

    const updatedProduct = {
      ...prod,
      stock_by_store: storeStock,
      total_stock: Number(total.toFixed(3)),
      carton_stock: cartonStock,
    };

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}-${productId}`,
      company_id: globalState.company.id,
      store_id: storeId,
      store_name: store?.name || '',
      product_id: productId,
      product_name: prod.name,
      user_name: getCurrentUser().full_name,
      type: movementType,
      quantity: quantityDelta,
      previous_quantity: currentQty,
      new_quantity: newQty,
      unit: prod.unit,
      reason,
      created_at: new Date().toISOString(),
    };

    saveState({
      ...globalState,
      products: globalState.products.map((p) => (p.id === productId ? updatedProduct : p)),
      movements: [newMovement, ...globalState.movements],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          store_id: storeId,
          store_name: store?.name,
          user_name: getCurrentUser().full_name,
          action: 'STOCK_ADJUSTMENT',
          entity_type: 'Stock',
          details: `Ajustement stock (${prod.name}): ${quantityDelta > 0 ? '+' : ''}${quantityDelta} ${prod.unit} - Motif: ${reason}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncProductToSupabase(updatedProduct).catch((e) => console.warn('Background Supabase product sync failed:', e));
  };

  const addTransfer = (transfer: StockTransfer) => {
    saveState({
      ...globalState,
      transfers: [transfer, ...globalState.transfers],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'TRANSFER_REQUEST',
          entity_type: 'Transfert',
          details: `Demande transfert #${transfer.transfer_number} (${transfer.source_store_name} ➔ ${transfer.destination_store_name})`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncTransferToSupabase(transfer).catch((e) => console.warn('Transfer sync failed:', e));
  };

  const updateTransferStatus = (transferId: string, status: TransferStatus) => {
    const transfer = globalState.transfers.find((t) => t.id === transferId);
    if (!transfer) return;

    let updatedProducts = globalState.products;

    if (status === 'RECEIVED' && transfer.status !== 'RECEIVED') {
      transfer.items.forEach((item) => {
        updatedProducts = updatedProducts.map((p) => {
          if (p.id === item.product_id) {
            const stockMap = { ...(p.stock_by_store || {}) };
            const srcQty = stockMap[transfer.source_store_id] || 0;
            const dstQty = stockMap[transfer.destination_store_id] || 0;
            const qty = item.quantity_shipped || item.quantity_requested || 0;
            stockMap[transfer.source_store_id] = Math.max(0, srcQty - qty);
            stockMap[transfer.destination_store_id] = dstQty + qty;
            return {
              ...p,
              stock_by_store: stockMap,
            };
          }
          return p;
        });
      });
    }

    const updatedTransfer = { ...transfer, status, updated_at: new Date().toISOString() };

    saveState({
      ...globalState,
      products: updatedProducts,
      transfers: globalState.transfers.map((t) => (t.id === transferId ? updatedTransfer : t)),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'TRANSFER_STATUS',
          entity_type: 'Transfert',
          details: `Mise à jour transfert #${transfer.transfer_number} ➔ ${status}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncTransferToSupabase(updatedTransfer).catch((e) => console.warn('Transfer update sync failed:', e));
  };

  const addExpense = (expense: Expense) => {
    const updatedSessions = globalState.cashSessions.map((cs) => {
      if (cs.store_id === expense.store_id && cs.status === 'OPEN' && expense.payment_method === 'CASH') {
        return {
          ...cs,
          total_expenses: cs.total_expenses + expense.amount,
          closing_balance_system: cs.closing_balance_system - expense.amount,
        };
      }
      return cs;
    });

    saveState({
      ...globalState,
      expenses: [expense, ...globalState.expenses],
      cashSessions: updatedSessions,
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          store_id: expense.store_id,
          store_name: expense.store_name,
          user_name: getCurrentUser().full_name,
          action: 'CREATE_EXPENSE',
          entity_type: 'Dépense',
          details: `Dépense #${expense.expense_code}: ${expense.amount.toLocaleString()} FCFA (${expense.description})`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncExpenseToSupabase(expense).catch((e) => console.warn('Background Supabase expense sync failed:', e));
  };

  const openCashSession = (storeIdOrSession: string | CashSession, initialFloat: number = 0) => {
    let session: CashSession;
    if (typeof storeIdOrSession === 'string') {
      const store = globalState.stores.find((s) => s.id === storeIdOrSession);
      session = {
        id: `cs-${Date.now()}`,
        register_id: 'reg-01',
        store_id: storeIdOrSession,
        store_name: store?.name || '',
        user_id: getCurrentUser().id,
        user_name: getCurrentUser().full_name,
        session_code: `CS-${Date.now().toString().slice(-6)}`,
        opening_balance: initialFloat,
        closing_balance_system: initialFloat,
        total_sales_cash: 0,
        total_sales_momo: 0,
        total_expenses: 0,
        total_drops: 0,
        status: 'OPEN',
        opened_at: new Date().toISOString(),
      };
    } else {
      session = storeIdOrSession;
    }

    saveState({
      ...globalState,
      cashSessions: [session, ...globalState.cashSessions],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          store_id: session.store_id,
          store_name: session.store_name,
          user_name: getCurrentUser().full_name,
          action: 'CASH_OPEN',
          entity_type: 'Caisse',
          details: `Ouverture caisse #${session.session_code} - Fond initial: ${session.opening_balance.toLocaleString()} FCFA`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncCashSessionToSupabase(session).catch((e) => console.warn('Background Supabase cash session sync failed:', e));
  };

  const closeCashSession = (sessionId: string, closingBalanceReal: number, discrepancyReason?: string) => {
    const session = globalState.cashSessions.find((s) => s.id === sessionId);
    if (!session) return;

    const discrepancy = closingBalanceReal - session.closing_balance_system;

    const updatedSessions = globalState.cashSessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          status: 'CLOSED' as const,
          closing_balance_real: closingBalanceReal,
          discrepancy,
          discrepancy_reason: discrepancyReason,
          closed_at: new Date().toISOString(),
        };
      }
      return s;
    });

    saveState({
      ...globalState,
      cashSessions: updatedSessions,
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          store_id: session.store_id,
          store_name: session.store_name,
          user_name: getCurrentUser().full_name,
          action: 'CASH_CLOSE',
          entity_type: 'Caisse',
          details: `Clôture caisse #${session.session_code} (Écart: ${discrepancy} FCFA)`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    const closed = updatedSessions.find((s) => s.id === sessionId);
    if (closed) {
      syncCashSessionToSupabase(closed).catch((e) => console.warn('Background Supabase cash close sync failed:', e));
    }
  };

  const addStore = (store: Store) => {
    saveState({
      ...globalState,
      stores: [...globalState.stores, store],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'CREATE_STORE',
          entity_type: 'Boutique',
          details: `Création de la boutique : ${store.name}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncStoreToSupabase(store).catch((e) => console.warn('Background Supabase store sync failed:', e));
  };

  const updateStore = (store: Store) => {
    saveState({
      ...globalState,
      stores: globalState.stores.map((s) => (s.id === store.id ? store : s)),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'UPDATE_STORE',
          entity_type: 'Boutique',
          details: `Modification de la boutique : ${store.name}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncStoreToSupabase(store).catch((e) => console.warn('Background Supabase store update failed:', e));
  };

  const deleteStore = (storeId: string) => {
    if (globalState.stores.length <= 1) {
      alert('Action impossible : Vous devez conserver au moins une boutique active dans le système.');
      return;
    }
    const store = globalState.stores.find((s) => s.id === storeId);
    if (!store) return;

    // Adjust activeStoreId if current active store is deleted
    const newActiveStoreId = globalState.activeStoreId === storeId ? 'ALL' : globalState.activeStoreId;

    // Clean up products stock_by_store for this deleted store
    const updatedProducts = globalState.products.map((p) => {
      if (p.stock_by_store && p.stock_by_store[storeId] !== undefined) {
        const newStockByStore = { ...p.stock_by_store };
        delete newStockByStore[storeId];
        const total = Object.values(newStockByStore).reduce((a, b) => a + Number(b), 0);
        return {
          ...p,
          stock_by_store: newStockByStore,
          total_stock: Number(total.toFixed(3)),
        };
      }
      return p;
    });

    // Reassign users of this store to null store
    const updatedUsers = globalState.users.map((u) => {
      if (u.store_id === storeId) {
        return { ...u, store_id: null };
      }
      return u;
    });

    saveState({
      ...globalState,
      activeStoreId: newActiveStoreId,
      stores: globalState.stores.filter((s) => s.id !== storeId),
      products: updatedProducts,
      users: updatedUsers,
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'DELETE_STORE',
          entity_type: 'Boutique',
          details: `Suppression définitive de la boutique : ${store.name} (${store.code})`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncDeleteStoreFromSupabase(storeId).catch((e) => console.warn('Background Supabase store delete failed:', e));
  };

  const addCategory = (category: Category) => {
    saveState({
      ...globalState,
      categories: [...globalState.categories, category],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'CREATE_CATEGORY',
          entity_type: 'Catégorie',
          details: `Création catégorie : ${category.name}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
    syncCategoryToSupabase(category).catch((e) => console.warn('Background Supabase category sync failed:', e));
  };

  const updateCategory = (category: Category) => {
    saveState({
      ...globalState,
      categories: globalState.categories.map((c) => (c.id === category.id ? category : c)),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'UPDATE_CATEGORY',
          entity_type: 'Catégorie',
          details: `Modification catégorie : ${category.name}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
    syncCategoryToSupabase(category).catch((e) => console.warn('Background Supabase category update failed:', e));
  };

  const deleteCategory = (categoryId: string) => {
    const target = globalState.categories.find((c) => c.id === categoryId);
    if (!target) return;
    if (globalState.categories.length <= 1) {
      alert('Impossible de supprimer la dernière catégorie du catalogue.');
      return;
    }
    saveState({
      ...globalState,
      categories: globalState.categories.filter((c) => c.id !== categoryId),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'DELETE_CATEGORY',
          entity_type: 'Catégorie',
          details: `Suppression catégorie : ${target.name}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
    syncDeleteCategoryFromSupabase(categoryId).catch((e) => console.warn('Background Supabase category delete failed:', e));
  };

  const addCustomer = (customer: Customer) => {
    saveState({
      ...globalState,
      customers: [customer, ...globalState.customers],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'CREATE_CUSTOMER',
          entity_type: 'Client',
          details: `Création client : ${customer.first_name} ${customer.last_name}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const addStaff = (user: UserProfile) => {
    saveState({
      ...globalState,
      users: [...globalState.users, user],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'CREATE_USER',
          entity_type: 'Collaborateur',
          details: `Création du compte collaborateur : ${user.full_name} (${user.role_code} - ${user.email})`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncStaffToSupabase(user).catch((e) => console.warn('Background Supabase staff sync failed:', e));
  };

  const deleteStaff = (userId: string) => {
    const targetStaff = globalState.users.find((u) => u.id === userId);
    if (!targetStaff) return;
    if (targetStaff.role_code === 'OWNER' || targetStaff.role_code === 'SUPERADMIN') {
      alert('Impossible de supprimer un compte Administrateur / Propriétaire.');
      return;
    }

    saveState({
      ...globalState,
      users: globalState.users.filter((u) => u.id !== userId),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'DELETE_USER',
          entity_type: 'Collaborateur',
          details: `Suppression du compte collaborateur : ${targetStaff.full_name} (${targetStaff.code})`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });

    syncDeleteStaffFromSupabase(userId).catch((e) => console.warn('Background Supabase staff delete failed:', e));
  };

  const markNotificationRead = (notifId: string) => {
    saveState({
      ...globalState,
      notifications: globalState.notifications.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)),
    });
  };

  const markAllNotificationsRead = () => {
    saveState({
      ...globalState,
      notifications: globalState.notifications.map((n) => ({ ...n, is_read: true })),
    });
  };

  const deleteNotification = (notifId: string) => {
    saveState({
      ...globalState,
      notifications: globalState.notifications.filter((n) => n.id !== notifId),
    });
    syncDeleteNotificationFromSupabase(notifId).catch((e) => console.warn('Delete notif sync failed:', e));
  };

  const clearAllNotifications = () => {
    saveState({
      ...globalState,
      notifications: [],
    });
    syncClearAllNotificationsFromSupabase().catch((e) => console.warn('Clear notifs sync failed:', e));
  };

  const getCurrentUser = (): UserProfile => {
    return (
      globalState.users.find((u) => u.id === globalState.currentUserId) ||
      globalState.users.find((u) => u.role_code === globalState.currentRole) ||
      globalState.users[0]
    );
  };

  const getActiveStore = (): Store | null => {
    if (globalState.activeStoreId === 'ALL') return null;
    return globalState.stores.find((s) => s.id === globalState.activeStoreId) || null;
  };

  return {
    state,
    currentUser: getCurrentUser(),
    activeStore: getActiveStore(),
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
    syncWithSupabase,
    setActiveStoreId,
    setCurrentRole,
    updateCompany,
    addSale,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    addTransfer,
    updateTransferStatus,
    addExpense,
    openCashSession,
    closeCashSession,
    addStore,
    updateStore,
    deleteStore,
    addCategory,
    updateCategory,
    deleteCategory,
    addCustomer,
    addStaff,
    deleteStaff,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
  };
}
