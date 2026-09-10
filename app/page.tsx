'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Sidebar, NavTabType } from '@/components/layout/Sidebar';
import { QuickSearchModal } from '@/components/layout/QuickSearchModal';

// Modules
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { SellerDashboard } from '@/components/dashboard/SellerDashboard';
import { PosScreen } from '@/components/pos/PosScreen';
import { StoreList } from '@/components/stores/StoreList';
import { ProductCatalog } from '@/components/inventory/ProductCatalog';
import { StockMatrix } from '@/components/inventory/StockMatrix';
import { TransferWorkflow } from '@/components/inventory/TransferWorkflow';
import { CashRegisterView } from '@/components/cash/CashRegisterView';
import { SalesHistoryView } from '@/components/pos/SalesHistoryView';
import { CustomerList } from '@/components/customers/CustomerList';
import { SupplierList } from '@/components/suppliers/SupplierList';
import { ExpensesView } from '@/components/finance/ExpensesView';
import { StaffList } from '@/components/staff/StaffList';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ActivityLog } from '@/components/audit/ActivityLog';
import { SettingsView } from '@/components/settings/SettingsView';

import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt';

import {
  Menu,
  ShoppingCart,
  LayoutDashboard,
  Layers,
  Receipt,
  Users,
  Building2,
} from 'lucide-react';

export default function Home() {
  const { state } = useAppStore();
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Render main content area
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (state.currentRole === 'SELLER') {
          return <SellerDashboard onNavigateTab={setActiveTab} />;
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

      case 'transfers':
        return <TransferWorkflow />;

      case 'cash':
        return <CashRegisterView />;

      case 'sales':
        return <SalesHistoryView />;

      case 'customers':
        return <CustomerList />;

      case 'suppliers':
        return <SupplierList />;

      case 'expenses':
        return <ExpensesView />;

      case 'staff':
        return <StaffList />;

      case 'reviews':
        return <ReviewList />;

      case 'audit':
        return <ActivityLog />;

      case 'settings':
        return <SettingsView />;

      default:
        return <OwnerDashboard onNavigateTab={setActiveTab} />;
    }
  };

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
            />
          </div>
        </div>

        {/* Dynamic Page View */}
        <main className="flex-1 pb-16 lg:pb-6 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Mobile Bottom Quick Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold text-slate-500 shadow-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Accueil</span>
          </button>

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

      {/* Global Quick Search Modal (Cmd+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
