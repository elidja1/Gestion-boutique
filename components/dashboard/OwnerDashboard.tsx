'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Store,
  Users,
  AlertTriangle,
  Flame,
  DollarSign,
  Award,
  ArrowUpRight,
  Plus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface OwnerDashboardProps {
  onNavigateTab: (tab: any) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigateTab }) => {
  const { state, currentUser, activeStore } = useAppStore();

  const isGlobalView = state.activeStoreId === 'ALL';

  // Compute stats according to active store or global
  const filteredSales = state.sales.filter(
    (s) => isGlobalView || s.store_id === state.activeStoreId
  );

  const todayRevenue = isGlobalView
    ? state.stores.reduce((acc, s) => acc + (s.today_revenue || 0), 0)
    : activeStore?.today_revenue || 0;

  const todaySalesCount = isGlobalView
    ? state.stores.reduce((acc, s) => acc + (s.today_sales_count || 0), 0)
    : activeStore?.today_sales_count || 0;

  const totalProducts = state.products.length;
  const totalEmployees = state.users.filter(
    (u) => isGlobalView || u.store_id === state.activeStoreId
  ).length;

  const lowStockProducts = state.products.filter((p) => {
    if (isGlobalView) {
      return (p.total_stock || 0) <= p.min_stock_alert && (p.total_stock || 0) > 0;
    }
    const st = p.stock_by_store?.[state.activeStoreId] || 0;
    return st <= p.min_stock_alert && st > 0;
  });

  const ruptureProducts = state.products.filter((p) => {
    if (isGlobalView) {
      return (p.total_stock || 0) === 0;
    }
    const st = p.stock_by_store?.[state.activeStoreId] || 0;
    return st === 0;
  });

  const totalExpenses = state.expenses
    .filter((e) => isGlobalView || e.store_id === state.activeStoreId)
    .reduce((acc, e) => acc + e.amount, 0);

  const estimatedProfit = Math.max(0, todayRevenue * 0.35 - totalExpenses);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/30 border border-blue-400/40 text-blue-300 text-xs font-bold rounded-full">
              👑 Vue Dirigeant Entreprise
            </span>
            <span className="text-xs text-slate-400">• {state.company.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Bonjour {currentUser.full_name.split(' ')[0]} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {isGlobalView
              ? "Voici l'activité consolidée de l'ensemble de vos 4 boutiques aujourd'hui."
              : `Focus spécifique sur l'activité de la boutique : ${activeStore?.name}`}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 relative z-10">
          <button
            onClick={() => onNavigateTab('pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/30"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Nouvelle Vente (POS)</span>
          </button>
          <button
            onClick={() => onNavigateTab('transfers')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Transfert Stock</span>
          </button>
        </div>

        {/* Subtle decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* CA Aujourd'hui */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              💰 CA Aujourd'hui
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-950">
            {formatCurrency(todayRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% vs hier</span>
          </div>
        </div>

        {/* Ventes */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              🛒 Ventes
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-950">
            {todaySalesCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5">
            Panier moy: {formatCurrency(todaySalesCount ? Math.round(todayRevenue / todaySalesCount) : 0)}
          </div>
        </div>

        {/* Produits */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              📦 Produits
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-950">
            {totalProducts}
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5">
            {state.categories.length} catégories actives
          </div>
        </div>

        {/* Boutiques */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              🏪 Boutiques
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-950">
            {state.stores.length}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>4 Ouvertes</span>
          </div>
        </div>

        {/* Stock Faible Alert */}
        <div
          onClick={() => onNavigateTab('stock')}
          className="bg-amber-50/60 p-4 rounded-3xl border border-amber-200 shadow-xs hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              ⚠️ Stock faible
            </span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-950">
            {lowStockProducts.length}
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1.5">
            À commander d'urgence →
          </div>
        </div>

        {/* Ruptures */}
        <div
          onClick={() => onNavigateTab('stock')}
          className="bg-rose-50/60 p-4 rounded-3xl border border-rose-200 shadow-xs hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              🔴 Ruptures
            </span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-950">
            {ruptureProducts.length}
          </div>
          <div className="text-[10px] text-rose-700 font-semibold mt-1.5">
            Stock à 0 unité →
          </div>
        </div>
      </div>

      {/* Middle Grid: Performance des Boutiques & Performance des Vendeurs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stores Ranking Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  🏪 Performance des Boutiques
                </h3>
                <p className="text-xs text-slate-400">
                  Comparatif du chiffre d'affaires et volume du jour
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('stores')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
              >
                <span>Gérer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {state.stores.map((store, index) => {
                const percentageOfTotal = todayRevenue > 0 ? Math.round(((store.today_revenue || 0) / todayRevenue) * 100) : 0;
                return (
                  <div key={store.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{store.name}</p>
                        <p className="text-[10px] text-slate-400">
                          📍 {store.address} • {store.employees_count} employés
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">
                        {formatCurrency(store.today_revenue)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {store.today_sales_count} ventes ({percentageOfTotal}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue bar progress visualization */}
          <div className="pt-4 border-t border-slate-100">
            <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden">
              <div className="bg-blue-600 h-full" style={{ width: '42%' }} title="Ekpè 42%" />
              <div className="bg-indigo-500 h-full" style={{ width: '30%' }} title="Cotonou 30%" />
              <div className="bg-emerald-500 h-full" style={{ width: '17%' }} title="Calavi 17%" />
              <div className="bg-amber-500 h-full" style={{ width: '11%' }} title="Porto-Novo 11%" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" /> Ekpè (42%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Ganhi (30%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Calavi (17%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> P-Novo (11%)</span>
            </div>
          </div>
        </div>

        {/* Top Sellers & Staff Performance */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">
                  🏆 Top Vendeurs du Mois
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('staff')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                Objectifs
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {state.users
                .filter((u) => u.role_code === 'SELLER' || u.role_code === 'MANAGER')
                .slice(0, 3)
                .map((seller, idx) => {
                  const target = seller.monthly_sales_target || 1500000;
                  const achieved = seller.current_month_sales || 1000000;
                  const pct = Math.min(100, Math.round((achieved / target) * 100));

                  return (
                    <div key={seller.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white ${
                            idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{seller.full_name}</p>
                            <p className="text-[10px] text-slate-400">{seller.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">{formatCurrency(achieved)}</p>
                          <p className="text-[10px] font-bold text-blue-600">{pct}% objectif</p>
                        </div>
                      </div>
                      {/* Target progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between text-xs text-blue-900 mt-4">
            <span className="font-semibold">Bénéfice Net Estimé :</span>
            <span className="font-black text-sm text-blue-700">{formatCurrency(estimatedProfit)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Products & Real-time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-black text-slate-900">
              🔥 Produits les Plus Vendus
            </h3>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              Catalogue
            </button>
          </div>

          <div className="space-y-2">
            {state.products.slice(0, 4).map((prod, idx) => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{prod.name}</p>
                    <p className="text-[10px] text-slate-400">
                      SKU: {prod.sku} • Stock total: {prod.total_stock}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900">
                    {formatCurrency(prod.selling_price)}
                  </span>
                  <p className="text-[10px] text-emerald-600 font-semibold">Forte rotation</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Audit Log Preview */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-black text-slate-900">
              📋 Activités Récentes en Direct
            </h3>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              Historique complet
            </button>
          </div>

          <div className="space-y-3">
            {state.auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-xs">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    <span className="text-blue-600 font-bold">{log.user_name}</span> : {log.details}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {log.store_name ? `Boutique: ${log.store_name} • ` : ''}
                    {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
