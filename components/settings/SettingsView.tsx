'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { CompanySettings } from './CompanySettings';

export const SettingsView: React.FC = () => {
  const { state } = useAppStore();

  // SuperAdmin has no access to this page — they have their own developer console
  if (state.currentRole === 'SUPERADMIN') {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-3xl">🔒</div>
          <h2 className="text-xl font-black text-slate-900">Accès refusé</h2>
          <p className="text-sm text-slate-500 max-w-sm">
            Les paramètres entreprise sont réservés aux comptes propriétaire et manager.
            Accédez à la Console Développeur pour les réglages techniques.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ⚙️ Paramètres Entreprise
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Personnalisez les mentions légales, devises et coordonnées sur vos tickets de caisse
        </p>
      </div>
      <CompanySettings />
    </div>
  );
};
