'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { StockTransfer, TransferStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle,
  Truck,
  Clock,
  PackageCheck,
  XCircle,
  X,
  FileText,
} from 'lucide-react';

export const TransferWorkflow: React.FC = () => {
  const { state, currentUser, addTransfer, updateTransferStatus } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceStoreId, setSourceStoreId] = useState(state.stores[0]?.id || '');
  const [destStoreId, setDestStoreId] = useState(state.stores[1]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(state.products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(20);
  const [notes, setNotes] = useState('');

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceStoreId === destStoreId) {
      alert('La boutique source et la boutique destination doivent être différentes !');
      return;
    }

    const srcStore = state.stores.find((s) => s.id === sourceStoreId)!;
    const dstStore = state.stores.find((s) => s.id === destStoreId)!;
    const prod = state.products.find((p) => p.id === selectedProductId)!;

    const newTransfer: StockTransfer = {
      id: `tr-${Date.now()}`,
      company_id: state.company.id,
      transfer_number: `TR-000${Math.floor(100 + Math.random() * 900)}`,
      source_store_id: sourceStoreId,
      source_store_name: srcStore.name,
      destination_store_id: destStoreId,
      destination_store_name: dstStore.name,
      requested_by_name: currentUser.full_name,
      status: 'PENDING',
      notes,
      items: [
        {
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          quantity_requested: quantity,
          quantity_shipped: 0,
          quantity_received: 0,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addTransfer(newTransfer);
    setIsModalOpen(false);
    setNotes('');
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] flex items-center gap-1"><Clock className="w-3 h-3" /> En attente validation</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approuvé</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-bold text-[10px] flex items-center gap-1"><Truck className="w-3 h-3" /> En cours d'acheminement</span>;
      case 'RECEIVED':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px] flex items-center gap-1"><PackageCheck className="w-3 h-3" /> Reçu & Stock Sync</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[10px] flex items-center gap-1"><XCircle className="w-3 h-3" /> Annulé</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            🔄 Transferts de Stock Inter-Boutiques
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gérez les flux logistiques (Demande → Approbation → Expédition → Réception)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nouvelle Demande de Transfert</span>
        </button>
      </div>

      {/* Pipeline Explanation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
        <div className="p-3 bg-white rounded-2xl border border-slate-200">
          <span className="font-bold text-slate-400 block text-[10px]">ÉTAPE 1</span>
          <span className="font-black text-slate-800">1. Demande</span>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200">
          <span className="font-bold text-slate-400 block text-[10px]">ÉTAPE 2</span>
          <span className="font-black text-blue-600">2. Approbation</span>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200">
          <span className="font-bold text-slate-400 block text-[10px]">ÉTAPE 3</span>
          <span className="font-black text-purple-600">3. Expédition</span>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200">
          <span className="font-bold text-slate-400 block text-[10px]">ÉTAPE 4</span>
          <span className="font-black text-emerald-600">4. Réception</span>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
          <span className="font-bold text-slate-400 block text-[10px]">SYNCHRO</span>
          <span className="font-black text-slate-900">Stock Mis à Jour</span>
        </div>
      </div>

      {/* Transfer List */}
      <div className="space-y-4">
        {state.transfers.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-blue-600 font-mono">
                  {t.transfer_number}
                </span>
                {getStatusBadge(t.status)}
                <span className="text-[10px] text-slate-400">{formatDate(t.created_at)}</span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="p-1.5 bg-slate-100 rounded-lg">{t.source_store_name}</span>
                <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">{t.destination_store_name}</span>
              </div>

              {/* Items & Notes */}
              <div className="text-xs text-slate-600 space-y-0.5">
                {t.items.map((i, idx) => (
                  <p key={idx}>
                    📦 <strong>{i.product_name}</strong> — Quantité :{' '}
                    <span className="font-black text-slate-950">{i.quantity_requested} unités</span>
                  </p>
                ))}
                {t.notes && <p className="text-[11px] text-slate-400 italic">« {t.notes} »</p>}
                <p className="text-[10px] text-slate-400">Demandé par : {t.requested_by_name}</p>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
              {t.status === 'PENDING' && (
                <button
                  onClick={() => updateTransferStatus(t.id, 'APPROVED')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  ✓ Approuver
                </button>
              )}

              {t.status === 'APPROVED' && (
                <button
                  onClick={() => updateTransferStatus(t.id, 'SHIPPED')}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Expédier (Déduit B01)</span>
                </button>
              )}

              {t.status === 'SHIPPED' && (
                <button
                  onClick={() => updateTransferStatus(t.id, 'RECEIVED')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Confirmer Réception (Crédite B03)</span>
                </button>
              )}

              {t.status !== 'RECEIVED' && t.status !== 'CANCELLED' && (
                <button
                  onClick={() => updateTransferStatus(t.id, 'CANCELLED')}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-semibold transition-all"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Nouvelle Demande de Transfert</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Boutique Source (Départ) *</label>
                  <select
                    value={sourceStoreId}
                    onChange={(e) => setSourceStoreId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {state.stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Boutique Destination *</label>
                  <select
                    value={destStoreId}
                    onChange={(e) => setDestStoreId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {state.stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Article à Transférer *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Dispo Source: {p.stock_by_store?.[sourceStoreId] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Quantité à Transférer *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Motif d'Urgence</label>
                <input
                  type="text"
                  placeholder="Ex: Réapprovisionnement forte demande"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20"
                >
                  Créer la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
