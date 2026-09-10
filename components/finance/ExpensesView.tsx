'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Expense } from '@/lib/types';
import { formatCurrency, formatDateOnly } from '@/lib/utils';
import {
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
  Receipt,
  Tag,
  Building2,
  X,
  CheckCircle,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { state, currentUser, addExpense } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeId, setStoreId] = useState(state.stores[0]?.id || '');
  const [categoryName, setCategoryName] = useState('Électricité & Eau (SBEE)');
  const [amount, setAmount] = useState<number>(25000);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const filteredExpenses = state.expenses.filter(
    (e) => state.activeStoreId === 'ALL' || e.store_id === state.activeStoreId
  );

  const totalExpenseAmount = filteredExpenses.reduce((a, b) => a + b.amount, 0);

  const totalRevenue = state.stores
    .filter((s) => state.activeStoreId === 'ALL' || s.id === state.activeStoreId)
    .reduce((a, b) => a + (b.today_revenue || 0), 0);

  const estimatedProfit = Math.max(0, totalRevenue * 0.35 - totalExpenseAmount);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const st = state.stores.find((s) => s.id === storeId);

    const newExp: Expense = {
      id: `ex-${Date.now()}`,
      company_id: state.company.id,
      store_id: storeId,
      store_name: st?.name || '',
      category_name: categoryName,
      created_by_name: currentUser.full_name,
      expense_code: `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
      amount,
      payment_method: paymentMethod,
      description,
      expense_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    addExpense(newExp);
    setIsModalOpen(false);
    setDescription('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            💰 Dépenses & Bilan Financier
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des charges d'exploitation par boutique, loyers, factures SBEE et rentabilité
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Enregistrer une Dépense</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Chiffre d'Affaires</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-950">{formatCurrency(totalRevenue)}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Consolidé boutiques</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Charges & Dépenses</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600">{formatCurrency(totalExpenseAmount)}</p>
          <span className="text-[11px] text-slate-400">{filteredExpenses.length} lignes de frais</span>
        </div>

        <div className="bg-gradient-to-tr from-blue-900 to-indigo-900 p-5 rounded-3xl text-white shadow-md">
          <div className="flex items-center justify-between text-blue-200 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Bénéfice Net Estimé</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(estimatedProfit)}</p>
          <span className="text-[11px] text-blue-200">Après déduction des frais et coût</span>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Registre des Dépenses</h3>
          <span className="text-xs text-slate-400">{filteredExpenses.length} dépenses</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px]">
              <tr>
                <th className="px-5 py-3">Code / Date</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Règlement</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-5 py-3 text-right">Saisi Par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-900">{exp.expense_code}</p>
                    <span className="text-[10px] text-slate-400">{formatDateOnly(exp.expense_date)}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{exp.store_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-[10px]">
                      {exp.category_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs">{exp.description}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                      {exp.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-rose-600">
                    -{formatCurrency(exp.amount)}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500">{exp.created_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold">Enregistrer une Dépense</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Boutique Concernée *</label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {state.stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catégorie de Frais *</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Électricité & Eau (SBEE / SONEB)">Électricité & Eau (SBEE / SONEB)</option>
                  <option value="Loyer Commercial">Loyer Commercial</option>
                  <option value="Transport & Logistique">Transport & Logistique</option>
                  <option value="Entretien & Emballage">Entretien & Emballage</option>
                  <option value="Salaires & Primes">Salaires & Primes</option>
                  <option value="Connexion Internet">Connexion Internet</option>
                  <option value="Autre Dépense">Autre Dépense</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mode de Paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                >
                  <option value="CASH">Espèces (Déduit de la Caisse)</option>
                  <option value="MTN_MOMO">MTN Mobile Money</option>
                  <option value="MOOV_MONEY">Moov Money</option>
                  <option value="VIREMENT">Virement Bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Justificatif *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Facture SBEE compteur boutique Ganhi"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                />
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
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black shadow-md shadow-rose-600/20"
                >
                  Enregistrer la Dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
