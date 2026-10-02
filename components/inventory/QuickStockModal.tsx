'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { X, PlusCircle, Check } from 'lucide-react';

interface QuickStockModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export const QuickStockModal: React.FC<QuickStockModalProps> = ({
  isOpen,
  product,
  onClose,
}) => {
  const { state, activeStore, adjustStock } = useAppStore();

  const [quantityToAdd, setQuantityToAdd] = useState<number>(10);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    activeStore?.id || state.stores[0]?.id || ''
  );

  if (!isOpen || !product) return null;

  const currentStore = state.stores.find((s) => s.id === selectedStoreId) || state.stores[0];
  const currentStock = product.stock_by_store?.[selectedStoreId] || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityToAdd <= 0) return;

    adjustStock(
      product.id,
      selectedStoreId,
      quantityToAdd,
      `Réapprovisionnement rapide (+${quantityToAdd} ${product.unit})`,
      'PURCHASE_ENTRY'
    );
    onClose();
  };

  const handlePreset = (qty: number) => {
    setQuantityToAdd(qty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold">Ajout Rapide de Stock</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="font-bold text-slate-900 text-sm">{product.name}</p>
            <p className="text-slate-500 mt-0.5">
              Stock actuel ({currentStore?.name}) :{' '}
              <strong className="text-slate-900 font-mono">
                {currentStock} {product.unit}
              </strong>
            </p>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Boutique de destination</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none font-medium"
            >
              {state.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Quantité à ajouter ({product.unit})
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              required
              value={quantityToAdd || ''}
              onChange={(e) => setQuantityToAdd(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[5, 10, 25, 50, 100, 200, 500, 1000].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => handlePreset(qty)}
                className={`py-1.5 text-center font-bold rounded-lg border transition-all ${
                  quantityToAdd === qty
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                +{qty}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Valider (+Stock)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
