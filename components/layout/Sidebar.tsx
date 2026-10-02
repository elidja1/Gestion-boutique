'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { UserRoleType } from '@/lib/types';
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Package,
  Layers,
  ArrowLeftRight,
  TrendingUp,
  Receipt,
  Users,
  DollarSign,
  UserCheck,
  Star,
  Activity,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';

export type NavTabType =
  | 'developer'
  | 'dashboard'
  | 'stores'
  | 'pos'
  | 'products'
  | 'stock'
  | 'sales'
  | 'profits'
  | 'staff'
  | 'settings';

interface SidebarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavTabType;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  roles: UserRoleType[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { state } = useAppStore();
  const currentRole = state.currentRole;

  const lowStockCount = state.products.filter((p) => {
    if (state.activeStoreId === 'ALL') {
      return (p.total_stock || 0) <= p.min_stock_alert;
    }
    const storeQty = p.stock_by_store?.[state.activeStoreId] || 0;
    return storeQty <= p.min_stock_alert;
  }).length;

  const navItems: NavItem[] = [
    {
      id: 'developer',
      label: 'Console Développeur',
      icon: <ShieldAlert className="w-4 h-4 text-indigo-400" />,
      roles: ['SUPERADMIN'],
      badge: 'DEV',
    },
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['OWNER'],
    },
    {
      id: 'pos',
      label: 'Caisse / Vente Express',
      icon: <ShoppingCart className="w-4 h-4" />,
      roles: ['OWNER', 'SELLER'],
      badge: 'Caisse',
    },
    {
      id: 'stores',
      label: 'Boutiques',
      icon: <Store className="w-4 h-4" />,
      roles: ['OWNER'],
    },
    {
      id: 'products',
      label: 'Produits & Prix',
      icon: <Package className="w-4 h-4" />,
      roles: ['OWNER'],
    },
    {
      id: 'stock',
      label: 'Stocks & Mouvements',
      icon: <Layers className="w-4 h-4" />,
      roles: ['OWNER'],
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'sales',
      label: 'Ventes & Factures',
      icon: <Receipt className="w-4 h-4" />,
      roles: ['OWNER'],
    },
    {
      id: 'profits',
      label: 'Bénéfices & Rentabilité',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      roles: ['OWNER'],
    },
    {
      id: 'staff',
      label: 'Collaborateurs & Accès',
      icon: <UserCheck className="w-4 h-4" />,
      roles: ['OWNER'],
    },
    {
      id: 'settings',
      label: 'Paramètres Entreprise',
      icon: <Settings className="w-4 h-4" />,
      roles: ['OWNER'],
    },
  ];

  const allowedNavItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20">
              VG
            </div>
            <div>
              <h1 className="font-bold text-sm text-white leading-tight tracking-tight">
                Vertu De Gloire
              </h1>
              <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                Multi-Shop Manager
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Context Pill in Sidebar */}
        <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">
              {currentRole === 'SUPERADMIN' ? 'Profil Actif:' : 'Boutique Active:'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs font-bold text-white mt-0.5 truncate">
            {currentRole === 'SUPERADMIN'
              ? '🛠️ Console Développeur'
              : state.activeStoreId === 'ALL'
              ? `Toutes les Boutiques (${state.stores.length})`
              : state.stores.find((s) => s.id === state.activeStoreId)?.name || 'Boutique'}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {allowedNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? item.id === 'developer'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.id === 'developer'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : item.id === 'stock'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>Devise</span>
            <span className="font-bold text-white">{state.company.currency}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Pays</span>
            <span className="font-bold text-white">{state.company.country}</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 text-center">
            v2.5.0 • VGM Multi-Shop
          </div>
        </div>
      </aside>
    </>
  );
};
