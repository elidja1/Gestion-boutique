'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Store } from '@/lib/types';
import { X, Building2, MapPin, Phone, Mail, User, Clock, CheckCircle } from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (store: Store) => void;
  initialStore?: Store | null;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStore,
}) => {
  const { state } = useAppStore();
  const [formData, setFormData] = useState<Partial<Store>>({
    code: '',
    name: '',
    address: '',
    city: 'Cotonou',
    phone: '+229 ',
    email: '',
    manager_name: '',
    opening_hours: '08:00 - 20:30',
    is_active: true,
  });

  useEffect(() => {
    if (initialStore) {
      setFormData(initialStore);
    } else {
      setFormData({
        code: `BOUTIQUE-0${state.stores.length + 1}`,
        name: '',
        address: '',
        city: 'Cotonou',
        phone: '+229 ',
        email: '',
        manager_name: '',
        opening_hours: '08:00 - 20:30',
        is_active: true,
      });
    }
  }, [initialStore, isOpen, state.stores.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const companyId = state.company?.id || initialStore?.company_id || 'a0000000-0000-4000-8000-000000000001';

    const storeToSave: Store = {
      id: initialStore?.id || crypto.randomUUID(),
      company_id: companyId,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      address: formData.address?.trim() || '',
      city: formData.city?.trim() || 'Cotonou',
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim() || '',
      manager_name: formData.manager_name?.trim() || '',
      opening_hours: formData.opening_hours?.trim() || '08:00 - 20:30',
      is_active: formData.is_active ?? true,
      employees_count: initialStore?.employees_count || 1,
      products_count: initialStore?.products_count || 0,
      today_sales_count: initialStore?.today_sales_count || 0,
      today_revenue: initialStore?.today_revenue || 0,
    };

    onSave(storeToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">
              {initialStore ? 'Modifier la Boutique' : 'Créer une Nouvelle Boutique'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nom de la Boutique *</label>
              <input
                type="text"
                required
                placeholder="Ex: Vertu De Gloire Market 05"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Code Boutique *</label>
              <input
                type="text"
                required
                placeholder="Ex: VGM05"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ville</label>
              <input
                type="text"
                placeholder="Ex: Cotonou, Calavi, Porto-Novo..."
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Téléphone Contact</label>
              <input
                type="text"
                placeholder="+229 97 XX XX XX"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Adresse Complète</label>
            <input
              type="text"
              placeholder="Ex: Carrefour Agla PK12, Immeuble..."
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nom du Responsable</label>
              <input
                type="text"
                placeholder="Ex: Jean Houndékon"
                value={formData.manager_name || ''}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Horaires d'Ouverture</label>
              <input
                type="text"
                placeholder="08:00 - 21:00"
                value={formData.opening_hours || ''}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Boutique Ouverte / Active immédiatement</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
