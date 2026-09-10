'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Product, CartItem, Sale, PaymentMethod, SalePayment } from '@/lib/types';
import { formatCurrency, playBeepSound, generateCode } from '@/lib/utils';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  User,
  Tag,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PosScreen: React.FC = () => {
  const { state, currentUser, activeStore, addSale } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Barcode input state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);

  // Mobile cart drawer toggle
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Active Store validation
  const effectiveStoreId = activeStore?.id || state.stores[0].id;
  const effectiveStoreName = activeStore?.name || state.stores[0].name;

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

  // Handle Add to Cart
  const handleAddToCart = (product: Product, defaultQty: number = 1) => {
    const storeStock = product.stock_by_store?.[effectiveStoreId] || 0;
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const step = product.unit === 'Kg' || product.is_weight_based ? 0.5 : 1;
    const qtyToAdd = defaultQty;

    if (existingIndex > -1) {
      const currentCartQty = cart[existingIndex].quantity;
      const newQty = Math.round((currentCartQty + (product.unit === 'Kg' ? 0.5 : 1)) * 100) / 100;
      if (newQty > storeStock) {
        playBeepSound('error');
        setBarcodeFeedback(`⚠️ Stock insuffisant en boutique pour ${product.name} (Dispo: ${storeStock} ${product.unit || ''})`);
        setTimeout(() => setBarcodeFeedback(null), 3000);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total_price =
        Math.round((newQty * updated[existingIndex].unit_price - updated[existingIndex].discount_amount) * 100) / 100;
      setCart(updated);
    } else {
      if (storeStock <= 0) {
        playBeepSound('error');
        setBarcodeFeedback(`❌ ${product.name} est en rupture de stock dans cette boutique`);
        setTimeout(() => setBarcodeFeedback(null), 3000);
        return;
      }
      const price = product.promo_price || product.selling_price;
      const initialQty = product.unit === 'Kg' ? 1 : 1;
      setCart([
        ...cart,
        {
          product,
          quantity: initialQty,
          unit_price: price,
          discount_amount: 0,
          total_price: Math.round(initialQty * price * 100) / 100,
        },
      ]);
    }
    playBeepSound('success');
  };

  // Direct quantity input change
  const setDirectQuantity = (index: number, val: number) => {
    const item = cart[index];
    const storeStock = item.product.stock_by_store?.[effectiveStoreId] || 0;
    if (val <= 0) {
      removeItem(index);
      return;
    }
    if (val > storeStock) {
      playBeepSound('error');
      setBarcodeFeedback(`⚠️ Stock maximum disponible : ${storeStock} ${item.product.unit || ''}`);
      setTimeout(() => setBarcodeFeedback(null), 2500);
      val = storeStock;
    }
    const updated = [...cart];
    updated[index].quantity = val;
    updated[index].total_price = Math.round((val * item.unit_price - item.discount_amount) * 100) / 100;
    setCart(updated);
  };

  // Barcode scan handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = state.products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );
    if (found) {
      handleAddToCart(found);
      setBarcodeFeedback(`✅ ${found.name} scanné et ajouté !`);
      setBarcodeInput('');
    } else {
      playBeepSound('error');
      setBarcodeFeedback(`❌ Aucun produit trouvé pour le code « ${barcodeInput} »`);
    }
    setTimeout(() => setBarcodeFeedback(null), 3000);
  };

  const updateQuantity = (index: number, delta: number) => {
    const item = cart[index];
    const storeStock = item.product.stock_by_store?.[effectiveStoreId] || 0;
    const step = item.product.unit === 'Kg' || item.product.is_weight_based ? 0.5 : 1;
    const newQty = Math.round((item.quantity + delta * (item.product.unit === 'Kg' ? 0.5 : 1)) * 100) / 100;

    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
      return;
    }

    if (newQty > storeStock) {
      playBeepSound('error');
      setBarcodeFeedback(`⚠️ Stock max atteint (${storeStock} ${item.product.unit || ''}) pour ${item.product.name}`);
      setTimeout(() => setBarcodeFeedback(null), 2500);
      return;
    }

    const updated = [...cart];
    updated[index].quantity = newQty;
    updated[index].total_price = Math.round((newQty * item.unit_price - item.discount_amount) * 100) / 100;
    setCart(updated);
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Cart calculations
  const subtotal = Math.round(cart.reduce((acc, item) => acc + item.total_price, 0));
  const totalAmount = Math.max(0, subtotal - orderDiscount);
  const totalItemsCount = Math.round(cart.reduce((acc, item) => acc + item.quantity, 0) * 100) / 100;

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
      id: `sale-${Date.now()}`,
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
      payment_status: paymentMethod === 'CREDIT' ? 'CREDIT' : 'PAID',
      payment_method: paymentMethod,
      payments,
      status: 'COMPLETED',
      items: cart,
      created_at: new Date().toISOString(),
    };

    addSale(newSale);
    setCompletedSale(newSale);
    setIsPaymentModalOpen(false);
    setCart([]);
    setOrderDiscount(0);
    setSelectedCustomerId('');

    // Confetti celebration
    playBeepSound('cash');
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });

    setIsReceiptModalOpen(true);
  };

  return (
    <div className="relative h-[calc(100vh-4.5rem)] flex flex-col lg:flex-row gap-4 p-2 sm:p-4 overflow-hidden">
      {/* LEFT COLUMN: Product Catalog & Scanner */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        {/* Top Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher produit (Nom, SKU, Code-barres)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            {/* Quick Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Barcode className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Scanner code..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-indigo-200 rounded-2xl text-xs font-mono text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Barcode scanner notification feedback */}
          {barcodeFeedback && (
            <div className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
              <span>{barcodeFeedback}</span>
              <button onClick={() => setBarcodeFeedback(null)} className="text-slate-400 text-xs">✕</button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tous ({state.products.length})
            </button>
            {state.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20 lg:pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredProducts.map((product) => {
              const localStock = product.stock_by_store?.[effectiveStoreId] || 0;
              const isRupture = localStock <= 0;
              const isLow = localStock <= product.min_stock_alert && !isRupture;

              return (
                <div
                  key={product.id}
                  onClick={() => !isRupture && handleAddToCart(product)}
                  className={`group relative p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    isRupture
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div>
                    {/* Top badging */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[70px]">
                          {product.sku}
                        </span>
                        {product.unit && product.unit !== 'Pièce' && (
                          <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 font-bold rounded text-[9px]">
                            {product.unit}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isRupture
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isRupture ? 'Rupture' : `${localStock} ${product.unit || 'u'}`}
                      </span>
                    </div>

                    {/* Product Name & Details */}
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{product.category_name}</p>

                    {/* Perishable info */}
                    {product.is_perishable && product.expiry_date && (
                      <span className="inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                        DLUO: {product.expiry_date}
                      </span>
                    )}
                  </div>

                  {/* Price & Add button */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrency(product.promo_price || product.selling_price)}
                      </span>
                      {product.unit && product.unit !== 'Pièce' && (
                        <span className="text-[10px] text-slate-500 font-normal">/{product.unit}</span>
                      )}
                      {product.promo_price && (
                        <span className="text-[10px] text-slate-400 line-through ml-1 block">
                          {formatCurrency(product.selling_price)}
                        </span>
                      )}
                    </div>
                    {!isRupture && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Mobile Cart Trigger Bar (visible on mobile only) */}
      <div className="lg:hidden fixed bottom-14 left-3 right-3 z-30">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full py-3 px-4 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between border border-slate-800 active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-black">Voir le Panier ({totalItemsCount})</p>
              <p className="text-[10px] text-slate-400">{cart.length} référence(s)</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-xl">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </button>
      </div>

      {/* RIGHT COLUMN: POS Cart & Checkout Drawer (Desktop fixed or Mobile Drawer) */}
      <div
        className={`fixed inset-0 z-50 lg:static lg:z-auto bg-slate-900/60 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none transition-all ${
          isMobileCartOpen ? 'flex items-end sm:items-center justify-center' : 'hidden lg:flex'
        }`}
      >
        <div className="w-full sm:max-w-md lg:w-96 max-h-[90vh] lg:max-h-none h-full flex flex-col bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-xl lg:shadow-sm overflow-hidden shrink-0">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-black">Panier de Vente</h3>
                <p className="text-[10px] text-slate-400">
                  {totalItemsCount} article(s) • {effectiveStoreName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Vider
                </button>
              )}
              {/* Mobile Close Button */}
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="lg:hidden text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
              >
                Fermer ✕
              </button>
            </div>
          </div>

          {/* Customer Assignment */}
          <div className="p-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="">Client Comptoir (Anonyme)</option>
                {state.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} ({c.phone}) • {c.loyalty_points} pts
                  </option>
                ))}
              </select>
            </div>
            {selectedCustomerId && (
              <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg flex justify-between">
                <span>Points disponibles : <strong>{state.customers.find(c => c.id === selectedCustomerId)?.loyalty_points} pts</strong></span>
                <span>Dette : {formatCurrency(state.customers.find(c => c.id === selectedCustomerId)?.credit_balance)}</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300" />
                <p className="text-xs font-medium">Le panier est vide</p>
                <p className="text-[10px] text-slate-400 max-w-[200px]">
                  Scannez un code-barres ou sélectionnez des articles dans la liste
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatCurrency(item.unit_price)}/{item.product.unit || 'u'}
                    </p>
                  </div>

                  {/* Quantity adjustments with decimal / Kg support */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(idx, -1)}
                      className="w-5 h-5 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <input
                      type="number"
                      step={item.product.unit === 'Kg' || item.product.is_weight_based ? '0.1' : '1'}
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => setDirectQuantity(idx, parseFloat(e.target.value) || 0)}
                      className="w-10 text-xs font-bold text-center bg-transparent outline-none border-0 p-0 text-slate-900"
                    />

                    <button
                      onClick={() => updateQuantity(idx, 1)}
                      className="w-5 h-5 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Total Item Price */}
                  <div className="text-right shrink-0 min-w-[70px]">
                    <p className="text-xs font-black text-slate-900">
                      {formatCurrency(item.total_price)}
                    </p>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-medium"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Totals & Checkout Button */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
            {/* Discount input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-rose-500" />
                Remise globale (FCFA):
              </span>
              <input
                type="number"
                value={orderDiscount || ''}
                placeholder="0"
                onChange={(e) => setOrderDiscount(Number(e.target.value))}
                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right outline-none"
              />
            </div>

            {/* Subtotal & Net */}
            <div className="space-y-1 pt-1 border-t border-slate-200/80">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Sous-total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {orderDiscount > 0 && (
                <div className="flex justify-between text-xs text-rose-600 font-semibold">
                  <span>Remise déduite</span>
                  <span>-{formatCurrency(orderDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Total Net
                </span>
                <span className="text-xl font-black text-blue-700">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Big Checkout Button */}
            <button
              disabled={cart.length === 0}
              onClick={() => {
                setIsMobileCartOpen(false);
                setIsPaymentModalOpen(true);
              }}
              className={`w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg ${
                cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/30 active:scale-[0.99]'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>ENCAISSER ({formatCurrency(totalAmount)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={totalAmount}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={completedSale}
        company={state.company}
      />
    </div>
  );
};
