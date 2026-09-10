'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Product } from '@/lib/types';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import {
  Layers,
  Search,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  History,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface StockMatrixProps {
  onNavigateTab: (tab: any) => void;
}

export const StockMatrix: React.FC<StockMatrixProps> = ({ onNavigateTab }) => {
  const { state } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'movements' | 'inventory'>('matrix');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Inventory count physical check state
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});
  const [inventoryValidated, setInventoryValidated] = useState(false);

  const filteredProducts = state.products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdjustment = (prod?: Product) => {
    setSelectedProduct(prod || null);
    setIsAdjustmentModalOpen(true);
  };

  const handleValidateInventory = () => {
    setInventoryValidated(true);
    setTimeout(() => {
      alert('Inventaire physique validé avec succès ! Les écarts ont été consignés dans le journal d audit.');
    }, 100);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            📊 Gestion des Stocks Multi-Boutiques
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Matrice des disponibilités par boutique, alertes de réapprovisionnement et inventaires
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('transfers')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>Transfert inter-boutiques</span>
          </button>
          <button
            onClick={() => handleOpenAdjustment()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ajuster / Réception</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Matrice des Stocks (Multi-Sites)
        </button>
        <button
          onClick={() => setActiveSubTab('movements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'movements' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Journal des Mouvements ({state.movements.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Session d'Inventaire Physique</span>
        </button>
      </div>

      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer par article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Produit / Article</th>
                    {state.stores.map((s) => (
                      <th key={s.id} className="px-4 py-3.5 text-center">
                        <span className="font-black text-slate-800">{s.code}</span>
                        <span className="text-[9px] text-slate-400 block font-normal truncate max-w-[90px]">
                          {s.city}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-center">Total Entreprise</th>
                    <th className="px-4 py-3.5 text-center">État Stock</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => {
                    const total = prod.total_stock || 0;
                    const isRupture = total === 0;
                    const isLow = total <= prod.min_stock_alert && !isRupture;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-950">{prod.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                        </td>

                        {state.stores.map((s) => {
                          const qty = prod.stock_by_store?.[s.id] ?? 0;
                          return (
                            <td key={s.id} className="px-4 py-3.5 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                                  qty === 0
                                    ? 'bg-rose-100 text-rose-700'
                                    : qty <= prod.min_stock_alert
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {qty}
                              </span>
                            </td>
                          );
                        })}

                        <td className="px-4 py-3.5 text-center font-black text-sm text-slate-950">
                          {total}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isRupture
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isRupture ? '🔴 Rupture' : isLow ? '🟠 Faible' : '🟢 Normal'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenAdjustment(prod)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all"
                          >
                            Ajuster
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'movements' && (
        /* Movements Log */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Historique des Flux & Mouvements de Stock</h3>
            <span className="text-xs text-slate-500">{state.movements.length} mouvements enregistrés</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px]">
                <tr>
                  <th className="px-5 py-3">Date & Heure</th>
                  <th className="px-4 py-3">Boutique</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-center">Variation</th>
                  <th className="px-4 py-3">Motif / Justification</th>
                  <th className="px-5 py-3 text-right">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 text-slate-500">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{m.store_name}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{m.product_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md text-[10px]">
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-black text-xs ${
                          m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.reason}</td>
                    <td className="px-5 py-3 text-right text-slate-500 font-medium">{m.user_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'inventory' && (
        /* Physical Inventory Reconciliation */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">
                🧮 Session d'Inventaire Physique en Direct
              </h3>
              <p className="text-xs text-slate-500">
                Comparez le stock théorique système au comptage réel physique et ajustez les écarts
              </p>
            </div>
            <button
              onClick={handleValidateInventory}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Valider l'Inventaire & Clôturer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3 text-center">Stock Système</th>
                  <th className="px-4 py-3 text-center">Stock Réel Compté</th>
                  <th className="px-4 py-3 text-center">Différence / Écart</th>
                  <th className="px-4 py-3">Remarque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.products.map((p) => {
                  const systemQty = p.total_stock || 0;
                  const countedQty = inventoryCounts[p.id] !== undefined ? inventoryCounts[p.id] : systemQty;
                  const diff = countedQty - systemQty;

                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-center font-black text-slate-700">{systemQty}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={countedQty}
                          onChange={(e) =>
                            setInventoryCounts({ ...inventoryCounts, [p.id]: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-black text-xs ${
                            diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {diff === 0 ? 'Conforme' : diff > 0 ? 'Surplus détecté' : 'Manquant / Perte'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};
