'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Sale } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ReceiptModal } from './ReceiptModal';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Eye,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { state, activeStore } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const filteredSales = state.sales.filter((s) => {
    const matchStore = state.activeStoreId === 'ALL' || s.store_id === state.activeStoreId;
    const matchQuery =
      s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.seller_name && s.seller_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStore && matchQuery;
  });

  const handleOpenReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            🧾 Historique des Ventes & Factures
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Consultez les transactions, réimprimez les tickets et suivez les règlements
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par numéro de facture, client ou vendeur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-medium text-slate-900 outline-none"
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">N° Facture / Date</th>
                <th className="px-4 py-3.5">Boutique</th>
                <th className="px-4 py-3.5">Vendeur</th>
                <th className="px-4 py-3.5">Client</th>
                <th className="px-4 py-3.5 text-center">Articles</th>
                <th className="px-4 py-3.5 text-right">Montant Total</th>
                <th className="px-4 py-3.5 text-center">Mode Paiement</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-950 font-mono">{sale.invoice_number}</p>
                    <span className="text-[10px] text-slate-400">{formatDate(sale.created_at)}</span>
                  </td>

                  <td className="px-4 py-3.5 font-semibold text-slate-800">{sale.store_name}</td>
                  <td className="px-4 py-3.5 text-slate-600">{sale.seller_name}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900">{sale.customer_name || 'Comptoir'}</span>
                    {sale.customer_phone && (
                      <span className="text-[10px] text-slate-400 block">{sale.customer_phone}</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                    {sale.items.reduce((acc, i) => acc + i.quantity, 0)}
                  </td>

                  <td className="px-4 py-3.5 text-right font-black text-slate-950 text-xs">
                    {formatCurrency(sale.total_amount)}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-full text-[10px]">
                      {sale.payment_method}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleOpenReceipt(sale)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all text-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Ticket</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={selectedSale}
        company={state.company}
      />
    </div>
  );
};
