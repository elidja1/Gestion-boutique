'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Store } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { StoreModal } from './StoreModal';
import {
  Store as StoreIcon,
  Plus,
  MapPin,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
  Phone,
  Edit2,
  Power,
  BarChart3,
} from 'lucide-react';

interface StoreListProps {
  onNavigateTab: (tab: any) => void;
}

export const StoreList: React.FC<StoreListProps> = ({ onNavigateTab }) => {
  const { state, addStore, updateStore, setActiveStoreId } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const handleCreateNew = () => {
    setEditingStore(null);
    setIsModalOpen(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setIsModalOpen(true);
  };

  const handleToggleActive = (store: Store) => {
    updateStore({
      ...store,
      is_active: !store.is_active,
    });
  };

  const handleSave = (store: Store) => {
    if (editingStore) {
      updateStore(store);
    } else {
      addStore(store);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            🏪 Gestion des Boutiques Multi-Sites
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Supervisez vos points de vente physiques, gérants et chiffres d'affaires
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Créer une Boutique</span>
        </button>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.stores.map((store) => (
          <div
            key={store.id}
            className={`bg-white rounded-3xl border transition-all p-6 shadow-xs flex flex-col justify-between ${
              store.is_active ? 'border-slate-200 hover:border-blue-400 hover:shadow-md' : 'border-slate-200 bg-slate-50/70 opacity-75'
            }`}
          >
            <div>
              {/* Top status & code */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <StoreIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">{store.name}</h3>
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {store.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      store.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${store.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span>{store.is_active ? 'Ouverte' : 'Fermée'}</span>
                  </span>
                </div>
              </div>

              {/* Location & Manager Info */}
              <div className="space-y-1.5 py-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{store.address}, {store.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{store.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Horaires : {store.opening_hours}</span>
                </div>
                {store.manager_name && (
                  <div className="text-[11px] text-slate-500 pt-1">
                    Gérant : <strong className="text-slate-800">{store.manager_name}</strong>
                  </div>
                )}
              </div>

              {/* Key Store Stats Cards */}
              <div className="grid grid-cols-4 gap-2 my-4 pt-3 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">EMPLOYÉS</span>
                  <span className="text-xs font-black text-slate-900">{store.employees_count || 4}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">PRODUITS</span>
                  <span className="text-xs font-black text-slate-900">{store.products_count || 350}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">VENTES AUJ.</span>
                  <span className="text-xs font-black text-blue-600">{store.today_sales_count || 0}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">CA AUJ.</span>
                  <span className="text-xs font-black text-emerald-600 truncate block">
                    {formatCurrency(store.today_revenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <button
                onClick={() => {
                  setActiveStoreId(store.id);
                  onNavigateTab('dashboard');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Voir stats boutique</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEdit(store)}
                  className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleActive(store)}
                  className={`p-2 rounded-xl transition-colors ${
                    store.is_active
                      ? 'text-rose-600 hover:bg-rose-50 bg-slate-100'
                      : 'text-emerald-600 hover:bg-emerald-50 bg-slate-100'
                  }`}
                  title={store.is_active ? 'Fermer la boutique' : 'Ouvrir la boutique'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Store Create/Edit Modal */}
      <StoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialStore={editingStore}
      />
    </div>
  );
};
