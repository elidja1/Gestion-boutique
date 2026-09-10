'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Customer } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Plus,
  Search,
  Star,
  Phone,
  MapPin,
  ShoppingBag,
  CreditCard,
  X,
  CheckCircle,
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const { state, addCustomer } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+229 ');
  const [city, setCity] = useState('Cotonou');
  const [address, setAddress] = useState('');

  const filteredCustomers = state.customers.filter(
    (c) =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) return;

    const newCust: Customer = {
      id: `cu-${Date.now()}`,
      company_id: state.company.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      city,
      address,
      loyalty_points: 0,
      total_spent: 0,
      total_orders: 0,
      credit_balance: 0,
    };

    addCustomer(newCust);
    setIsModalOpen(false);
    setFirstName('');
    setLastName('');
    setAddress('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            👥 Clients & Programme de Fidélité
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des profils clients, points de fidélité cumulés (100 FCFA = 1 pt) et historique
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nouveau Client</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou numéro de téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-medium text-slate-900 outline-none"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {cust.first_name} {cust.last_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.phone}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-black text-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {cust.loyalty_points} pts
                </span>
              </div>

              {cust.address && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{cust.address}, {cust.city}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">ACHATS</span>
                <span className="font-black text-slate-900">{cust.total_orders}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">TOTAL DÉPENSÉ</span>
                <span className="font-black text-blue-600 truncate block">
                  {formatCurrency(cust.total_spent)}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">DETTE</span>
                <span className={`font-black truncate block ${cust.credit_balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {formatCurrency(cust.credit_balance)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Créer une Fiche Client</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom</label>
                  <input
                    type="text"
                    placeholder="Ex: DUPONT"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Numéro Téléphone *</label>
                <input
                  type="text"
                  required
                  placeholder="+229 97 XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Adresse</label>
                  <input
                    type="text"
                    placeholder="Quartier, Lot..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-600/20"
                >
                  Enregistrer Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
