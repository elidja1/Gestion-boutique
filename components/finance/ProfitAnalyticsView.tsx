'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  TrendingUp,
  DollarSign,
  Package,
  Store,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Sparkles,
  BarChart3,
  Layers,
  Receipt,
  FileSpreadsheet,
  PieChart,
  ShoppingBag,
} from 'lucide-react';

type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';

export const ProfitAnalyticsView: React.FC = () => {
  const { state } = useAppStore();

  const [dateFilter, setDateFilter] = useState<DateFilterType>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'products' | 'stores' | 'timeline' | 'sales'>('products');

  // Filter sales based on Store and Date criteria
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
      // 1. Store filter
      if (selectedStoreId !== 'ALL' && sale.store_id !== selectedStoreId) {
        return false;
      }

      // 2. Date filter
      const saleDate = new Date(sale.created_at);
      const saleDateStr = sale.created_at.split('T')[0];

      if (dateFilter === 'TODAY') {
        return saleDateStr === todayStr;
      }
      if (dateFilter === 'YESTERDAY') {
        return saleDateStr === yesterdayStr;
      }
      if (dateFilter === 'THIS_WEEK') {
        return saleDate >= startOfWeek;
      }
      if (dateFilter === 'THIS_MONTH') {
        return saleDate.getFullYear() === currentYear && saleDate.getMonth() === currentMonth;
      }
      if (dateFilter === 'LAST_MONTH') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return saleDate.getFullYear() === lastMonthYear && saleDate.getMonth() === lastMonth;
      }
      if (dateFilter === 'THIS_YEAR') {
        return saleDate.getFullYear() === currentYear;
      }
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && saleDateStr < customStartDate) return false;
        if (customEndDate && saleDateStr > customEndDate) return false;
      }

      return true;
    });
  }, [state.sales, selectedStoreId, dateFilter, customStartDate, customEndDate]);

  // Global KPIs from filtered sales
  const { totalRevenue, totalCost, totalProfit, totalItemsSold, averageMarginPct } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    let qty = 0;

    filteredSales.forEach((sale) => {
      rev += Number(sale.total_amount || 0);

      sale.items.forEach((item) => {
        qty += Number(item.quantity || 0);
        // Find product to get true purchase_price fallback
        const prod = state.products.find((p) => p.id === item.product?.id);
        const purchasePrice = item.product?.purchase_price ?? prod?.purchase_price ?? 0;
        cost += Number(item.quantity || 0) * Number(purchasePrice);
      });
    });

    const profit = Math.max(0, rev - cost);
    const marginPct = rev > 0 ? Math.round((profit / rev) * 100) : 0;

    return {
      totalRevenue: rev,
      totalCost: cost,
      totalProfit: profit,
      totalItemsSold: Math.round(qty * 100) / 100,
      averageMarginPct: marginPct,
    };
  }, [filteredSales, state.products]);

  // Product profitability breakdown
  const productProfitList = useMemo(() => {
    const map: Record<
      string,
      {
        productId: string;
        name: string;
        sku: string;
        unit: string;
        categoryId: string;
        categoryName: string;
        purchasePrice: number;
        sellingPrice: number;
        quantitySold: number;
        revenue: number;
        cost: number;
        profit: number;
        marginPct: number;
      }
    > = {};

    // Seed all products so even products with 0 sales can be inspected
    state.products.forEach((p) => {
      map[p.id] = {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit || 'Pièce',
        categoryId: p.category_id,
        categoryName: p.category_name || 'Général',
        purchasePrice: p.purchase_price || 0,
        sellingPrice: p.selling_price || 0,
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        marginPct: p.selling_price > 0 ? Math.round(((p.selling_price - (p.purchase_price || 0)) / p.selling_price) * 100) : 0,
      };
    });

    // Accumulate from sales
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prodId = item.product?.id;
        if (!prodId) return;

        if (!map[prodId]) {
          map[prodId] = {
            productId: prodId,
            name: item.product.name,
            sku: item.product.sku,
            unit: item.product.unit || 'Pièce',
            categoryId: item.product.category_id || '',
            categoryName: item.product.category_name || 'Général',
            purchasePrice: item.product.purchase_price || 0,
            sellingPrice: item.unit_price,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            marginPct: 0,
          };
        }

        const itemPurchasePrice = item.product.purchase_price || map[prodId].purchasePrice || 0;
        const itemCost = item.quantity * itemPurchasePrice;
        const itemRevenue = item.total_price;

        map[prodId].quantitySold += item.quantity;
        map[prodId].revenue += itemRevenue;
        map[prodId].cost += itemCost;
        map[prodId].profit += itemRevenue - itemCost;
      });
    });

    return Object.values(map)
      .map((item) => {
        const q = Math.round(item.quantitySold * 100) / 100;
        const profit = Math.round(item.profit);
        const marginPct = item.revenue > 0 ? Math.round((profit / item.revenue) * 100) : item.marginPct;
        return {
          ...item,
          quantitySold: q,
          profit,
          marginPct,
        };
      })
      .filter((item) => {
        const matchCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
        const matchQuery =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchQuery;
      })
      .sort((a, b) => b.profit - a.profit);
  }, [state.products, filteredSales, selectedCategory, searchQuery]);

  // Store profitability breakdown
  const storeProfitList = useMemo(() => {
    return state.stores.map((store) => {
      const storeSales = filteredSales.filter((s) => s.store_id === store.id);
      let rev = 0;
      let cost = 0;
      let qty = 0;

      storeSales.forEach((sale) => {
        rev += sale.total_amount;
        sale.items.forEach((item) => {
          qty += item.quantity;
          const prod = state.products.find((p) => p.id === item.product?.id);
          const pPrice = item.product?.purchase_price ?? prod?.purchase_price ?? 0;
          cost += item.quantity * pPrice;
        });
      });

      const profit = Math.max(0, rev - cost);
      const marginPct = rev > 0 ? Math.round((profit / rev) * 100) : 0;

      return {
        store,
        salesCount: storeSales.length,
        itemsCount: Math.round(qty * 100) / 100,
        revenue: rev,
        cost,
        profit,
        marginPct,
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [state.stores, filteredSales, state.products]);

  // Timeline breakdown (by date)
  const timelineProfitList = useMemo(() => {
    const dateMap: Record<
      string,
      {
        dateStr: string;
        salesCount: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    > = {};

    filteredSales.forEach((sale) => {
      const d = sale.created_at.split('T')[0];
      if (!dateMap[d]) {
        dateMap[d] = {
          dateStr: d,
          salesCount: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }

      dateMap[d].salesCount += 1;
      dateMap[d].revenue += sale.total_amount;

      sale.items.forEach((item) => {
        const prod = state.products.find((p) => p.id === item.product?.id);
        const pPrice = item.product?.purchase_price ?? prod?.purchase_price ?? 0;
        dateMap[d].cost += item.quantity * pPrice;
      });

      dateMap[d].profit = dateMap[d].revenue - dateMap[d].cost;
    });

    return Object.values(dateMap).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [filteredSales, state.products]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
              📊 Module Rentabilité & Marges
            </span>
            <span className="text-xs text-slate-400">• {state.company.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            📈 Gestion & Statistiques des Bénéfices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Analysez la rentabilité réelle par produit, par point de vente et sur chaque période (jour, mois, année).
          </p>
        </div>

        {/* Store Selector Filter */}
        <div className="w-full md:w-72">
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 shadow-xs outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">🏪 Toutes les Boutiques (Vue Consolidée)</option>
            {state.stores.map((s) => (
              <option key={s.id} value={s.id}>
                🏪 {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Période :</span>
          </span>

          <button
            type="button"
            onClick={() => setDateFilter('TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateFilter === 'TODAY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Aujourd'hui
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('YESTERDAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateFilter === 'YESTERDAY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Hier
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateFilter === 'THIS_WEEK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cette Semaine
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateFilter === 'THIS_MONTH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Ce Mois
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('LAST_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateFilter === 'LAST_MONTH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Mois Dernier
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('THIS_YEAR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateFilter === 'THIS_YEAR'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cette Année
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tout l'Historique
          </button>

          <button
            type="button"
            onClick={() => setDateFilter('CUSTOM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateFilter === 'CUSTOM'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Plage Personnalisée
          </button>
        </div>

        {/* Custom date range inputs */}
        {dateFilter === 'CUSTOM' && (
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

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'Affaires Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Chiffre d'Affaires (CA)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400">
            {filteredSales.length} transaction(s) enregistrée(s)
          </p>
        </div>

        {/* Coût Total d'Achat (Prix d'achat fournisseur) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Coût Total d'Achat
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatCurrency(totalCost)}
          </div>
          <p className="text-[11px] text-slate-400">
            Prix de revient total des marchandises vendues
          </p>
        </div>

        {/* Bénéfice Net Réalisé */}
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 p-5 rounded-3xl text-white shadow-md space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-200">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Bénéfice Net Réalisé
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight">
            +{formatCurrency(totalProfit)}
          </div>
          <p className="text-[11px] text-emerald-100 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Gain net encaissé après déduction d'achat</span>
          </p>
        </div>

        {/* Taux de Marge Moyen */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Taux de Marge Moyen
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {averageMarginPct}%
          </div>
          <p className="text-[11px] text-slate-400">
            {totalItemsSold} article(s) / kg vendus au total
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Bénéfice par Produit ({productProfitList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'stores'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Bénéfice par Boutique ({state.stores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'timeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Évolution Journalière & Dates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sales'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Journal Vente par Vente ({filteredSales.length})</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT PROFIT MATRIX */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer par nom d'article, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-900 outline-none font-medium"
              />
            </div>

            <div className="w-full sm:w-60">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 outline-none"
              >
                <option value="ALL">Toutes les catégories</option>
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Profit Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Produit / Article</th>
                    <th className="px-4 py-3.5">Catégorie</th>
                    <th className="px-4 py-3.5 text-center">Quantité Vendue</th>
                    <th className="px-4 py-3.5 text-right">Prix d'Achat</th>
                    <th className="px-4 py-3.5 text-right">Prix de Vente</th>
                    <th className="px-4 py-3.5 text-right">Chiffre d'Affaires</th>
                    <th className="px-4 py-3.5 text-right">Coût d'Achat Total</th>
                    <th className="px-4 py-3.5 text-right">Bénéfice Net</th>
                    <th className="px-4 py-3.5 text-center">Marge %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {productProfitList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Aucune vente ni donnée de bénéfice pour ces critères.
                      </td>
                    </tr>
                  ) : (
                    productProfitList.map((item, idx) => {
                      const unitProfit = item.sellingPrice - item.purchasePrice;
                      return (
                        <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                              {item.categoryName}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                            {item.quantitySold} {item.unit}
                          </td>

                          <td className="px-4 py-3.5 text-right font-bold text-slate-600">
                            {formatCurrency(item.purchasePrice)}
                          </td>

                          <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                            {formatCurrency(item.sellingPrice)}
                          </td>

                          <td className="px-4 py-3.5 text-right font-black text-slate-900">
                            {formatCurrency(item.revenue)}
                          </td>

                          <td className="px-4 py-3.5 text-right font-semibold text-slate-500">
                            {formatCurrency(item.cost)}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                              item.profit > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.profit === 0
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              +{formatCurrency(item.profit)}
                            </span>
                            {item.quantitySold > 0 && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                (+{formatCurrency(unitProfit)}/{item.unit})
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              item.marginPct >= 30
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.marginPct >= 15
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.marginPct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORE PROFIT COMPARISON */}
      {activeTab === 'stores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeProfitList.map(({ store, salesCount, itemsCount, revenue, cost, profit, marginPct }, idx) => (
              <div
                key={store.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{store.name}</h4>
                      <p className="text-[11px] text-slate-400">{store.city} • Code: {store.code}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                    Rang #{idx + 1}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Chiffre d'Affaires :</span>
                    <span className="font-bold text-slate-900">{formatCurrency(revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Coût d'Achat Fournisseur :</span>
                    <span className="font-semibold text-slate-600">{formatCurrency(cost)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">Bénéfice Net :</span>
                    <span className="font-black text-sm text-emerald-700">+{formatCurrency(profit)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{salesCount} ventes ({itemsCount} articles)</span>
                  <span className="font-black text-emerald-700">Marge : {marginPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE / DAILY BREAKDOWN */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-sm">
              📅 Bénéfices Réalisés Jour par Jour
            </h3>
            <p className="text-xs text-slate-400">
              Historique quotidien du chiffre d'affaires, des coûts et de la marge brute
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-center">Transactions</th>
                  <th className="px-4 py-3.5 text-right">Chiffre d'Affaires</th>
                  <th className="px-4 py-3.5 text-right">Coût Fournisseur</th>
                  <th className="px-4 py-3.5 text-right">Bénéfice Net</th>
                  <th className="px-4 py-3.5 text-center">Marge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {timelineProfitList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Aucune transaction enregistrée pour la période sélectionnée.
                    </td>
                  </tr>
                ) : (
                  timelineProfitList.map((day) => {
                    const margin = day.revenue > 0 ? Math.round((day.profit / day.revenue) * 100) : 0;
                    return (
                      <tr key={day.dateStr} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                          {formatDate(day.dateStr)}
                        </td>

                        <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                          {day.salesCount} ticket(s)
                        </td>

                        <td className="px-4 py-3.5 text-right font-black text-slate-900">
                          {formatCurrency(day.revenue)}
                        </td>

                        <td className="px-4 py-3.5 text-right font-semibold text-slate-500">
                          {formatCurrency(day.cost)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-black text-xs">
                            +{formatCurrency(day.profit)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[11px]">
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTION BY TRANSACTION PROFIT BREAKDOWN */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-sm">
              🧾 Détail du Bénéfice par Facture
            </h3>
            <p className="text-xs text-slate-400">
              Vérifiez exactement combien chaque vente a rapporté à l'entreprise
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">N° Facture & Date</th>
                  <th className="px-4 py-3.5">Boutique</th>
                  <th className="px-4 py-3.5">Articles Vendus</th>
                  <th className="px-4 py-3.5 text-right">Montant Vente</th>
                  <th className="px-4 py-3.5 text-right">Coût d'Achat</th>
                  <th className="px-4 py-3.5 text-right">Bénéfice Réalisé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Aucune vente pour la sélection active.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    let saleCost = 0;
                    sale.items.forEach((item) => {
                      const prod = state.products.find((p) => p.id === item.product?.id);
                      const pPrice = item.product?.purchase_price ?? prod?.purchase_price ?? 0;
                      saleCost += item.quantity * pPrice;
                    });
                    const saleProfit = sale.total_amount - saleCost;

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900 font-mono">{sale.invoice_number}</p>
                          <span className="text-[10px] text-slate-400">{formatDate(sale.created_at)}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800">{sale.store_name}</span>
                          <span className="text-[10px] text-slate-400 block">{sale.seller_name}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-slate-700 font-medium">
                            {sale.items.map((i) => `${i.product.name} (x${i.quantity} ${i.product.unit || ''})`).join(', ')}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-right font-black text-slate-900">
                          {formatCurrency(sale.total_amount)}
                        </td>

                        <td className="px-4 py-3.5 text-right font-semibold text-slate-500">
                          {formatCurrency(saleCost)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                            saleProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            +{formatCurrency(saleProfit)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
