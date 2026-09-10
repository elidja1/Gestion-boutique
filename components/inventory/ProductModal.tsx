'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductUnitType } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { X, Package, CheckCircle, Calendar, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prod: Product) => void;
  initialProduct?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}) => {
  const { state } = useAppStore();

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category_id: state.categories[0]?.id || '',
    unit: 'Pièce',
    is_weight_based: false,
    is_perishable: false,
    expiry_date: null,
    purchase_price: 1000,
    selling_price: 1500,
    promo_price: null,
    min_stock_alert: 5,
    description: '',
    is_active: true,
  });

  const [stockByStore, setStockByStore] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialProduct) {
      setFormData(initialProduct);
      setStockByStore(initialProduct.stock_by_store || {});
    } else {
      const randCode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
      const randSku = `SKU-${Math.floor(100 + Math.random() * 900)}`;
      setFormData({
        name: '',
        sku: randSku,
        barcode: randCode,
        category_id: state.categories[0]?.id || '',
        unit: 'Pièce',
        is_weight_based: false,
        is_perishable: false,
        expiry_date: null,
        purchase_price: 1000,
        selling_price: 1500,
        promo_price: null,
        min_stock_alert: 5,
        description: '',
        is_active: true,
      });
      const initialMap: Record<string, number> = {};
      state.stores.forEach((s) => {
        initialMap[s.id] = 10;
      });
      setStockByStore(initialMap);
    }
  }, [initialProduct, isOpen, state.categories, state.stores]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    const cat = state.categories.find((c) => c.id === formData.category_id);
    const total = Object.values(stockByStore).reduce((a, b) => a + Number(b || 0), 0);

    const productToSave: Product = {
      id: initialProduct?.id || `p-${Date.now()}`,
      company_id: initialProduct?.company_id || state.company.id,
      category_id: formData.category_id || state.categories[0].id,
      category_name: cat?.name || 'Général',
      name: formData.name!,
      sku: formData.sku!,
      barcode: formData.barcode || formData.sku!,
      description: formData.description || '',
      unit: formData.unit || 'Pièce',
      is_weight_based: formData.unit === 'Kg' || formData.unit === 'Gramme' || formData.is_weight_based,
      is_perishable: !!formData.is_perishable,
      expiry_date: formData.is_perishable ? formData.expiry_date : null,
      purchase_price: Number(formData.purchase_price || 0),
      selling_price: Number(formData.selling_price || 0),
      promo_price: formData.promo_price ? Number(formData.promo_price) : null,
      min_stock_alert: Number(formData.min_stock_alert || 5),
      is_active: formData.is_active ?? true,
      stock_by_store: stockByStore,
      total_stock: total,
    };

    onSave(productToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">
              {initialProduct ? 'Modifier le Produit' : 'Ajouter un Produit (Pièce ou au Kg)'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nom de l'Article / Produit *</label>
            <input
              type="text"
              required
              placeholder="Ex: Riz Parfumé Long Grain ou Cahier 300P"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Référence / SKU *</label>
              <input
                type="text"
                required
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Code-barres EAN-13 / Scanner</label>
              <input
                type="text"
                value={formData.barcode || ''}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Catégorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Unité de Vente & Pesée *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => {
                  const unitVal = e.target.value;
                  setFormData({
                    ...formData,
                    unit: unitVal,
                    is_weight_based: unitVal === 'Kg' || unitVal === 'Gramme',
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pièce">Pièce (Unité unitaire)</option>
                <option value="Kg">Kilogramme — Kg (Pesée & Vente fractionnée 0.5kg, 1.25kg...)</option>
                <option value="Gramme">Gramme — g (Pesée)</option>
                <option value="Litre">Litre — L (Volume)</option>
                <option value="Paquet">Paquet / Sachet</option>
                <option value="Carton">Carton / Caisse</option>
                <option value="Boîte">Boîte / Flacon</option>
                <option value="Mètre">Mètre (Tissu / Câble)</option>
              </select>
            </div>
          </div>

          {/* Conservable / Perissable Settings */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  Conservation & Date de Péremption
                </span>
                <span className="text-[11px] text-slate-500">
                  Le produit est-il conservable indéfiniment ou a-t-il une date d'expiration (DLUO) ?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_perishable: false, expiry_date: null })}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    !formData.is_perishable
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  🟢 Longue Conservation
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_perishable: true })}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    formData.is_perishable
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  ⚠️ Périssable (Date DLUO)
                </button>
              </div>
            </div>

            {formData.is_perishable && (
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Date Limite de Consommation / Péremption (DLUO) :</span>
                </label>
                <input
                  type="date"
                  required={formData.is_perishable}
                  value={formData.expiry_date || ''}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Pricing Grid */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Prix d'Achat (FCFA / {formData.unit})
              </label>
              <input
                type="number"
                value={formData.purchase_price || ''}
                onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Prix de Vente (FCFA / {formData.unit})
              </label>
              <input
                type="number"
                value={formData.selling_price || ''}
                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Prix Promo (Optionnel)</label>
              <input
                type="number"
                placeholder="Optionnel"
                value={formData.promo_price || ''}
                onChange={(e) => setFormData({ ...formData, promo_price: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Seuil d'Alerte Stock Faible ({formData.unit}s)
            </label>
            <input
              type="number"
              value={formData.min_stock_alert || 5}
              onChange={(e) => setFormData({ ...formData, min_stock_alert: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 outline-none"
            />
          </div>

          {/* Stock Allocation per Boutique */}
          <div className="pt-2">
            <label className="font-bold text-slate-800 block mb-2">
              📊 Répartition du Stock Initial ({formData.unit}s) par Boutique
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {state.stores.map((st) => (
                <div key={st.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700 truncate mr-2">{st.name.split(' - ')[1] || st.code}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={formData.unit === 'Kg' ? '0.1' : '1'}
                      value={stockByStore[st.id] ?? 0}
                      onChange={(e) => setStockByStore({ ...stockByStore, [st.id]: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">{formData.unit}</span>
                  </div>
                </div>
              ))}
            </div>
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
              <span>Enregistrer le Produit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
