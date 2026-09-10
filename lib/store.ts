// Unified Global Application State Manager with Decimal Support (Kg) and Auth Credentials
'use client';

import { useState, useEffect } from 'react';
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

const LOCAL_STORAGE_KEY = 'vgm_app_state_v2';

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
  currentUserId: 'u1111111-1111-1111-1111-111111111111',
};

type Listener = (state: AppState) => void;
let globalState: AppState = defaultState;
const listeners = new Set<Listener>();

function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed };
    }
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
    } catch (e) {
      console.warn('Failed to persist state', e);
    }
  }
  listeners.forEach((l) => l(globalState));
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(globalState);

  useEffect(() => {
    const loaded = loadState();
    globalState = loaded;
    setState(loaded);

    const listener: Listener = (nextState) => {
      setState(nextState);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setActiveStoreId = (storeId: string) => {
    saveState({ ...globalState, activeStoreId: storeId });
  };

  const setCurrentRole = (role: UserRoleType) => {
    const matchingUser = globalState.users.find((u) => u.role_code === role) || globalState.users[0];
    saveState({
      ...globalState,
      currentRole: role,
      currentUserId: matchingUser.id,
      activeStoreId: matchingUser.store_id || (role === 'OWNER' || role === 'ACCOUNTANT' ? globalState.activeStoreId : globalState.stores[0].id),
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
    // 1. Deduct stock
    const updatedProducts = globalState.products.map((prod) => {
      const soldItem = sale.items.find((item) => item.product.id === prod.id);
      if (soldItem) {
        const storeStock = { ...(prod.stock_by_store || {}) };
        const currentQty = storeStock[sale.store_id] || 0;
        const newQty = Math.max(0, currentQty - soldItem.quantity);
        storeStock[sale.store_id] = Number(newQty.toFixed(3));
        const total = Object.values(storeStock).reduce((a, b) => a + Number(b), 0);
        return {
          ...prod,
          stock_by_store: storeStock,
          total_stock: Number(total.toFixed(3)),
        };
      }
      return prod;
    });

    // 2. Add movements
    const newMovements: StockMovement[] = sale.items.map((item) => ({
      id: `mov-${Date.now()}-${item.product.id}`,
      company_id: globalState.company.id,
      store_id: sale.store_id,
      store_name: sale.store_name || '',
      product_id: item.product.id,
      product_name: item.product.name,
      user_name: sale.seller_name || '',
      type: 'SALE',
      quantity: -item.quantity,
      previous_quantity: (item.product.stock_by_store?.[sale.store_id] || 0),
      new_quantity: Math.max(0, (item.product.stock_by_store?.[sale.store_id] || 0) - item.quantity),
      unit: item.product.unit,
      reason: `Vente #${sale.invoice_number} (${item.quantity} ${item.product.unit})`,
      created_at: new Date().toISOString(),
    }));

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
      user_name: sale.seller_name || 'Vendeur',
      action: 'CREATE_SALE',
      entity_type: 'Vente POS',
      details: `Facture #${sale.invoice_number} (${sale.total_amount} FCFA - ${sale.payment_method})`,
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
      auditLogs: [newAudit, ...globalState.auditLogs],
    });
  };

  const addProduct = (product: Product) => {
    saveState({
      ...globalState,
      products: [product, ...globalState.products],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'CREATE_PRODUCT',
          entity_type: 'Produit',
          details: `Création du produit ${product.name} (Unité: ${product.unit}, Périssable: ${product.is_perishable ? 'Oui' : 'Non'})`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const updateProduct = (product: Product) => {
    const updated = globalState.products.map((p) => (p.id === product.id ? product : p));
    saveState({
      ...globalState,
      products: updated,
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'UPDATE_PRODUCT',
          entity_type: 'Produit',
          details: `Modification du produit ${product.name} (${product.selling_price} FCFA/${product.unit})`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const deleteProduct = (productId: string) => {
    const target = globalState.products.find((p) => p.id === productId);
    saveState({
      ...globalState,
      products: globalState.products.filter((p) => p.id !== productId),
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          user_name: getCurrentUser().full_name,
          action: 'DELETE_PRODUCT',
          entity_type: 'Produit',
          details: `Suppression du produit ${target?.name || productId}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const adjustStock = (productId: string, storeId: string, quantityDelta: number, reason: string, type: StockMovement['type']) => {
    const prod = globalState.products.find((p) => p.id === productId);
    const store = globalState.stores.find((s) => s.id === storeId);
    if (!prod || !store) return;

    const currentQty = prod.stock_by_store?.[storeId] || 0;
    const newQty = Math.max(0, currentQty + quantityDelta);

    const updatedProducts = globalState.products.map((p) => {
      if (p.id === productId) {
        const stockMap = { ...(p.stock_by_store || {}) };
        stockMap[storeId] = Number(newQty.toFixed(3));
        const total = Object.values(stockMap).reduce((a, b) => a + Number(b), 0);
        return { ...p, stock_by_store: stockMap, total_stock: Number(total.toFixed(3)) };
      }
      return p;
    });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      company_id: globalState.company.id,
      store_id: storeId,
      store_name: store.name,
      product_id: productId,
      product_name: prod.name,
      user_name: getCurrentUser().full_name,
      type,
      quantity: quantityDelta,
      previous_quantity: currentQty,
      new_quantity: newQty,
      unit: prod.unit,
      reason,
      created_at: new Date().toISOString(),
    };

    saveState({
      ...globalState,
      products: updatedProducts,
      movements: [movement, ...globalState.movements],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          store_id: storeId,
          store_name: store.name,
          user_name: getCurrentUser().full_name,
          action: 'STOCK_ADJUSTMENT',
          entity_type: 'Stock',
          details: `Ajustement (${quantityDelta > 0 ? '+' : ''}${quantityDelta} ${prod.unit}) sur ${prod.name} - Motif: ${reason}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const addTransfer = (transfer: StockTransfer) => {
    saveState({
      ...globalState,
      transfers: [transfer, ...globalState.transfers],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          store_id: transfer.destination_store_id,
          title: 'Demande de transfert de stock',
          message: `Transfert #${transfer.transfer_number} de ${transfer.source_store_name} vers ${transfer.destination_store_name}`,
          type: 'TRANSFER_REQUEST',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...globalState.notifications,
      ],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          store_id: transfer.source_store_id,
          store_name: transfer.source_store_name,
          user_name: getCurrentUser().full_name,
          action: 'TRANSFER_CREATE',
          entity_type: 'Transfert',
          details: `Création transfert #${transfer.transfer_number}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const updateTransferStatus = (transferId: string, newStatus: StockTransfer['status']) => {
    const target = globalState.transfers.find((t) => t.id === transferId);
    if (!target) return;

    let updatedProducts = globalState.products;
    const movementsToAdd: StockMovement[] = [];

    if (newStatus === 'SHIPPED' && target.status !== 'SHIPPED') {
      updatedProducts = updatedProducts.map((prod) => {
        const item = target.items.find((i) => i.product_id === prod.id);
        if (item) {
          const storeStock = { ...(prod.stock_by_store || {}) };
          const cur = storeStock[target.source_store_id] || 0;
          storeStock[target.source_store_id] = Math.max(0, cur - item.quantity_requested);
          const total = Object.values(storeStock).reduce((a, b) => a + Number(b), 0);
          return { ...prod, stock_by_store: storeStock, total_stock: Number(total.toFixed(3)) };
        }
        return prod;
      });

      target.items.forEach((item) => {
        movementsToAdd.push({
          id: `mov-tr-out-${Date.now()}-${item.product_id}`,
          company_id: globalState.company.id,
          store_id: target.source_store_id,
          store_name: target.source_store_name,
          product_id: item.product_id,
          product_name: item.product_name,
          user_name: getCurrentUser().full_name,
          type: 'TRANSFER_OUT',
          quantity: -item.quantity_requested,
          previous_quantity: 0,
          new_quantity: 0,
          unit: item.unit || 'Pièce',
          reason: `Expédition #${target.transfer_number} vers ${target.destination_store_name}`,
          created_at: new Date().toISOString(),
        });
      });
    }

    if (newStatus === 'RECEIVED' && target.status !== 'RECEIVED') {
      updatedProducts = updatedProducts.map((prod) => {
        const item = target.items.find((i) => i.product_id === prod.id);
        if (item) {
          const storeStock = { ...(prod.stock_by_store || {}) };
          const cur = storeStock[target.destination_store_id] || 0;
          storeStock[target.destination_store_id] = cur + item.quantity_requested;
          const total = Object.values(storeStock).reduce((a, b) => a + Number(b), 0);
          return { ...prod, stock_by_store: storeStock, total_stock: Number(total.toFixed(3)) };
        }
        return prod;
      });

      target.items.forEach((item) => {
        movementsToAdd.push({
          id: `mov-tr-in-${Date.now()}-${item.product_id}`,
          company_id: globalState.company.id,
          store_id: target.destination_store_id,
          store_name: target.destination_store_name,
          product_id: item.product_id,
          product_name: item.product_name,
          user_name: getCurrentUser().full_name,
          type: 'TRANSFER_IN',
          quantity: item.quantity_requested,
          previous_quantity: 0,
          new_quantity: 0,
          unit: item.unit || 'Pièce',
          reason: `Réception #${target.transfer_number} de ${target.source_store_name}`,
          created_at: new Date().toISOString(),
        });
      });
    }

    const updatedTransfers = globalState.transfers.map((t) =>
      t.id === transferId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
    );

    saveState({
      ...globalState,
      transfers: updatedTransfers,
      products: updatedProducts,
      movements: [...movementsToAdd, ...globalState.movements],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          store_id: target.destination_store_id,
          store_name: target.destination_store_name,
          user_name: getCurrentUser().full_name,
          action: 'TRANSFER_STATUS_CHANGE',
          entity_type: 'Transfert',
          details: `Statut transfert #${target.transfer_number} : ${newStatus}`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
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
          details: `Dépense #${expense.expense_code} (${expense.amount} FCFA - ${expense.category_name})`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const openCashSession = (storeId: string, initialFloat: number) => {
    const store = globalState.stores.find((s) => s.id === storeId);
    const newSession: CashSession = {
      id: `cs-${Date.now()}`,
      register_id: `ca-${storeId}`,
      store_id: storeId,
      store_name: store?.name || '',
      user_id: globalState.currentUserId,
      user_name: getCurrentUser().full_name,
      session_code: `CA-${Math.floor(1000 + Math.random() * 9000)}`,
      opening_balance: initialFloat,
      closing_balance_system: initialFloat,
      total_sales_cash: 0,
      total_sales_momo: 0,
      total_expenses: 0,
      total_drops: 0,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
    };

    saveState({
      ...globalState,
      cashSessions: [newSession, ...globalState.cashSessions],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          store_id: storeId,
          store_name: store?.name,
          user_name: getCurrentUser().full_name,
          action: 'CASH_OPEN',
          entity_type: 'Caisse',
          details: `Ouverture caisse #${newSession.session_code} avec fond de ${initialFloat} FCFA`,
          created_at: new Date().toISOString(),
        },
        ...globalState.auditLogs,
      ],
    });
  };

  const closeCashSession = (sessionId: string, realCount: number, reason?: string) => {
    const session = globalState.cashSessions.find((s) => s.id === sessionId);
    if (!session) return;

    const discrepancy = realCount - session.closing_balance_system;

    const updatedSessions = globalState.cashSessions.map((cs) => {
      if (cs.id === sessionId) {
        return {
          ...cs,
          status: 'CLOSED' as const,
          closing_balance_real: realCount,
          discrepancy,
          discrepancy_reason: reason || '',
          closed_at: new Date().toISOString(),
        };
      }
      return cs;
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
    addCustomer,
    addStaff,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
