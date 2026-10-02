'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Product, CartItem, Sale, PaymentMethod, SalePayment, Store } from '@/lib/types';
import { formatCurrency, playBeepSound, calculateTieredPrice, normalizePriceTiers } from '@/lib/utils';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { WeightPieceModal } from './WeightPieceModal';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  User,
  ShoppingBag,
  Scale,
  Package,
  Layers,
  Check,
  AlertCircle,
  Store as StoreIcon,
  MapPin,
  Phone,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Box,
} from 'lucide-react';

export const PosScreen: React.FC = () => {
  const { state, currentUser, activeStore, addSale, setActiveStoreId } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Weight/Piece Modal state
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Barcode input state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);

  const isSeller = currentUser.role_code === 'SELLER';

  // For sellers, store is locked to their administrator-assigned store
  const sellerAssignedStore = isSeller
    ? (state.stores.find((s) => s.id === currentUser.store_id) || state.stores[0])
    : null;

  // ----------------------------------------------------
  // STORE SELECTION GATE: Must pick a store before selling (Managers / Owners only)
  // ----------------------------------------------------
  const hasSelectedStore = isSeller ? true : (activeStore && state.activeStoreId !== 'ALL');

  if (!hasSelectedStore) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50 space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-bold">
            <StoreIcon className="w-3.5 h-3.5" />
            <span>Sélection obligatoire de la boutique</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Dans quelle boutique êtes-vous aujourd'hui ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Pour garantir l'exactitude des stocks, des prix et des recettes de caisse, veuillez sélectionner la boutique physique avant de commencer les ventes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.stores.map((store: Store) => (
            <div
              key={store.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-lg hover:border-blue-500 transition-all space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <StoreIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                    🟢 Ouverte
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {store.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{store.address || store.city}</span>
                  </p>
                  {store.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{store.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveStoreId(store.id);
                  playBeepSound('success');
                }}
                className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Sélectionner cette Boutique & Ouvrir la Caisse</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active Store validation with resilient fallback
  const fallbackStore: Store = state.stores[0] || {
    id: 'b0000000-0000-4000-8000-000000000001',
    company_id: state.company.id || 'a0000000-0000-4000-8000-000000000001',
    code: 'BOU-01',
    name: 'Boutique Principale',
    address: 'Cotonou',
    city: 'Cotonou',
    phone: '',
    is_active: true,
  };

  const effectiveStore = isSeller
    ? (state.stores.find((s) => s.id === currentUser.store_id) || state.stores.find((s) => s.id === state.activeStoreId) || fallbackStore)
    : (activeStore || fallbackStore);
  const effectiveStoreId = effectiveStore.id;
  const effectiveStoreName = effectiveStore.name;

  // Filter products
  const filteredProducts = state.products.filter((p) => {
    if (!p.is_active) return false;
    const matchCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchCat && matchQuery;
  });

  // Open Weight / Piece modal on product click
  const handleProductClick = (product: Product) => {
    const storeStock = product.stock_by_store?.[effectiveStoreId] ?? product.total_stock ?? 100;
    if (storeStock <= 0) {
      playBeepSound('error');
      setBarcodeFeedback(`Rupture de stock pour ${product.name}`);
      setTimeout(() => setBarcodeFeedback(null), 2500);
      return;
    }
    setSelectedProductForModal(product);
    setIsWeightModalOpen(true);
  };

  // Handle Add to Cart from modal or direct with intelligent tier engine
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const storeStock = product.stock_by_store?.[effectiveStoreId] ?? product.total_stock ?? 100;
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const currentCartQty = cart[existingIndex].quantity;
      const newQty = Math.round((currentCartQty + quantity) * 1000) / 1000;
      if (!isSeller && newQty > storeStock) {
        playBeepSound('error');
        setBarcodeFeedback(`Stock insuffisant pour ${product.name} (Dispo: ${storeStock} ${product.unit})`);
        setTimeout(() => setBarcodeFeedback(null), 3000);
        return;
      }
      // Re-evaluate intelligent tiered price for combined quantity
      const tiered = calculateTieredPrice(product, newQty);
      const updated = [...cart];
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].unit_price = tiered.effectiveUnitPrice;
      updated[existingIndex].total_price = tiered.totalPrice;
      updated[existingIndex].discount_amount = tiered.savings;
      updated[existingIndex].explanation = tiered.explanation;
      setCart(updated);
    } else {
      if (!isSeller && quantity > storeStock) {
        playBeepSound('error');
        setBarcodeFeedback(`Stock insuffisant pour ${product.name} (Dispo: ${storeStock} ${product.unit})`);
        setTimeout(() => setBarcodeFeedback(null), 3000);
        return;
      }
      const tiered = calculateTieredPrice(product, quantity);

      setCart([
        ...cart,
        {
          product,
          quantity,
          unit_price: tiered.effectiveUnitPrice,
          discount_amount: tiered.savings,
          total_price: tiered.totalPrice,
          explanation: tiered.explanation,
        },
      ]);
    }
    playBeepSound('success');
  };

  // Barcode scan handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = state.products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );
    if (found) {
      handleProductClick(found);
      setBarcodeInput('');
    } else {
      playBeepSound('error');
      setBarcodeFeedback(`Aucun produit trouvé pour le code « ${barcodeInput} »`);
      setTimeout(() => setBarcodeFeedback(null), 3000);
    }
  };

  // Update cart item quantity with intelligent tier re-calculation
  const updateQuantity = (index: number, delta: number) => {
    const item = cart[index];
    const storeStock = item.product.stock_by_store?.[effectiveStoreId] ?? item.product.total_stock ?? 100;
    const step = item.product.unit === 'Kg' ? 0.5 : (item.quantity < 1 ? 0.25 : 1);
    const newQty = Math.round((item.quantity + delta * step) * 1000) / 1000;

    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
      return;
    }

    if (!isSeller && newQty > storeStock) {
      playBeepSound('error');
      setBarcodeFeedback(`Stock max atteint (${storeStock} ${item.product.unit}) pour ${item.product.name}`);
      setTimeout(() => setBarcodeFeedback(null), 2500);
      return;
    }

    const tiered = calculateTieredPrice(item.product, newQty);
    const updated = [...cart];
    updated[index].quantity = newQty;
    updated[index].unit_price = tiered.effectiveUnitPrice;
    updated[index].total_price = tiered.totalPrice;
    updated[index].discount_amount = tiered.savings;
    updated[index].explanation = tiered.explanation;
    setCart(updated);
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setOrderDiscount(0);
  };

  // Cart calculations
  const subtotal = Math.round(cart.reduce((acc, item) => acc + item.total_price, 0));
  const totalAmount = Math.max(0, subtotal - orderDiscount);
  const totalItemsCount = Math.round(cart.reduce((acc, item) => acc + item.quantity, 0) * 1000) / 1000;

  // Confirm and record sale
  const handleConfirmPayment = (
    payments: SalePayment[],
    paymentMethod: PaymentMethod,
    paidAmount: number,
    change: number
  ) => {
    const customer = state.customers.find((c) => c.id === selectedCustomerId);
    const invoiceNumber = `FAC-${effectiveStoreName.split(' ')[0]}-${Date.now().toString().slice(-6)}`;

    const newSale: Sale = {
      id: crypto.randomUUID(),
      company_id: state.company.id,
      store_id: effectiveStoreId,
      store_name: effectiveStoreName,
      seller_id: currentUser.id,
      seller_name: currentUser.full_name,
      customer_id: customer ? customer.id : null,
      customer_name: customer ? `${customer.first_name} ${customer.last_name}` : undefined,
      customer_phone: customer ? customer.phone : undefined,
      invoice_number: invoiceNumber,
      subtotal_amount: subtotal,
      discount_amount: orderDiscount,
      tax_amount: 0,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      change_returned: change,
      payment_status: 'PAID',
      payment_method: paymentMethod,
      payments,
      status: 'COMPLETED',
      items: cart,
      created_at: new Date().toISOString(),
    };

    addSale(newSale);
    setCompletedSale(newSale);
    setCart([]);
    setSelectedCustomerId('');
    setOrderDiscount(0);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Top Boutique Info Bar */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Point de Vente Actif :</span>
              <span className="text-sm font-black text-slate-900">{effectiveStoreName}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Caissier / Vendeur : <strong className="text-slate-700">{currentUser.full_name}</strong>
            </p>
          </div>
        </div>

        {(currentUser.role_code === 'OWNER' || currentUser.role_code === 'MANAGER' || currentUser.role_code === 'SUPERADMIN') && (
          <button
            type="button"
            onClick={() => setActiveStoreId('ALL')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Changer de Boutique</span>
          </button>
        )}
      </div>

      {/* POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Products Catalog & Filter Pane (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Search & Barcode Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un article (Poisson, Viande, Huile, Riz...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium transition-all"
                />
              </div>

              {/* Barcode Quick Input */}
              <form onSubmit={handleBarcodeSubmit} className="w-full sm:w-64 flex items-center gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Code-barres / SKU"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Scanner
                </button>
              </form>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tous les articles ({state.products.filter((p) => p.is_active).length})
              </button>
              {state.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {barcodeFeedback && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{barcodeFeedback}</span>
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const storeStock = product.stock_by_store?.[effectiveStoreId] ?? product.total_stock ?? 100;
              const isOut = storeStock <= 0;
              const isWeight = product.unit === 'Kg' || product.unit === 'Gramme' || !!product.is_weight_based;
              const hasCarton = !!product.carton_price;
              const normalizedTiers = normalizePriceTiers(product.price_tiers);
              const hasTiers = normalizedTiers.length > 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOut && handleProductClick(product)}
                  className={`bg-white rounded-2xl border p-3.5 transition-all text-left flex flex-col justify-between relative group cursor-pointer ${
                    isOut
                      ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50/50'
                      : 'border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-98'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                        isWeight ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isWeight ? <Scale className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                      <span>{product.unit}</span>
                    </span>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        storeStock > 5
                          ? 'bg-emerald-50 text-emerald-700'
                          : storeStock > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {storeStock <= 0 ? 'Épuisé' : `${storeStock} ${product.unit}`}
                    </span>
                  </div>

                  {/* Product Title */}
                  <div className="space-y-1.5 mb-2.5">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{product.sku}</p>
                    
                    {/* Explicit Reduction Tiers & Carton list right on product card */}
                    <div className="space-y-1 pt-0.5">
                      {normalizedTiers.length > 0 && (
                        <div className="space-y-0.5">
                          {normalizedTiers.slice(0, 2).map((t) => (
                            <div
                              key={t.id}
                              className="text-[9px] font-bold text-amber-900 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200/80 flex items-center justify-between"
                            >
                              <span className="flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span>{t.quantity} {product.unit} :</span>
                              </span>
                              <span className="font-black text-amber-800">{formatCurrency(t.price)}</span>
                            </div>
                          ))}
                          {normalizedTiers.length > 2 && (
                            <span className="text-[9px] text-amber-600 font-semibold block">
                              +{normalizedTiers.length - 2} autre(s) palier(s)
                            </span>
                          )}
                        </div>
                      )}

                      {hasCarton && product.carton_price && (
                        <div className="text-[9px] font-bold text-purple-900 bg-purple-50/90 px-1.5 py-0.5 rounded border border-purple-200/80 flex items-center justify-between">
                          <span className="flex items-center gap-0.5">
                            <Box className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                            <span>Carton :</span>
                          </span>
                          <span className="font-black text-purple-800">{formatCurrency(product.carton_price)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Add button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        {formatCurrency(product.promo_price || product.selling_price)}
                      </span>
                      <span className="text-[9px] text-slate-400">Tarif base / {product.unit}</span>
                    </div>

                    <button
                      type="button"
                      disabled={isOut}
                      className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Checkout Pane (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 flex flex-col justify-between min-h-[580px]">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span>Panier de Vente</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {cart.length}
                  </span>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Vider</span>
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div className="pt-3">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Client (Optionnel)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                >
                  <option value="">👤 Client de passage / Comptant</option>
                  {state.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2.5 pt-4 max-h-[280px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs font-medium">Le panier est vide</p>
                    <p className="text-[10px] text-slate-400">Cliquez sur un article pour peser ou ajouter</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div
                      key={`${item.product.id}-${index}`}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h5>
                          {item.explanation ? (
                            <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                              {item.explanation}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500">
                              {formatCurrency(item.unit_price)} / {item.product.unit}
                            </p>
                          )}
                          {item.discount_amount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded mt-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Économie : -{formatCurrency(item.discount_amount)}
                            </span>
                          )}
                        </div>

                        <div className="text-right pl-2 shrink-0">
                          <span className="font-black text-sm text-slate-900 block">
                            {formatCurrency(item.total_price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                        <span className="text-[10px] font-bold text-slate-500">
                          Qté : <strong className="text-slate-800">{item.quantity} {item.product.unit}</strong>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, -1)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100 shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-slate-900 px-1 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, 1)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Summary & Action */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Sous-total ({totalItemsCount} articles)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                {orderDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Remise accordée</span>
                    <span>-{formatCurrency(orderDiscount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-900">Total net</span>
                  <span className="font-black text-slate-900 text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={cart.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Encaisser & Imprimer Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weight / Piece Modal */}
      {isWeightModalOpen && selectedProductForModal && (
        <WeightPieceModal
          isOpen={isWeightModalOpen}
          product={selectedProductForModal}
          onClose={() => setIsWeightModalOpen(false)}
          onConfirm={handleAddToCart}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
        totalAmount={totalAmount}
      />

      {/* Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          sale={completedSale}
          company={state.company}
        />
      )}
    </div>
  );
};
