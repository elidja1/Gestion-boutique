'use client';

import React, { useState } from 'react';
import { CompanySettings } from './CompanySettings';
import { SupabaseConfig } from './SupabaseConfig';
import { Building2, Database } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'supabase'>('company');

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ⚙️ Paramètres & Configuration Système
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Personnalisez les mentions légales, devises et connecteur Supabase PostgreSQL
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'company' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Informations Entreprise & Factures</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'supabase' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Connecteur Supabase PostgreSQL</span>
        </button>
      </div>

      {activeTab === 'company' ? <CompanySettings /> : <SupabaseConfig />}
    </div>
  );
};
