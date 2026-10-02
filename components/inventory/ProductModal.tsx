'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, PriceTier } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { normalizePriceTiers, calculateTieredPrice, formatCurrency } from '@/lib/utils';
import {
  X,
  Package,
  Check,
  Plus,
  Trash2,
  Scale,
  Box,
  Tag,
  Layers,
  Save,
  Sparkles,
  Calculator,
  AlertCircle,
  Store as StoreIcon,
} from 'lucide-react';

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

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(state.categories[0]?.id || '');
  const [saleMode, setSaleMode] = useState<'KG' | 'PIECE'>('KG');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [normalPrice, setNormalPrice] = useState<number | ''>('');

  // Stock per store state: { [storeId]: quantity }
  const [storeStocks, setStoreStocks] = useState<Record<string, number | ''>>({});

  // Vente au Carton (Facultatif)
  const [cartonPurchasePrice, setCartonPurchasePrice] = useState<number | ''>('');
  const [cartonPrice, setCartonPrice] = useState<number | ''>('');
  const [cartonWeightKg, setCartonWeightKg] = useState<number | ''>('');
  const [cartonStock, setCartonStock] = useState<number | ''>('');

  // Tarifs Réduits & Paliers
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setCategoryId(initialProduct.category_id || state.categories[0]?.id || '');
      const isWeight = initialProduct.unit === 'Kg' || initialProduct.unit === 'Gramme' || !!initialProduct.is_weight_based;
      setSaleMode(isWeight ? 'KG' : 'PIECE');
      setPurchasePrice(initialProduct.purchase_price ?? '');
      setNormalPrice(initialProduct.selling_price || '');

      // Load stock per store
      const initialMap: Record<string, number | ''> = {};
      state.stores.forEach((s) => {
        const qty = initialProduct.stock_by_store?.[s.id];
        initialMap[s.id] = typeof qty === 'number' ? qty : 0;
      });
      setStoreStocks(initialMap);

      const cW = initialProduct.carton_weight_kg;
      const pPrice = initialProduct.purchase_price;
      const calculatedCartonPurchase = cW && pPrice ? Math.round(cW * pPrice) : '';
      setCartonPurchasePrice(calculatedCartonPurchase);

      setCartonPrice(initialProduct.carton_price ?? '');
      setCartonWeightKg(initialProduct.carton_weight_kg ?? '');
      setCartonStock(initialProduct.carton_stock ?? '');
      setPriceTiers(normalizePriceTiers(initialProduct.price_tiers));
    } else {
      setName('');
      setCategoryId(state.categories[0]?.id || '');
      setSaleMode('KG');
      setPurchasePrice('');
      setNormalPrice('');

      // Initialize empty stock for all stores
      const emptyMap: Record<string, number | ''> = {};
      state.stores.forEach((s) => {
        emptyMap[s.id] = '';
      });
      setStoreStocks(emptyMap);

      setCartonPurchasePrice('');
      setCartonPrice('');
      setCartonWeightKg('');
      setCartonStock('');
      setPriceTiers([]);
    }
  }, [initialProduct, isOpen, state.categories, state.stores]);

  // Total stock calculated as sum across all stores
  const calculatedTotalStock = useMemo(() => {
    return Object.values(storeStocks).reduce((acc: number, val) => {
      const num = typeof val === 'number' ? val : 0;
      return Math.round((acc + num) * 1000) / 1000;
    }, 0);
  }, [storeStocks]);

  const handleStoreStockChange = (storeId: string, valStr: string) => {
    const val = valStr === '' ? '' : Math.max(0, Number(valStr));
    setStoreStocks((prev) => ({
      ...prev,
      [storeId]: val,
    }));
  };

  // Compute carton total kg
  const cartonTotalKg = useMemo(() => {
    const cW = typeof cartonWeightKg === 'number' ? cartonWeightKg : 0;
    const cS = typeof cartonStock === 'number' ? cartonStock : 0;
    return Math.round(cW * cS * 100) / 100;
  }, [cartonWeightKg, cartonStock]);

  // Carton price validation
  const isCartonPriceInvalid = useMemo(() => {
    if (typeof cartonPrice === 'number' && cartonPrice > 0 && typeof normalPrice === 'number' && normalPrice > 0) {
      return cartonPrice < normalPrice;
    }
    return false;
  }, [cartonPrice, normalPrice]);

  // Suggested carton price calculation
  const suggestedCartonPrice = useMemo(() => {
    if (typeof normalPrice === 'number' && normalPrice > 0 && typeof cartonWeightKg === 'number' && cartonWeightKg > 0) {
      return Math.round(normalPrice * cartonWeightKg);
    }
    return null;
  }, [normalPrice, cartonWeightKg]);

  const handleAddTier = (qty: number, defaultPrice?: number) => {
    const unitLabel = saleMode === 'KG' ? 'Kg' : 'pièces';
    const numPrice = typeof normalPrice === 'number' ? normalPrice : 0;
    const newTier: PriceTier = {
      id: `tier-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      quantity: qty,
      price: defaultPrice || (numPrice > 0 ? Math.round(numPrice * qty * 0.85) : 0),
      label: `Palier ${qty} ${unitLabel}`,
    };
    setPriceTiers([...priceTiers, newTier]);
  };

  const handleUpdateTier = (index: number, field: keyof PriceTier, value: any) => {
    const updated = [...priceTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPriceTiers(updated);
  };

  const handleRemoveTier = (index: number) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  // Preview simulations for admin validation
  const tierSimulations = useMemo(() => {
    const numPrice = typeof normalPrice === 'number' ? normalPrice : 0;
    if (numPrice <= 0 || priceTiers.length === 0) return [];

    const dummyProd: Product = {
      id: 'preview',
      company_id: '',
      category_id: '',
      name,
      sku: '',
      barcode: '',
      unit: saleMode === 'KG' ? 'Kg' : 'Pièce',
      selling_price: numPrice,
      purchase_price: 0,
      min_stock_alert: 0,
      is_active: true,
      is_perishable: saleMode === 'KG',
      carton_price: typeof cartonPrice === 'number' ? cartonPrice : null,
      carton_weight_kg: typeof cartonWeightKg === 'number' ? cartonWeightKg : null,
      price_tiers: normalizePriceTiers(priceTiers),
    };

    // Pick 3-4 representative test quantities
    const testQuantities = new Set<number>();
    priceTiers.forEach((t) => {
      const q = Number(t.quantity);
      if (q > 0) {
        testQuantities.add(q);
        testQuantities.add(Math.round((q + 1) * 10) / 10);
        testQuantities.add(Math.round(q * 2 * 10) / 10);
      }
    });

    const sorted = Array.from(testQuantities)
      .filter((q) => q > 0)
      .sort((a, b) => a - b)
      .slice(0, 4);

    return sorted.map((qty) => {
      const res = calculateTieredPrice(dummyProd, qty);
      const normalTotal = Math.round(qty * numPrice);
      return {
        qty,
        total: res.totalPrice,
        normalTotal,
        savings: res.savings,
        explanation: res.explanation,
      };
    });
  }, [normalPrice, priceTiers, cartonPrice, cartonWeightKg, saleMode, name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Veuillez saisir le nom du produit.');
      return;
    }
    if (normalPrice === '' || Number(normalPrice) <= 0) {
      alert('Veuillez définir un prix de vente valide.');
      return;
    }
    if (isCartonPriceInvalid) {
      alert(`Erreur : Le prix du carton (${cartonPrice} FCFA) ne peut pas être inférieur au prix d'un seul kilo/pièce (${normalPrice} FCFA).`);
      return;
    }

    const cat = state.categories.find((c) => c.id === categoryId);
    const unit = saleMode === 'KG' ? 'Kg' : 'Pièce';
    const numPrice = typeof normalPrice === 'number' ? normalPrice : 0;
    const numCartonWeight = typeof cartonWeightKg === 'number' && cartonWeightKg > 0 ? cartonWeightKg : null;
    const numCartonStock = typeof cartonStock === 'number' ? cartonStock : (numCartonWeight ? Math.floor(calculatedTotalStock / numCartonWeight) : null);

    // Build finalized stock_by_store mapping
    const finalStockByStore: Record<string, number> = {};
    state.stores.forEach((s) => {
      const val = storeStocks[s.id];
      finalStockByStore[s.id] = typeof val === 'number' ? val : 0;
    });

    const randSku = initialProduct?.sku || `ART-${Math.floor(1000 + Math.random() * 9000)}`;
    const randBarcode = initialProduct?.barcode || `${Date.now()}`.slice(-12);

    const productToSave: Product = {
      id: initialProduct?.id || crypto.randomUUID(),
      company_id: initialProduct?.company_id || state.company.id,
      category_id: categoryId || state.categories[0]?.id || 'cat-1',
      category_name: cat?.name || 'Général',
      name: name.trim(),
      sku: randSku,
      barcode: randBarcode,
      description: initialProduct?.description || '',
      unit: unit,
      is_weight_based: saleMode === 'KG',
      is_perishable: saleMode === 'KG',
      purchase_price: typeof purchasePrice === 'number' ? purchasePrice : (initialProduct?.purchase_price || 0),
      selling_price: numPrice,
      promo_price: null,
      min_stock_alert: 0,
      is_active: true,
      carton_price: cartonPrice !== '' ? Number(cartonPrice) : null,
      carton_weight_kg: numCartonWeight,
      carton_stock: numCartonStock,
      price_tiers: normalizePriceTiers(priceTiers),
      stock_by_store: finalStockByStore,
      total_stock: calculatedTotalStock,
    };

    onSave(productToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {initialProduct ? 'Modifier le Produit' : 'Créer un Nouveau Produit'}
              </h2>
              <p className="text-xs text-slate-400">
                Définissez les tarifs, stocks multi-boutiques et réductions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Nom du Produit */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Désignation / Nom du Produit *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Riz Parfumé Jasmin, Viande de Bœuf, Huile Dinor..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Collection / Catégorie & Mode de Vente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Collection / Catégorie</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Mode de Vente</label>
              <select
                value={saleMode}
                onChange={(e) => setSaleMode(e.target.value as 'KG' | 'PIECE')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="KG">⚖️ Au Poids (Kg / Grammes avec décimales)</option>
                <option value="PIECE">📦 À la Pièce / Article unitaire</option>
              </select>
            </div>
          </div>

          {/* Tarification & Achat Carton / Sac / Détail */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900">
                <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-xs">
                  {saleMode === 'KG' ? '📦 Tarifs Achat Carton / Sac & Vente au Kilo' : '📦 Tarifs Achat & Vente Unitaire'}
                </span>
              </div>
              {saleMode === 'KG' && typeof cartonPrice === 'number' && typeof cartonPurchasePrice === 'number' && cartonPrice > 0 && (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[11px]">
                  Bénéfice Sac/Carton : +{(cartonPrice - cartonPurchasePrice).toLocaleString()} FCFA
                </span>
              )}
            </div>

            {saleMode === 'KG' ? (
              <div className="space-y-3">
                {/* Ligne 1 : Poids du Carton/Sac et Prix d'Achat du Carton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Poids d'un Carton / Sac (Kg) *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder="Ex: 20 (pour sac de 20 Kg)"
                      value={cartonWeightKg}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setCartonWeightKg(val);
                        if (typeof val === 'number' && val > 0 && typeof cartonPurchasePrice === 'number' && cartonPurchasePrice > 0) {
                          setPurchasePrice(Math.round((cartonPurchasePrice / val) * 100) / 100);
                        }
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 20 Kg, 25 Kg, 50 Kg</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Prix d'Achat du Carton / Sac (FCFA) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Ex: 19000 (pour sac de 20 Kg)"
                      value={cartonPurchasePrice}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setCartonPurchasePrice(val);
                        if (typeof val === 'number' && typeof cartonWeightKg === 'number' && cartonWeightKg > 0) {
                          setPurchasePrice(Math.round((val / cartonWeightKg) * 100) / 100);
                        } else if (typeof val === 'number') {
                          setPurchasePrice(val);
                        }
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                      {typeof purchasePrice === 'number' && purchasePrice > 0
                        ? `➔ Soit ${purchasePrice.toLocaleString()} FCFA / Kg à l'achat`
                        : "Coût d'achat fournisseur"}
                    </span>
                  </div>
                </div>

                {/* Ligne 2 : Prix de Vente Carton et Prix de Vente au Kg (Détail) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Prix de Vente Carton / Sac Entier (FCFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Ex: 20000"
                      value={cartonPrice}
                      onChange={(e) => setCartonPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Vente directe du sac complet à la caisse
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Prix de Vente au Kg (au Détail) (FCFA) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="Ex: 1000 (pour 1 Kg)"
                      value={normalPrice}
                      onChange={(e) => setNormalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Tarif au kilo vendu au détail
                    </span>
                  </div>
                </div>

                {/* Résumé des bénéfices calculés */}
                <div className="p-3 bg-white border border-emerald-200/80 rounded-xl space-y-1.5 text-[11px]">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aperçu des Bénéfices & Rentabilité :</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div>
                      <span>Sur 1 Sac entier (20 Kg) : </span>
                      <strong className="text-emerald-700 font-black">
                        {typeof cartonPrice === 'number' && typeof cartonPurchasePrice === 'number'
                          ? `+${(cartonPrice - cartonPurchasePrice).toLocaleString()} FCFA de bénéfice`
                          : '—'}
                      </strong>
                    </div>
                    <div>
                      <span>Sur 1 Kg au détail : </span>
                      <strong className="text-emerald-700 font-black">
                        {typeof normalPrice === 'number' && typeof purchasePrice === 'number'
                          ? `+${(normalPrice - purchasePrice).toLocaleString()} FCFA / Kg`
                          : '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Mode Pièce unitaire */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Prix d'Achat par Pièce (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Ex: 500"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Coût d'achat unitaire fournisseur</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Prix de Vente par Pièce (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="Ex: 750"
                    value={normalPrice}
                    onChange={(e) => setNormalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tarif facturé au client</span>
                </div>
              </div>
            )}
          </div>

          {/* Répartition du Stock Initial par Boutique */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <StoreIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-xs">Stock Initial par Boutique</span>
              </div>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-black text-[11px]">
                Total : {calculatedTotalStock} {saleMode === 'KG' ? 'Kg' : 'Pièces'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Définissez la quantité disponible dans chaque boutique physique (ex: 20 {saleMode === 'KG' ? 'Kg' : 'pièces'} en Boutique 1 et 15 en Boutique 2) :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {state.stores.map((store) => (
                <div key={store.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">
                      🏪 {store.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {store.code}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={saleMode === 'KG' ? '0.01' : '1'}
                      placeholder="0"
                      value={storeStocks[store.id] ?? ''}
                      onChange={(e) => handleStoreStockChange(store.id, e.target.value)}
                      className="w-full pr-12 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-slate-400">
                      {saleMode === 'KG' ? 'Kg' : 'Pcs'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vente au Carton (Facultatif) */}
          <div className="p-4 bg-purple-50/40 border border-purple-200/70 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700">
                <Box className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-bold text-xs text-purple-900">Vente au Carton Complet (Facultatif)</span>
              </div>
              {cartonTotalKg > 0 && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-bold text-[10px]">
                  Total cartons : {cartonTotalKg} Kg
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Permet la vente rapide au carton entier à la caisse.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 block">Prix Vente Carton (FCFA)</label>
                {suggestedCartonPrice && (
                  <button
                    type="button"
                    onClick={() => setCartonPrice(suggestedCartonPrice)}
                    className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-md transition-colors"
                  >
                    ⚡ Suggérer : {suggestedCartonPrice.toLocaleString()} F
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0"
                placeholder="Ex: 28000"
                value={cartonPrice}
                onChange={(e) => setCartonPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 ${
                  isCartonPriceInvalid ? 'border-red-500 focus:ring-red-500 bg-red-50/50' : 'border-purple-200 focus:ring-purple-500'
                }`}
              />
              {isCartonPriceInvalid && (
                <div className="flex items-center gap-1.5 mt-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Le prix d'un carton ({cartonPrice} FCFA) ne peut pas être inférieur au prix d'une seule unité ({normalPrice} FCFA).
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Poids par Carton (Kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ex: 10"
                  value={cartonWeightKg}
                  onChange={(e) => setCartonWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Stock en Cartons (Nb)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 2"
                  value={cartonStock}
                  onChange={(e) => setCartonStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Tarifs Réduits & Paliers Spéciaux ("Pario" / Remises par Quantité) */}
          <div className="p-4 bg-blue-50/40 border border-blue-200/70 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Tag className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-xs text-blue-950">
                Tarifs Réduits & Paliers de Quantité (Pario)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Définissez les réductions automatiques appliquées à la caisse (ex: pour 2.5 Kg ➔ 8 500 F, pour 3.5 Kg ➔ 11 000 F, pour 5 Kg ➔ 15 000 F). Le système appliquera automatiquement le tarif réduit dès que la quantité est atteinte.
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {saleMode === 'KG' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddTier(2.5)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs"
                  >
                    + Palier 2.5 Kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTier(3.5)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs"
                  >
                    + Palier 3.5 Kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTier(5)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs"
                  >
                    + Palier 5 Kg
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddTier(2)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs"
                  >
                    + Palier 2 Pièces
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTier(5)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs"
                  >
                    + Palier 5 Pièces
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => handleAddTier(1)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] transition-all active:scale-95 shadow-2xs"
              >
                + Autre Palier Libre
              </button>
            </div>

            {/* Price Tiers List */}
            {priceTiers.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-blue-100">
                {priceTiers.map((tier, idx) => (
                  <div
                    key={tier.id || idx}
                    className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-150 shadow-2xs"
                  >
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        Quantité ({saleMode === 'KG' ? 'Kg' : 'Pièces'})
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={saleMode === 'KG' ? 'Ex: 2.5' : 'Ex: 5'}
                        value={tier.quantity !== undefined && tier.quantity !== null ? String(tier.quantity) : ''}
                        onChange={(e) => handleUpdateTier(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        Prix Total pour ce Palier (FCFA)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 2000"
                        value={tier.price !== undefined && tier.price !== null ? String(tier.price) : ''}
                        onChange={(e) => handleUpdateTier(idx, 'price', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-emerald-600 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Calculation Preview for Admin */}
            {tierSimulations.length > 0 && (
              <div className="p-3 bg-white/90 border border-blue-200 rounded-xl space-y-2 mt-2">
                <div className="flex items-center justify-between text-blue-900 font-bold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Aperçu intelligent du calcul à la caisse :</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Formule automatique</span>
                </div>
                <div className="space-y-1.5">
                  {tierSimulations.map((sim, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-[11px] border border-slate-100"
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          Achat {sim.qty} {saleMode === 'KG' ? 'Kg' : 'pcs'} :
                        </span>{' '}
                        <span className="text-slate-500 text-[10px]">{sim.explanation}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-black text-slate-900">{formatCurrency(sim.total)}</span>
                        {sim.savings > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold text-[10px]">
                            -{formatCurrency(sim.savings)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le Produit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
