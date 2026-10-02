'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { UserRoleType } from '@/lib/types';
import {
  requestDesktopNotificationPermission,
  getNotificationPermissionState,
  sendTestPushNotification,
} from '@/lib/pushNotifications';
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
  ShieldCheck,
  LogOut,
  User,
  Volume2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenDeveloper?: () => void;
  onOpenLoginModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSettings,
  onOpenDeveloper,
  onOpenLoginModal,
}) => {
  const router = useRouter();
  const {
    state,
    currentUser,
    activeStore,
    setActiveStoreId,
    setCurrentRole,
    syncWithSupabase,
    logout,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
  } = useAppStore();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPermissionState().then(setNotifPermission);
  }, []);

  const handleToggleNotification = async () => {
    const res = await requestDesktopNotificationPermission();
    setNotifPermission(res.permission);
    setNotifFeedback(res.message);
    setTimeout(() => setNotifFeedback(null), 4000);
  };

  const handleTestNotification = async () => {
    await sendTestPushNotification(
      '🔔 Test de Notification PC & Son',
      `Bonjour ${currentUser.full_name} ! Le son et les alertes web push fonctionnent parfaitement sur cet ordinateur.`
    );
    setNotifFeedback('Alerte envoyée avec succès sur votre PC !');
    setTimeout(() => setNotifFeedback(null), 3500);
  };

  const unreadNotifs = state.notifications.filter((n) => !n.is_read);

  const roleLabels: Record<UserRoleType, { label: string; icon: React.ReactNode; color: string }> = {
    SUPERADMIN: {
      label: 'Super Admin (Dev)',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-500" />,
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    },
    OWNER: {
      label: 'Propriétaire / PDG',
      icon: <Crown className="w-4 h-4 text-amber-600" />,
      color: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    MANAGER: {
      label: 'Manager de Boutique',
      icon: <Briefcase className="w-4 h-4 text-blue-600" />,
      color: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    SELLER: {
      label: 'Vendeur / Caisse',
      icon: <ShoppingCart className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
    STOCK_AGENT: {
      label: 'Gestionnaire Stock',
      icon: <Package className="w-4 h-4 text-purple-600" />,
      color: 'bg-purple-50 text-purple-900 border-purple-200',
    },
    ACCOUNTANT: {
      label: 'Comptable',
      icon: <BadgeDollarSign className="w-4 h-4 text-slate-700" />,
      color: 'bg-slate-100 text-slate-900 border-slate-300',
    },
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200">
      {/* Left: Global Store Selector */}
      <div className="flex items-center gap-3">
        {state.currentRole === 'SELLER' ? (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 shadow-xs">
            <StoreIcon className="w-4 h-4 text-emerald-600" />
            <span>
              🏪 {state.stores.find((s) => s.id === currentUser.store_id)?.name || activeStore?.name || state.stores[0]?.name || 'Boutique Affectée'}
            </span>
          </div>
        ) : state.currentRole !== 'SUPERADMIN' ? (
          <div className="relative">
            <button
              onClick={() => {
                setShowStoreMenu(!showStoreMenu);
                setShowRoleMenu(false);
                setShowNotifMenu(false);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 transition-all shadow-xs"
            >
              <StoreIcon className="w-4 h-4 text-blue-600" />
              <span className="truncate max-w-[180px] sm:max-w-[240px]">
                {state.activeStoreId === 'ALL'
                  ? '🏪 Vue Globale (Toutes)'
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
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-black text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Mode Développeur Super Admin</span>
          </div>
        )}

        {/* Search button */}
        {state.currentRole !== 'SELLER' && (
          <button
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100/70 hover:bg-slate-200/70 text-slate-500 rounded-xl text-xs font-medium transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Recherche globale</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono shadow-xs">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Supabase Live Sync Status Badge — SUPERADMIN ONLY */}
        {state.currentRole === 'SUPERADMIN' && (
          <button
            onClick={() => syncWithSupabase()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              state.syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : state.syncStatus === 'syncing'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
            title="Synchroniser avec Supabase"
          >
            <Database className={`w-3.5 h-3.5 ${state.syncStatus === 'syncing' ? 'animate-spin text-blue-600' : 'text-emerald-600'}`} />
            <span className="hidden sm:inline">
              {state.syncStatus === 'synced' ? 'DB En Ligne' : state.syncStatus === 'syncing' ? 'Sync...' : 'Hors-Ligne'}
            </span>
          </button>
        )}

        {/* Role badge — visible to all but only SUPERADMIN can switch */}
        <div className="relative">
          <button
            onClick={() => {
              if (state.currentRole === 'SUPERADMIN') {
                setShowRoleMenu(!showRoleMenu);
                setShowStoreMenu(false);
                setShowNotifMenu(false);
                setShowUserMenu(false);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              roleLabels[state.currentRole]?.color || 'bg-slate-100 text-slate-800'
            } ${state.currentRole !== 'SUPERADMIN' ? 'cursor-default' : ''}`}
          >
            {roleLabels[state.currentRole]?.icon}
            <span className="hidden sm:inline">{roleLabels[state.currentRole]?.label}</span>
            {state.currentRole === 'SUPERADMIN' && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
          </button>

          {showRoleMenu && state.currentRole === 'SUPERADMIN' && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Simuler un rôle (Dev)
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
              setShowUserMenu(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-xs">
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
                <div className="flex items-center gap-2">
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Tout marquer lu
                    </button>
                  )}
                  {state.notifications.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Voulez-vous supprimer toutes les notifications ?')) {
                          clearAllNotifications();
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 ml-1"
                      title="Effacer toutes les notifications"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Tout effacer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Push & Sound Banner */}
              <div className="p-3 bg-slate-50/80 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      notifPermission === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">
                        {notifPermission === 'granted' ? 'Alertes Sonores PC : Activées' : 'Alertes Sonores & Notifications PC'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {notifPermission === 'granted' ? 'Sonne à chaque vente réalisée' : 'Recevez les alertes en direct sur ce PC'}
                      </p>
                    </div>
                  </div>

                  {notifPermission === 'granted' ? (
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all shadow-2xs active:scale-95"
                    >
                      🔊 Tester
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleNotification}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs active:scale-95"
                    >
                      Activer
                    </button>
                  )}
                </div>

                {notifFeedback && (
                  <div className="mt-2 p-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-[10px] font-medium text-center">
                    {notifFeedback}
                  </div>
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
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 group ${
                        !notif.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div
                        onClick={() => markNotificationRead(notif.id)}
                        className="flex items-start gap-2.5 flex-1 cursor-pointer"
                      >
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
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {state.currentRole === 'SELLER'
                              ? notif.message.replace(/\[Reste:.*?\]/g, '').replace(/•\s*•/g, '•').trim()
                              : notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(notif.created_at)}</p>
                        </div>
                      </div>

                      {/* Delete notification button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100 shrink-0"
                        title="Supprimer cette notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu with Logout & Switch Account */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowRoleMenu(false);
              setShowStoreMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
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
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{currentUser.full_name}</p>
                <p className="text-[11px] text-slate-400">{currentUser.email || currentUser.code}</p>
              </div>

              {state.currentRole === 'SUPERADMIN' && onOpenDeveloper && (
                <button
                  onClick={() => {
                    onOpenDeveloper();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-indigo-600 font-bold hover:bg-indigo-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Console Développeur</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (onOpenLoginModal) onOpenLoginModal();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50 font-medium"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Changer de compte</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-rose-600 hover:bg-rose-50 font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
