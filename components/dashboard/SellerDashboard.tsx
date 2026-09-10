'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Receipt, Award, Plus, ArrowRight, UserCheck } from 'lucide-react';

interface SellerDashboardProps {
  onNavigateTab: (tab: any) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigateTab }) => {
  const { state, currentUser } = useAppStore();

  const mySales = state.sales.filter((s) => s.seller_id === currentUser.id);
  const myTotalToday = mySales.reduce((acc, s) => acc + s.total_amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Seller Greeting Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-200">
            🛒 Espace Vendeur / Caisse
          </span>
          <h2 className="text-2xl font-black mt-2">
            Bonjour {currentUser.full_name} 👋
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Matricule: {currentUser.code} • Bonne journée de vente !
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('pos')}
          className="px-6 py-3.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
        >
          <ShoppingCart className="w-5 h-5 text-emerald-600" />
          <span>+ NOUVELLE VENTE</span>
        </button>
      </div>

      {/* Seller Today Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">💰 Mon CA Aujourd'hui</span>
          <p className="text-2xl font-black text-slate-950 mt-1">{formatCurrency(myTotalToday)}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Encaissé à votre caisse</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">🛒 Mes Ventes Effectuées</span>
          <p className="text-2xl font-black text-slate-950 mt-1">{mySales.length}</p>
          <span className="text-[11px] text-slate-400">Transactions validées</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-slate-400 uppercase">🎯 Objectif du Mois</span>
          <p className="text-2xl font-black text-blue-600 mt-1">72.5%</p>
          <span className="text-[11px] text-slate-400">Sur {formatCurrency(currentUser.monthly_sales_target)}</span>
        </div>
      </div>

      {/* Recent Sales by this seller */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-sm font-black text-slate-900">Mes Derniers Reçus de Vente</h3>
          <button onClick={() => onNavigateTab('sales')} className="text-xs text-blue-600 font-bold">
            Consulter historique
          </button>
        </div>

        {mySales.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Vous n'avez pas encore enregistré de vente aujourd'hui.
          </div>
        ) : (
          <div className="space-y-2">
            {mySales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{sale.invoice_number}</p>
                    <p className="text-[10px] text-slate-400">
                      {sale.items.length} articles • Client: {sale.customer_name || 'Comptoir'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-700">{formatCurrency(sale.total_amount)}</p>
                  <span className="text-[10px] font-semibold text-slate-500">{sale.payment_method}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
