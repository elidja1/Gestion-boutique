'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Supplier } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Truck, Plus, Phone, Mail, MapPin, Building2, X } from 'lucide-react';

export const SupplierList: React.FC = () => {
  const { state } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('+229 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            🚚 Fournisseurs & Approvisionnements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gérez vos partenaires commerciaux, commandes groupées et dettes fournisseurs
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nouveau Fournisseur</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.suppliers.map((sup) => (
          <div key={sup.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{sup.name}</h3>
                  <span className="text-[10px] text-slate-400">Contact: {sup.contact_name}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{sup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{sup.address}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">ACHATS CUMULÉS</span>
                <span className="font-black text-slate-900">{formatCurrency(sup.total_purchases)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">SOLDE DÛ</span>
                <span className={`font-black ${sup.outstanding_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(sup.outstanding_balance)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
