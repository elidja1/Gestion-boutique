'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Sale } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ReceiptModal } from './ReceiptModal';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  Store as StoreIcon,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  X,
  SlidersHorizontal,
} from 'lucide-react';

type DatePresetType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';

export const SalesHistoryView: React.FC = () => {
  const { state } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<DatePresetType>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Filter sales based on Store, Date and Query
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Start of this week (Monday)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return state.sales.filter((sale) => {
      // 1. Boutique filter
      if (selectedStoreId !== 'ALL' && sale.store_id !== selectedStoreId) {
        return false;
      }

      // 2. Date filter
      const saleDate = new Date(sale.created_at);
      const saleDateStr = sale.created_at.split('T')[0];

      if (datePreset === 'TODAY' && saleDateStr !== todayStr) return false;
      if (datePreset === 'YESTERDAY' && saleDateStr !== yesterdayStr) return false;
      if (datePreset === 'THIS_WEEK' && saleDate < startOfWeek) return false;
      if (datePreset === 'THIS_MONTH' && (saleDate.getFullYear() !== currentYear || saleDate.getMonth() !== currentMonth)) return false;
      if (datePreset === 'LAST_MONTH') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (saleDate.getFullYear() !== lastMonthYear || saleDate.getMonth() !== lastMonth) return false;
      }
      if (datePreset === 'THIS_YEAR' && saleDate.getFullYear() !== currentYear) return false;
      if (datePreset === 'CUSTOM') {
        if (customStartDate && saleDateStr < customStartDate) return false;
        if (customEndDate && saleDateStr > customEndDate) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInvoice = sale.invoice_number.toLowerCase().includes(q);
        const matchCustomer = (sale.customer_name || '').toLowerCase().includes(q);
        const matchPhone = (sale.customer_phone || '').includes(q);
        const matchSeller = (sale.seller_name || '').toLowerCase().includes(q);
        const matchStore = (sale.store_name || '').toLowerCase().includes(q);
        const matchProduct = sale.items.some((i) => i.product.name.toLowerCase().includes(q) || i.product.sku.toLowerCase().includes(q));

        if (!matchInvoice && !matchCustomer && !matchPhone && !matchSeller && !matchStore && !matchProduct) {
          return false;
        }
      }

      return true;
    });
  }, [state.sales, selectedStoreId, datePreset, customStartDate, customEndDate, searchQuery]);

  // Aggregate metrics
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  }, [filteredSales]);

  const totalItemsCount = useMemo(() => {
    return Math.round(filteredSales.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + (i.quantity || 0), 0), 0) * 100) / 100;
  }, [filteredSales]);

  const averageBasket = useMemo(() => {
    return filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;
  }, [filteredSales, totalRevenue]);

  const handleOpenReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            🧾 Historique des Ventes & Factures
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Consultez les transactions, réimprimez les tickets et filtrez par boutique et dates
          </p>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Factures Émises</span>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {filteredSales.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Chiffre d'Affaires</span>
          <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Panier Moyen</span>
          <p className="text-lg sm:text-xl font-black text-blue-700 mt-1">
            {formatCurrency(averageBasket)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Articles / Kg Vendus</span>
          <p className="text-lg sm:text-xl font-black text-purple-700 mt-1">
            {totalItemsCount}
          </p>
        </div>
      </div>

      {/* Main Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par N° facture, client, vendeur, article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Boutique Selector */}
          <div className="md:col-span-6">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-bold text-blue-950 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">🏪 Toutes les Boutiques</option>
              {state.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  🏪 {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date :</span>
          </span>

          <button
            type="button"
            onClick={() => setDatePreset('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePreset === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tout
          </button>

          <button
            type="button"
            onClick={() => setDatePreset('TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePreset === 'TODAY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Aujourd'hui
          </button>

          <button
            type="button"
            onClick={() => setDatePreset('YESTERDAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePreset === 'YESTERDAY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Hier
          </button>

          <button
            type="button"
            onClick={() => setDatePreset('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePreset === 'THIS_WEEK'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cette semaine
          </button>

          <button
            type="button"
            onClick={() => setDatePreset('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePreset === 'THIS_MONTH'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Ce mois
          </button>

          <button
            type="button"
            onClick={() => setDatePreset('LAST_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePreset === 'LAST_MONTH'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Mois dernier
          </button>

          <button
            type="button"
            onClick={() => setDatePreset('THIS_YEAR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePreset === 'THIS_YEAR'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cette année
          </button>

          <button
            type="button"
            onClick={() => setDatePreset('CUSTOM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePreset === 'CUSTOM'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Période personnalisée
          </button>
        </div>

        {/* Custom date range inputs */}
        {datePreset === 'CUSTOM' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Du :</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">Au :</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">N° Facture / Date</th>
                <th className="px-4 py-3.5">Boutique</th>
                <th className="px-4 py-3.5">Vendeur</th>
                <th className="px-4 py-3.5">Client</th>
                <th className="px-4 py-3.5 text-center">Articles</th>
                <th className="px-4 py-3.5 text-right">Montant Total</th>
                <th className="px-4 py-3.5 text-center">Mode Paiement</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucune vente ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-950 font-mono">{sale.invoice_number}</p>
                      <span className="text-[10px] text-slate-400">{formatDate(sale.created_at)}</span>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-800">{sale.store_name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{sale.seller_name}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">{sale.customer_name || 'Comptoir'}</span>
                      {sale.customer_phone && (
                        <span className="text-[10px] text-slate-400 block">{sale.customer_phone}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {Math.round(sale.items.reduce((acc, i) => acc + (i.quantity || 0), 0) * 100) / 100}
                    </td>

                    <td className="px-4 py-3.5 text-right font-black text-slate-950 text-xs">
                      {formatCurrency(sale.total_amount)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-full text-[10px]">
                        {sale.payment_method}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenReceipt(sale)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all text-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ticket</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={selectedSale}
        company={state.company}
      />
    </div>
  );
};
