'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Sidebar, NavTabType } from '@/components/layout/Sidebar';
import { QuickSearchModal } from '@/components/layout/QuickSearchModal';

// Modules
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { SellerDashboard } from '@/components/dashboard/SellerDashboard';
import { PosScreen } from '@/components/pos/PosScreen';
import { StoreList } from '@/components/stores/StoreList';
import { ProductCatalog } from '@/components/inventory/ProductCatalog';
import { StockMatrix } from '@/components/inventory/StockMatrix';
import { SalesHistoryView } from '@/components/pos/SalesHistoryView';
import { ProfitAnalyticsView } from '@/components/finance/ProfitAnalyticsView';
import { StaffList } from '@/components/staff/StaffList';
import { SettingsView } from '@/components/settings/SettingsView';

import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt';

import {
  Menu,
  ShoppingCart,
  LayoutDashboard,
  Layers,
  Receipt,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

const BANNER_STORAGE_KEY = 'vgm_superadmin_banner_v1';

interface BannerState {
  isActive: boolean;
  displayMode?: 'modal' | 'banner' | 'both';
  targetAudience?: 'ALL' | 'SELLER' | 'MANAGER' | 'OWNER';
  modalTitle?: string;
  modalWidth?: 'sm' | 'md' | 'lg' | 'full';
  html: string;
  css: string;
  js: string;
}

export default function Home() {
  const router = useRouter();
  const { state } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [banner, setBanner] = useState<BannerState>({
    isActive: false,
    displayMode: 'modal',
    targetAudience: 'ALL',
    modalTitle: '📢 Annonce',
    html: '',
    css: '',
    js: '',
  });
  const [isModalDismissed, setIsModalDismissed] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Auth guard: Synchronously verify authentication from storage to prevent login page flash on refresh
  useEffect(() => {
    setMounted(true);
    let isAuth = state.isAuthenticated;
    if (typeof window !== 'undefined' && !isAuth) {
      try {
        const authRaw = localStorage.getItem('vgm_auth_session_v4');
        if (authRaw) {
          const parsed = JSON.parse(authRaw);
          isAuth = parsed.isAuthenticated === true;
        }
      } catch {}
    }

    if (!isAuth) {
      router.replace('/login');
    }
  }, [state.isAuthenticated, router]);

  // Load banner config from localStorage and listen for updates
  useEffect(() => {
    const readBanner = () => {
      try {
        const raw = localStorage.getItem(BANNER_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setBanner({
            isActive: parsed.isActive ?? false,
            displayMode: parsed.displayMode || 'modal',
            targetAudience: parsed.targetAudience || 'ALL',
            modalTitle: parsed.modalTitle || '📢 Message de la Direction',
            modalWidth: parsed.modalWidth || 'md',
            html: parsed.html ?? '',
            css: parsed.css ?? '',
            js: parsed.js ?? '',
          });
        }
      } catch {}
    };
    readBanner();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setBanner({
          isActive: detail.isActive ?? false,
          displayMode: detail.displayMode || 'modal',
          targetAudience: detail.targetAudience || 'ALL',
          modalTitle: detail.modalTitle || '📢 Message de la Direction',
          modalWidth: detail.modalWidth || 'md',
          html: detail.html ?? '',
          css: detail.css ?? '',
          js: detail.js ?? '',
        });
        setIsModalDismissed(false);
        setIsBannerDismissed(false);
      }
    };
    window.addEventListener('vgm-banner-update', handler);

    // Listen for iframe close requests
    const messageHandler = (e: MessageEvent) => {
      if (e.data === 'close-vgm-modal') {
        setIsModalDismissed(true);
      }
    };
    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('vgm-banner-update', handler);
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  // Automatically switch tab based on role
  useEffect(() => {
    if (state.currentRole === 'SUPERADMIN' && activeTab !== 'developer') {
      setActiveTab('developer');
    }
    if (state.currentRole === 'SELLER' && activeTab !== 'pos') {
      setActiveTab('pos');
    }
  }, [state.currentRole, activeTab]);

  // Check if widget targets the current user role
  const isTargetMatch =
    banner.targetAudience === 'ALL' ||
    !banner.targetAudience ||
    banner.targetAudience === state.currentRole ||
    (state.currentRole === 'SUPERADMIN');

  const showModal =
    state.isAuthenticated &&
    banner.isActive &&
    Boolean(banner.html) &&
    isTargetMatch &&
    !isModalDismissed &&
    (banner.displayMode === 'modal' || banner.displayMode === 'both' || !banner.displayMode);

  const showBanner =
    state.isAuthenticated &&
    banner.isActive &&
    Boolean(banner.html) &&
    isTargetMatch &&
    !isBannerDismissed &&
    (banner.displayMode === 'banner' || banner.displayMode === 'both');

  // Render main content area
  const renderContent = () => {
    if (state.currentRole === 'SELLER') {
      return <PosScreen />;
    }

    switch (activeTab) {
      case 'developer':
        return <SuperAdminDashboard />;

      case 'dashboard':
        if (state.currentRole === 'SUPERADMIN') {
          return <SuperAdminDashboard />;
        }
        if (state.currentRole === 'MANAGER') {
          return <ManagerDashboard onNavigateTab={setActiveTab} />;
        }
        return <OwnerDashboard onNavigateTab={setActiveTab} />;

      case 'pos':
        return <PosScreen />;

      case 'stores':
        return <StoreList onNavigateTab={setActiveTab} />;

      case 'products':
        return <ProductCatalog />;

      case 'stock':
        return <StockMatrix onNavigateTab={setActiveTab} />;

      case 'sales':
        return <SalesHistoryView />;

      case 'profits':
        return <ProfitAnalyticsView />;

      case 'staff':
        return <StaffList />;

      case 'settings':
        return <SettingsView />;

      default:
        return state.currentRole === 'SUPERADMIN' ? (
          <SuperAdminDashboard />
        ) : (
          <OwnerDashboard onNavigateTab={setActiveTab} />
        );
    }
  };

  const isSessionAuth = state.isAuthenticated || (typeof window !== 'undefined' && (() => {
    try {
      const authRaw = localStorage.getItem('vgm_auth_session_v4');
      if (authRaw) return JSON.parse(authRaw).isAuthenticated === true;
    } catch {}
    return false;
  })());

  // If checking authentication or unauthenticated, show clean transition splash without login flicker
  if (!mounted || !isSessionAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-14 h-14 rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl mb-4 shadow-xl shadow-blue-500/20 animate-pulse">
          VG
        </div>
        <p className="text-sm font-bold text-slate-300">Vertu De Gloire Market</p>
        <p className="text-xs text-slate-500 mt-1">Chargement de votre session sécurisée...</p>
      </div>
    );
  }

  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; background: transparent; }
          ${banner.css}
        </style>
      </head>
      <body>
        ${banner.html}
        <script>${banner.js}<\/script>
      </body>
    </html>
  `;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* PWA Install Banner */}
        <PWAInstallPrompt />

        {/* Top Floating HTML Banner if configured */}
        {showBanner && (
          <div className="relative z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 overflow-hidden">
                <iframe
                  srcDoc={iframeSrcDoc}
                  title="top-banner"
                  className="w-full h-14 border-0"
                  sandbox="allow-scripts"
                  scrolling="no"
                />
              </div>
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="p-2 text-slate-400 hover:text-white mr-2"
                title="Fermer la bannière"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header with hamburger on mobile */}
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-3 text-slate-600 hover:text-slate-900 bg-white border-b border-slate-200"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <Header
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenDeveloper={() => setActiveTab('developer')}
              onOpenLoginModal={() => router.push('/login')}
            />
          </div>
        </div>

        {/* Dynamic Page View */}
        <main className="flex-1 pb-16 lg:pb-6 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Mobile Bottom Quick Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold text-slate-500 shadow-lg">
          {state.currentRole === 'SUPERADMIN' ? (
            <button
              onClick={() => setActiveTab('developer')}
              className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
                activeTab === 'developer' ? 'text-indigo-600 font-black' : 'hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Console Dev</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
                activeTab === 'dashboard' ? 'text-blue-600' : 'hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Accueil</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
              activeTab === 'pos' ? 'text-blue-600 font-black' : 'hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
              activeTab === 'stock' ? 'text-blue-600' : 'hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
              activeTab === 'sales' ? 'text-blue-600' : 'hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Ventes</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-1 text-slate-500 hover:text-slate-900"
          >
            <Menu className="w-4 h-4" />
            <span>Plus</span>
          </button>
        </div>
      </div>

      {/* Backend Custom HTML Modal Popup Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  {banner.modalTitle || '📢 Message de la Direction'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Fermer la modale"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50/50">
              <iframe
                srcDoc={iframeSrcDoc}
                title="custom-backend-modal"
                className="w-full min-h-[320px] border-0 rounded-2xl bg-transparent"
                sandbox="allow-scripts allow-forms"
              />
            </div>
          </div>
        </div>
      )}

      {/* Global Quick Search Modal (Cmd+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
