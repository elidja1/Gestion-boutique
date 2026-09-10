'use client';

import React, { useState } from 'react';
import { Product, Store } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { X, Layers, CheckCircle } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  targetStoreId?: string;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  targetStoreId,
}) => {
  const { state, adjustStock } = useAppStore();

  const [selectedProductId, setSelectedProductId] = useState(product?.id || state.products[0]?.id || '');
  const [selectedStoreId, setSelectedStoreId] = useState(targetStoreId || state.stores[0]?.id || '');
  const [adjustmentType, setAdjustmentType] = useState<'PURCHASE_ENTRY' | 'ADJUSTMENT_POS' | 'ADJUSTMENT_NEG' | 'DAMAGE'>('PURCHASE_ENTRY');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Réception de réapprovisionnement');

  if (!isOpen) return null;

  const currentProd = state.products.find((p) => p.id === selectedProductId) || state.products[0];
  const currentStore = state.stores.find((s) => s.id === selectedStoreId) || state.stores[0];
  const currentStock = currentProd?.stock_by_store?.[selectedStoreId] || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedStoreId || quantity <= 0) return;

    const delta = adjustmentType === 'ADJUSTMENT_NEG' || adjustmentType === 'DAMAGE' ? -quantity : quantity;
    adjustStock(selectedProductId, selectedStoreId, delta, reason, adjustmentType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">Ajustement Manuel de Stock</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Produit Concerné</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {state.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Boutique</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {state.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Stock Actuel en Boutique :</span>
            <span className="font-black text-sm text-blue-700">{currentStock} {currentProd?.unit}s</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Type de Mouvement</label>
            <select
              value={adjustmentType}
              onChange={(e) => {
                const val = e.target.value as any;
                setAdjustmentType(val);
                if (val === 'PURCHASE_ENTRY') setReason('Réception marchandise fournisseur');
                else if (val === 'DAMAGE') setReason('Produit endommagé / avarié');
                else if (val === 'ADJUSTMENT_POS') setReason('Correction inventaire positive');
                else setReason('Correction inventaire négative / perte');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PURCHASE_ENTRY">📥 Entrée de Marchandises (Réception)</option>
              <option value="ADJUSTMENT_POS">➕ Correction Positive (+ Stock)</option>
              <option value="ADJUSTMENT_NEG">➖ Correction Négative (- Stock)</option>
              <option value="DAMAGE">💥 Sortie Perte / Endommagé</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Quantité</label>
            <input
              type="number"
              min={1}
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Motif / Justification</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Valider Mouvement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
