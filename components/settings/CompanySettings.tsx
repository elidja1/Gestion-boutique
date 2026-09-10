'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Company } from '@/lib/types';
import { Building2, FileText, CheckCircle, Save, Globe } from 'lucide-react';

export const CompanySettings: React.FC = () => {
  const { state, updateCompany } = useAppStore();
  const [formData, setFormData] = useState<Company>({ ...state.company });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-black text-slate-900">
            🏢 Informations Légales & Facturation
          </h3>
          <p className="text-xs text-slate-500">
            Ces informations apparaîtront automatiquement sur l'en-tête et pied de vos factures et tickets
          </p>
        </div>

        {isSaved && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            Enregistré avec succès !
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nom Légal de l'Entreprise *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">N° IFU (Identifiant Fiscal) *</label>
              <input
                type="text"
                required
                value={formData.ifu}
                onChange={(e) => setFormData({ ...formData, ifu: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">N° RCCM *</label>
              <input
                type="text"
                required
                value={formData.rccm}
                onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Téléphone Principal</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Officiel</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Devise Principale</label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Adresse du Siège Social</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Site Web</label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Message de Pied de Facture / Reçu Thermique
          </label>
          <textarea
            rows={2}
            value={formData.invoice_footer_message}
            onChange={(e) => setFormData({ ...formData, invoice_footer_message: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Informations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
