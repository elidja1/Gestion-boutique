// Offline Sync Queue & Outbox Manager for Vertu De Gloire Market
// Handles offline buffering, automatic retry on reconnect, and persistent storage
'use client';

import {
  Sale,
  Product,
  Expense,
  CashSession,
  UserProfile,
  Store,
  StockTransfer,
  NotificationItem,
  Category,
} from './types';
import {
  syncSaleToSupabase,
  syncProductToSupabase,
  syncExpenseToSupabase,
  syncCashSessionToSupabase,
  syncStaffToSupabase,
  syncStoreToSupabase,
  syncTransferToSupabase,
  syncNotificationToSupabase,
  syncDeleteNotificationFromSupabase,
  syncDeleteStaffFromSupabase,
  syncDeleteProductFromSupabase,
  syncDeleteStoreFromSupabase,
  syncCategoryToSupabase,
  syncDeleteCategoryFromSupabase,
} from './supabaseSync';

export type QueueActionType =
  | 'SYNC_SALE'
  | 'SYNC_PRODUCT'
  | 'SYNC_EXPENSE'
  | 'SYNC_CASH_SESSION'
  | 'SYNC_TRANSFER'
  | 'SYNC_STORE'
  | 'SYNC_CATEGORY'
  | 'SYNC_STAFF'
  | 'SYNC_NOTIFICATION'
  | 'DELETE_STAFF'
  | 'DELETE_PRODUCT'
  | 'DELETE_STORE'
  | 'DELETE_CATEGORY'
  | 'DELETE_NOTIFICATION';

export interface QueueItem {
  id: string;
  type: QueueActionType;
  payload: any;
  createdAt: string;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'vgm_offline_sync_queue_v1';
let isFlushing = false;

/**
 * Get current pending queue from localStorage
 */
export function getSyncQueue(): QueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to read sync queue from localStorage:', e);
    return [];
  }
}

/**
 * Save sync queue to localStorage and notify listeners
 */
function saveSyncQueue(queue: QueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('vgm-sync-queue-updated', { detail: { count: queue.length } }));
  } catch (e) {
    console.warn('Failed to save sync queue to localStorage:', e);
  }
}

/**
 * Get count of pending items
 */
export function getPendingQueueCount(): number {
  return getSyncQueue().length;
}

/**
 * Enqueue an action to be synchronized when online
 */
export function enqueueSyncAction(type: QueueActionType, payload: any): void {
  const current = getSyncQueue();
  const newItem: QueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  current.push(newItem);
  saveSyncQueue(current);
  console.info(`[OfflineQueue] Enqueued action ${type} (Total en attente: ${current.length})`);
}

/**
 * Dispatch a sync operation. If device is offline or sync fails, queue it automatically.
 */
export async function dispatchSyncWithOfflineSupport(
  type: QueueActionType,
  payload: any,
  syncFn: () => Promise<boolean>
): Promise<boolean> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    console.info(`[OfflineQueue] Appareil hors-ligne. Mise en file d'attente directe de ${type}`);
    enqueueSyncAction(type, payload);
    return false;
  }

  try {
    const ok = await syncFn();
    if (!ok) {
      console.warn(`[OfflineQueue] Échec de synchronisation pour ${type}. Mise en file d'attente.`);
      enqueueSyncAction(type, payload);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[OfflineQueue] Erreur réseau/serveur pour ${type}. Mise en file d'attente :`, err);
    enqueueSyncAction(type, payload);
    return false;
  }
}

/**
 * Process single queue item with appropriate Supabase sync function
 */
async function processQueueItem(item: QueueItem): Promise<boolean> {
  try {
    switch (item.type) {
      case 'SYNC_SALE':
        return await syncSaleToSupabase(item.payload.sale, item.payload.updatedProducts);
      case 'SYNC_PRODUCT':
        return await syncProductToSupabase(item.payload as Product);
      case 'SYNC_EXPENSE':
        return await syncExpenseToSupabase(item.payload as Expense);
      case 'SYNC_CASH_SESSION':
        return await syncCashSessionToSupabase(item.payload as CashSession);
      case 'SYNC_TRANSFER':
        return await syncTransferToSupabase(item.payload as StockTransfer);
      case 'SYNC_STORE':
        return await syncStoreToSupabase(item.payload as Store);
      case 'SYNC_CATEGORY':
        return await syncCategoryToSupabase(item.payload as Category);
      case 'SYNC_STAFF':
        return await syncStaffToSupabase(item.payload as UserProfile);
      case 'SYNC_NOTIFICATION':
        return await syncNotificationToSupabase(item.payload as NotificationItem);
      case 'DELETE_STAFF':
        return await syncDeleteStaffFromSupabase(item.payload.userId);
      case 'DELETE_PRODUCT':
        return await syncDeleteProductFromSupabase(item.payload.productId);
      case 'DELETE_STORE':
        return await syncDeleteStoreFromSupabase(item.payload.storeId);
      case 'DELETE_CATEGORY':
        return await syncDeleteCategoryFromSupabase(item.payload.categoryId);
      case 'DELETE_NOTIFICATION':
        return await syncDeleteNotificationFromSupabase(item.payload.notifId);
      default:
        console.warn(`[OfflineQueue] Action inconnue ${item.type}, suppression de la file.`);
        return true;
    }
  } catch (e) {
    console.warn(`[OfflineQueue] Exception lors du rejeu de ${item.type} :`, e);
    return false;
  }
}

/**
 * Flush and replay the entire sync queue
 */
export async function flushSyncQueue(): Promise<{ processed: number; remaining: number }> {
  if (isFlushing) {
    return { processed: 0, remaining: getPendingQueueCount() };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, remaining: getPendingQueueCount() };
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { processed: 0, remaining: 0 };
  }

  isFlushing = true;
  console.info(`[OfflineQueue] Début du déchargement de la file d'attente (${queue.length} actions en attente)...`);

  const remainingQueue: QueueItem[] = [];
  let processedCount = 0;

  for (const item of queue) {
    const success = await processQueueItem(item);
    if (success) {
      processedCount++;
    } else {
      // Re-queue with incremented retry count
      const updatedItem = { ...item, retryCount: item.retryCount + 1 };
      // Stop further processing if network failure to preserve FIFO ordering for dependent actions
      remainingQueue.push(updatedItem);
      console.warn(`[OfflineQueue] Interruption du déchargement : impossible de synchroniser ${item.type}.`);
      // Keep rest of queue
      const currentIndex = queue.indexOf(item);
      for (let i = currentIndex + 1; i < queue.length; i++) {
        remainingQueue.push(queue[i]);
      }
      break;
    }
  }

  saveSyncQueue(remainingQueue);
  isFlushing = false;

  console.info(`[OfflineQueue] Déchargement terminé : ${processedCount} synchronisés, ${remainingQueue.length} restants.`);
  return { processed: processedCount, remaining: remainingQueue.length };
}
