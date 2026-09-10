'use client';

import React, { useState } from 'react';
import { PaymentMethod, SalePayment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Banknote,
  Smartphone,
  CreditCard,
  UserCheck,
  Split,
  X,
  CheckCircle,
  Coins,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirmPayment: (payments: SalePayment[], paymentMethod: PaymentMethod, paidAmount: number, change: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirmPayment,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(totalAmount);
  const [momoRef, setMomoRef] = useState<string>('');

  // Split payment state
  const [isSplit, setIsSplit] = useState(false);
  const [splitCash, setSplitCash] = useState<number>(Math.round(totalAmount / 2));
  const [splitMomo, setSplitMomo] = useState<number>(totalAmount - Math.round(totalAmount / 2));

  if (!isOpen) return null;

  const quickAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 1000) * 1000,
    Math.ceil(totalAmount / 5000) * 5000,
    Math.ceil(totalAmount / 10000) * 10000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= totalAmount);

  const changeReturned = selectedMethod === 'CASH' && !isSplit ? Math.max(0, cashGiven - totalAmount) : 0;

  const handleValidate = () => {
    if (isSplit) {
      const payments: SalePayment[] = [
        { payment_method: 'CASH', amount: splitCash },
        { payment_method: 'MTN_MOMO', amount: splitMomo, reference_code: momoRef || undefined },
      ];
      onConfirmPayment(payments, 'SPLIT', splitCash + splitMomo, 0);
    } else {
      const payments: SalePayment[] = [
        {
          payment_method: selectedMethod,
          amount: selectedMethod === 'CASH' ? cashGiven : totalAmount,
          reference_code: momoRef || undefined,
        },
      ];
      onConfirmPayment(
        payments,
        selectedMethod,
        selectedMethod === 'CASH' ? cashGiven : totalAmount,
        changeReturned
      );
    }
  };

  const methods = [
    { id: 'CASH' as PaymentMethod, label: 'Espèces', icon: <Banknote className="w-5 h-5 text-emerald-600" />, desc: 'Billet / Pièces' },
    { id: 'MTN_MOMO' as PaymentMethod, label: 'MTN MoMo', icon: <Smartphone className="w-5 h-5 text-amber-500" />, desc: 'Mobile Money' },
    { id: 'MOOV_MONEY' as PaymentMethod, label: 'Moov Money', icon: <Smartphone className="w-5 h-5 text-blue-500" />, desc: 'Flooz' },
    { id: 'WAVE' as PaymentMethod, label: 'Wave', icon: <Smartphone className="w-5 h-5 text-sky-400" />, desc: 'Wave QR' },
    { id: 'CARD' as PaymentMethod, label: 'Carte Bancaire', icon: <CreditCard className="w-5 h-5 text-indigo-500" />, desc: 'Terminal TPE' },
    { id: 'CREDIT' as PaymentMethod, label: 'Crédit Client', icon: <UserCheck className="w-5 h-5 text-rose-500" />, desc: 'À régler plus tard' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-black">Règlement de la Vente</h3>
            <p className="text-xs text-slate-400">Sélectionnez le mode de paiement</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Total à Encaisser
            </span>
            <div className="text-2xl font-black text-slate-950">
              {formatCurrency(totalAmount)}
            </div>
          </div>
          <button
            onClick={() => setIsSplit(!isSplit)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isSplit
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Split className="w-4 h-4" />
            <span>Paiement Mixte</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[60vh]">
          {isSplit ? (
            /* Split Payment Interface */
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ventilation du Paiement Mixte
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    💵 Part Espèces (FCFA)
                  </label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitCash(val);
                      setSplitMomo(Math.max(0, totalAmount - val));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    📱 Part Mobile Money (FCFA)
                  </label>
                  <input
                    type="number"
                    value={splitMomo}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitMomo(val);
                      setSplitCash(Math.max(0, totalAmount - val));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Réf. Transaction MoMo / N°
                </label>
                <input
                  type="text"
                  placeholder="Ex: TXN-998823"
                  value={momoRef}
                  onChange={(e) => setMomoRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            /* Single Method Selection */
            <>
              <div className="grid grid-cols-3 gap-2.5">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMethod(m.id);
                      if (m.id === 'CASH') setCashGiven(totalAmount);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      selectedMethod === m.id
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      {m.icon}
                      {selectedMethod === m.id && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-bold text-slate-900">{m.label}</p>
                      <p className="text-[10px] text-slate-400">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Cash Calculation */}
              {selectedMethod === 'CASH' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Montant reçu du client :
                    </label>
                    <div className="text-xs text-slate-400">Saisie directe ou suggestions</div>
                  </div>
                  <input
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Quick cash pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashGiven(amt)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          cashGiven === amt
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Change returned block */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>Monnaie à Rendre :</span>
                    </div>
                    <span
                      className={`text-lg font-black ${
                        changeReturned > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {formatCurrency(changeReturned)}
                    </span>
                  </div>
                </div>
              )}

              {/* MoMo Reference */}
              {(selectedMethod === 'MTN_MOMO' || selectedMethod === 'MOOV_MONEY' || selectedMethod === 'WAVE') && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    N° Téléphone ou Réf. Transaction (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 97XX XX XX / ID Transaction"
                    value={momoRef}
                    onChange={(e) => setMomoRef(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Confirmation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleValidate}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Valider et Imprimer Reçu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
