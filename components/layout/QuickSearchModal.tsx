'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Search, Package, Receipt, Store, X, ArrowRight } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: any) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const { state } = useAppStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle search
        isOpen ? onClose() : undefined;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchingProducts = cleanQuery
    ? state.products.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.sku.toLowerCase().includes(cleanQuery) ||
          p.barcode.includes(cleanQuery)
      )
    : [];

  const matchingSales = cleanQuery
    ? state.sales.filter(
        (s) =>
          s.invoice_number.toLowerCase().includes(cleanQuery) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(cleanQuery))
      )
    : [];

  const matchingStores = cleanQuery
    ? state.stores.filter(
        (s) =>
          s.name.toLowerCase().includes(cleanQuery) ||
          s.code.toLowerCase().includes(cleanQuery) ||
          s.city.toLowerCase().includes(cleanQuery)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-blue-600" />
          <input
            type="text"
            placeholder="Rechercher produit, code-barres, facture, boutique..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 divide-y divide-slate-100">
          {!query ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tapez un mot-clé (ex: <span className="font-semibold text-slate-600">Cahier</span>, <span className="font-semibold text-slate-600">VGM01</span>, <span className="font-semibold text-slate-600">FAC-</span>)
            </div>
          ) : matchingProducts.length === 0 &&
            matchingSales.length === 0 &&
            matchingStores.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Aucun résultat trouvé pour « {query} »
            </div>
          ) : (
            <>
              {/* Products */}
              {matchingProducts.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    Produits ({matchingProducts.length})
                  </div>
                  {matchingProducts.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectTab('products');
                        onClose();
                      }}
                      className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400">
                          SKU: {p.sku} • Code: {p.barcode} • Total Stock: {p.total_stock}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-600">
                          {formatCurrency(p.selling_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sales */}
              {matchingSales.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    Factures / Ventes ({matchingSales.length})
                  </div>
                  {matchingSales.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectTab('sales');
                        onClose();
                      }}
                      className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{s.invoice_number}</p>
                        <p className="text-[10px] text-slate-400">
                          Client: {s.customer_name || 'Comptoir'} • Boutique: {s.store_name}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(s.total_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stores */}
              {matchingStores.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-indigo-600" />
                    Boutiques ({matchingStores.length})
                  </div>
                  {matchingStores.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => {
                        onSelectTab('stores');
                        onClose();
                      }}
                      className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{st.name}</p>
                        <p className="text-[10px] text-slate-400">Code: {st.code} • 📍 {st.address}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {st.today_sales_count} ventes auj.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
