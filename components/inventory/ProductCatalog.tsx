'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Product } from '@/lib/types';
import { formatCurrency, formatDateOnly } from '@/lib/utils';
import { ProductModal } from './ProductModal';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit,
  Trash2,
  Calendar,
  Scale,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const { state, currentUser, addProduct, updateProduct, deleteProduct } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [perishableFilter, setPerishableFilter] = useState<'ALL' | 'PERISHABLE' | 'NON_PERISHABLE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const canEdit = currentUser.role_code === 'OWNER' || currentUser.role_code === 'MANAGER' || currentUser.role_code === 'STOCK_AGENT';

  const filteredProducts = state.products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchPerishable =
      perishableFilter === 'ALL' ||
      (perishableFilter === 'PERISHABLE' && p.is_perishable) ||
      (perishableFilter === 'NON_PERISHABLE' && !p.is_perishable);
    return matchCat && matchQuery && matchPerishable;
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${prod.name}" ?`)) {
      deleteProduct(prod.id);
    }
  };

  const handleSave = (prod: Product) => {
    if (editingProduct) {
      updateProduct(prod);
    } else {
      addProduct(prod);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            📦 Catalogue Produits, Pesée (Kg) & DLUO
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gérez les articles vendus à la pièce ou au kilo, les dates de péremption et les stocks
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nouveau Produit (Pièce ou Kg)</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, SKU ou code-barres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="ALL">Toutes les catégories ({state.products.length})</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={perishableFilter}
              onChange={(e) => setPerishableFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="ALL">Tous types de conservation</option>
              <option value="PERISHABLE">⚠️ Produits Périssables (DLUO)</option>
              <option value="NON_PERISHABLE">🟢 Longue Conservation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Article / SKU</th>
                <th className="px-4 py-3.5">Catégorie & Unité</th>
                <th className="px-4 py-3.5">Conservation / DLUO</th>
                <th className="px-4 py-3.5 text-right">Prix Achat</th>
                <th className="px-4 py-3.5 text-right">Prix Vente</th>
                <th className="px-4 py-3.5 text-center">Stock Global</th>
                {canEdit && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const totalStock = p.total_stock || 0;
                const isRupture = totalStock === 0;
                const isLow = totalStock <= p.min_stock_alert && !isRupture;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.unit === 'Kg' ? <Scale className="w-4 h-4 text-emerald-600" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-950">{p.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Barcode className="w-3 h-3 text-slate-400" />
                              {p.barcode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md text-[10px]">
                          {p.category_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.unit === 'Kg' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {p.unit}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {p.is_perishable ? (
                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 w-fit text-[11px] font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Exp: {p.expiry_date ? formatDateOnly(p.expiry_date) : 'DLUO requise'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Longue conservation</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right text-slate-500 font-medium">
                      {formatCurrency(p.purchase_price)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className="font-black text-slate-900 text-xs">
                        {formatCurrency(p.selling_price)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/{p.unit}</span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          isRupture
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isRupture ? '🔴 0' : isLow ? `⚠️ ${totalStock} ${p.unit}` : `🟢 ${totalStock} ${p.unit}`}
                      </span>
                    </td>

                    {canEdit && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialProduct={editingProduct}
      />
    </div>
  );
};
