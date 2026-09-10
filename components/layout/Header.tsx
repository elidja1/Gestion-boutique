'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { UserRoleType } from '@/lib/types';
import {
  Store as StoreIcon,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  Database,
  Crown,
  Briefcase,
  ShoppingCart,
  Package,
  BadgeDollarSign,
  ChevronDown,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenSettings }) => {
  const {
    state,
    currentUser,
    activeStore,
    setActiveStoreId,
    setCurrentRole,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppStore();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadNotifs = state.notifications.filter((n) => !n.is_read);

  const roleLabels: Record<UserRoleType, { label: string; icon: React.ReactNode; color: string }> = {
    OWNER: { label: '👑 Propriétaire / Super Admin', icon: <Crown className="w-4 h-4 text-amber-500" />, color: 'bg-amber-50 text-amber-800 border-amber-200' },
    MANAGER: { label: '🧑‍💼 Manager de Boutique', icon: <Briefcase className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50 text-blue-800 border-blue-200' },
    SELLER: { label: '🛒 Vendeur / Caisse', icon: <ShoppingCart className="w-4 h-4 text-emerald-500" />, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    STOCK_AGENT: { label: '📦 Agent de Stock', icon: <Package className="w-4 h-4 text-purple-500" />, color: 'bg-purple-50 text-purple-800 border-purple-200' },
    ACCOUNTANT: { label: '💰 Comptable', icon: <BadgeDollarSign className="w-4 h-4 text-slate-700" />, color: 'bg-slate-100 text-slate-800 border-slate-300' },
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200">
      {/* Left: Global Store Selector */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              setShowStoreMenu(!showStoreMenu);
              setShowRoleMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 transition-all shadow-sm"
          >
            <StoreIcon className="w-4 h-4 text-blue-600" />
            <span className="truncate max-w-[200px] sm:max-w-[260px]">
              {state.activeStoreId === 'ALL'
                ? '🏪 Toutes les boutiques (Vue Globale)'
                : activeStore
                ? `🏪 ${activeStore.name}`
                : 'Sélectionner une boutique'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {showStoreMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Filtrer par boutique
              </div>
              <button
                onClick={() => {
                  setActiveStoreId('ALL');
                  setShowStoreMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${
                  state.activeStoreId === 'ALL' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Toutes les boutiques ({state.stores.length})</span>
                </div>
                {state.activeStoreId === 'ALL' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>

              <div className="h-px bg-slate-100 my-1.5" />

              {state.stores.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveStoreId(st.id);
                    setShowStoreMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${
                    state.activeStoreId === st.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">{st.name}</p>
                    <p className="text-xs text-slate-400">📍 {st.city} • {st.code}</p>
                  </div>
                  {state.activeStoreId === st.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100/70 hover:bg-slate-200/70 text-slate-500 rounded-xl text-xs font-medium transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Recherche globale (Ctrl+K)</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Role Switcher & Notifications & Status */}
      <div className="flex items-center gap-3">
        {/* Role Selector Badge Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowStoreMenu(false);
              setShowNotifMenu(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
              roleLabels[state.currentRole]?.color || 'bg-slate-100 text-slate-800'
            }`}
          >
            {roleLabels[state.currentRole]?.icon}
            <span className="hidden sm:inline">{roleLabels[state.currentRole]?.label}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Changer de rôle (Démo & Test)
              </div>
              {(Object.keys(roleLabels) as UserRoleType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setCurrentRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-slate-50 transition-colors ${
                    state.currentRole === r ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {roleLabels[r].icon}
                    <span>{roleLabels[r].label}</span>
                  </div>
                  {state.currentRole === r && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowStoreMenu(false);
              setShowRoleMenu(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-800">Notifications</h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {state.notifications.length}
                  </span>
                </div>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {state.notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Aucune notification pour le moment.
                  </div>
                ) : (
                  state.notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !notif.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {notif.type === 'STOCK_RUPTURE' ? (
                            <span className="flex w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                          ) : notif.type === 'STOCK_LOW' ? (
                            <span className="flex w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                          ) : (
                            <span className="flex w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(notif.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Database status */}
        <button
          onClick={onOpenSettings}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-colors"
          title="Supabase PostgreSQL Ready"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">Supabase Ready</span>
        </button>

        {/* User profile avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {currentUser.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
              {currentUser.full_name}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {currentUser.code}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
