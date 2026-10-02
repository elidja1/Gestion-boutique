'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Product } from '@/lib/types';
import { formatCurrency, normalizePriceTiers } from '@/lib/utils';
import { ProductModal } from './ProductModal';
import { QuickStockModal } from './QuickStockModal';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit,
  Trash2,
  Calendar,
  Scale,
  PlusCircle,
  AlertTriangle,
  Store as StoreIcon,
  Tag,
} from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const { state, currentUser, addProduct, updateProduct, deleteProduct, activeStore, setActiveStoreId } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick stock modal state
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);

  const canEdit =
    currentUser.role_code === 'SUPERADMIN' ||
    currentUser.role_code === 'OWNER' ||
    currentUser.role_code === 'MANAGER' ||
    currentUser.role_code === 'STOCK_AGENT';

  const effectiveStoreId = activeStore?.id || state.stores[0]?.id;

  const filteredProducts = state.products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchCat && matchQuery;
  });

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleDelete = (prod: Product) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le produit « ${prod.name} » ?\nCette action le supprimera également de la base de données.`)) {
      deleteProduct(prod.id);
    }
  };

  const handleQuickStock = (prod: Product) => {
    setQuickStockProduct(prod);
    setIsQuickStockOpen(true);
  };

  const handleSave = (prod: Product) => {
    if (editingProduct) {
      updateProduct(prod);
    } else {
      addProduct(prod);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Catalogue & Gestion des Produits
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des stocks par boutique physique, tarifs au kilo/pièce et réductions
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        )}
      </div>

      {/* Filter Bar with Store Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Query */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par désignation, SKU ou code-barres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          {/* Boutique Selector */}
          <div className="w-full md:w-64">
            <div className="relative">
              <select
                value={state.activeStoreId}
                onChange={(e) => setActiveStoreId(e.target.value)}
                className="w-full px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">🏪 Toutes les boutiques (Vue globale)</option>
                {state.stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    🏪 {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Selector */}
          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none font-medium"
            >
              <option value="ALL">Toutes les catégories ({state.products.length})</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Store Indicator */}
        {state.activeStoreId !== 'ALL' && activeStore && (
          <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>
              Affichage du stock spécifique pour la boutique : <strong>{activeStore.name}</strong> ({activeStore.city})
            </span>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Prix d'Achat</th>
                <th className="py-3 px-4">Prix de Vente</th>
                <th className="py-3 px-4">Marge / Bénéfice</th>
                <th className="py-3 px-4">Vente Carton</th>
                <th className="py-3 px-4">Paliers Réduits</th>
                <th className="py-3 px-4">
                  {state.activeStoreId === 'ALL' ? 'Stock par Boutique' : `Stock (${activeStore?.name || 'Boutique'})`}
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucun produit trouvé dans le catalogue.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const currentStock =
                    state.activeStoreId === 'ALL'
                      ? p.total_stock ?? 0
                      : p.stock_by_store?.[effectiveStoreId] ?? 0;

                  const isLow = currentStock <= p.min_stock_alert;
                  const unitMargin = p.selling_price - (p.purchase_price || 0);
                  const marginPct = p.selling_price > 0 ? Math.round((unitMargin / p.selling_price) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            SKU: {p.sku} {p.barcode && `• ${p.barcode}`}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">
                          {p.category_name || 'Général'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-600 text-xs">
                            {formatCurrency(p.purchase_price || 0)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ {p.unit}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-black text-slate-900 text-sm">
                            {formatCurrency(p.selling_price)}
                          </span>
                          <span className="text-[11px] text-slate-500 block">/ {p.unit}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black ${
                            unitMargin >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            +{formatCurrency(unitMargin)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {marginPct}% de marge
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.carton_price ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-purple-700 text-xs">
                              {formatCurrency(p.carton_price)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {p.carton_weight_kg ? `${p.carton_weight_kg} Kg/ctn` : 'Carton standard'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {(() => {
                          const tiers = normalizePriceTiers(p.price_tiers);
                          if (tiers.length === 0) return <span className="text-slate-400 text-[11px]">—</span>;
                          return (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">
                                <Tag className="w-3 h-3" />
                                <span>{tiers.length} palier(s)</span>
                              </span>
                              <div className="text-[10px] text-slate-500 space-y-0.5">
                                {tiers.map((t) => (
                                  <div key={t.id} className="font-semibold text-slate-700">
                                    {t.quantity} {p.unit} ➔ {formatCurrency(t.price)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3.5 px-4">
                        {state.activeStoreId === 'ALL' ? (
                          <div className="space-y-1">
                            <div className="font-black text-sm text-slate-900">
                              Total : {p.total_stock ?? 0} {p.unit}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {state.stores.map((s) => {
                                const stQty = p.stock_by_store?.[s.id] ?? 0;
                                return (
                                  <span
                                    key={s.id}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                      stQty > 0
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    {s.code}: <strong>{stQty} {p.unit}</strong>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold font-mono text-sm ${
                                currentStock <= 0
                                  ? 'text-red-600'
                                  : isLow
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                              }`}
                            >
                              {currentStock} {p.unit}
                            </span>

                            {currentStock <= 0 ? (
                              <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded">
                                Épuisé
                              </span>
                            ) : isLow ? (
                              <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded">
                                Stock Faible
                              </span>
                            ) : null}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => handleQuickStock(p)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              title="Ajouter du stock immédiatement"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>+ Stock</span>
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Modifier le produit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Supprimer le produit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialProduct={editingProduct}
      />

      {/* Quick Stock Modal */}
      <QuickStockModal
        isOpen={isQuickStockOpen}
        product={quickStockProduct}
        onClose={() => setIsQuickStockOpen(false)}
      />
    </div>
  );
};
