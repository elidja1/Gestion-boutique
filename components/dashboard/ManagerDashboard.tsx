'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Plus,
} from 'lucide-react';

interface ManagerDashboardProps {
  onNavigateTab: (tab: any) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigateTab }) => {
  const { state, currentUser, activeStore } = useAppStore();

  const currentStore = activeStore || state.stores[0];
  const storeSales = state.sales.filter((s) => s.store_id === currentStore.id);
  const storeStaff = state.users.filter((u) => u.store_id === currentStore.id);
  const storeLowStock = state.products.filter(
    (p) => (p.stock_by_store?.[currentStore.id] || 0) <= p.min_stock_alert
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/30 rounded-full text-xs font-bold text-blue-200">
            🧑‍💼 Espace Manager Boutique
          </span>
          <h2 className="text-2xl font-black mt-2">
            {currentStore.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            📍 {currentStore.address} • Responsable: {currentStore.manager_name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('pos')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Ouvrir Caisse / POS</span>
          </button>
          <button
            onClick={() => onNavigateTab('profits')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Bénéfices & Stats</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">💰 Ventes Aujourd'hui</span>
          <p className="text-xl font-black text-slate-950 mt-1">
            {formatCurrency(currentStore.today_revenue)}
          </p>
          <span className="text-[11px] text-slate-400">{currentStore.today_sales_count} tickets émis</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">👥 Staff sur place</span>
          <p className="text-xl font-black text-slate-950 mt-1">
            {storeStaff.length} employés
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Tous en service</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">⚠️ Alertes Stock</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {storeLowStock.length} produits
          </p>
          <span className="text-[11px] text-slate-400">Stock ≤ seuil d alerte</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">📦 Articles Disponibles</span>
          <p className="text-xl font-black text-blue-600 mt-1">
            {state.products.length}
          </p>
          <span className="text-[11px] text-slate-400">Total au catalogue</span>
        </div>
      </div>

      {/* Tables: Store Sales & Staff Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-black text-slate-900">Dernières Ventes de la Boutique</h3>
            <button onClick={() => onNavigateTab('sales')} className="text-xs text-blue-600 font-bold">
              Voir tout
            </button>
          </div>
          <div className="space-y-2">
            {storeSales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-2xl text-xs">
                <div>
                  <p className="font-bold text-slate-900">{sale.invoice_number}</p>
                  <p className="text-[10px] text-slate-400">{sale.seller_name} • {sale.customer_name || 'Comptoir'}</p>
                </div>
                <span className="font-black text-blue-600">{formatCurrency(sale.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-black text-slate-900">Suivi des Vendeurs de l'Équipe</h3>
            <button onClick={() => onNavigateTab('staff')} className="text-xs text-blue-600 font-bold">
              Objectifs
            </button>
          </div>
          <div className="space-y-3">
            {storeStaff.map((emp) => (
              <div key={emp.id} className="p-3 bg-slate-50 rounded-2xl">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800">{emp.full_name} ({emp.code})</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(emp.current_month_sales || 0)}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
