'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Calculator,
  Plus,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  X,
} from 'lucide-react';

export const CashRegisterView: React.FC = () => {
  const { state, currentUser, activeStore, openCashSession, closeCashSession } = useAppStore();

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const [initialFloat, setInitialFloat] = useState<number>(50000);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [gapReason, setGapReason] = useState<string>('');

  const effectiveStoreId = activeStore?.id || state.stores[0].id;
  const currentSession = state.cashSessions.find(
    (cs) => cs.store_id === effectiveStoreId && cs.status === 'OPEN'
  );

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openCashSession(effectiveStoreId, initialFloat);
    setIsOpenModalOpen(false);
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;
    closeCashSession(selectedSessionId, countedCash, gapReason);
    setIsCloseModalOpen(false);
    setGapReason('');
  };

  const startCloseSession = (sessionId: string, theoretical: number) => {
    setSelectedSessionId(sessionId);
    setCountedCash(theoretical);
    setIsCloseModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            💵 Gestion des Caisses & Clôtures Journalières
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des fonds de caisse, encaissements d'espèces, décaissements et détection d'écarts
          </p>
        </div>

        <div>
          {!currentSession ? (
            <button
              onClick={() => setIsOpenModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <Unlock className="w-4 h-4" />
              <span>+ Ouvrir Caisse Aujourd'hui</span>
            </button>
          ) : (
            <button
              onClick={() => startCloseSession(currentSession.id, currentSession.closing_balance_system)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
            >
              <Lock className="w-4 h-4" />
              <span>Clôturer la Caisse</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Session Status Hero Card */}
      {currentSession ? (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Session Active #{currentSession.session_code}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Ouverte à {new Date(currentSession.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} par {currentSession.user_name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-300 font-bold uppercase">Fond Initial</span>
              <p className="text-lg font-black text-white mt-0.5">{formatCurrency(currentSession.opening_balance)}</p>
            </div>
            <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-300 font-bold uppercase">Ventes Espèces (+)</span>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{formatCurrency(currentSession.total_sales_cash)}</p>
            </div>
            <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-300 font-bold uppercase">Dépenses Caisse (-)</span>
              <p className="text-lg font-black text-rose-400 mt-0.5">{formatCurrency(currentSession.total_expenses)}</p>
            </div>
            <div className="bg-blue-600/30 p-3.5 rounded-2xl border border-blue-500/40">
              <span className="text-[10px] text-blue-200 font-bold uppercase">Solde Théorique</span>
              <p className="text-xl font-black text-white mt-0.5">{formatCurrency(currentSession.closing_balance_system)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 p-5 rounded-3xl border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-900">Aucune caisse ouverte pour cette boutique</p>
              <p className="text-[11px] text-amber-700">Ouvrez une session de caisse avec le fond initial pour commencer à encaisser</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpenModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
          >
            Ouvrir maintenant
          </button>
        </div>
      )}

      {/* Sessions History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Historique des Clôtures & Écarts de Caisse</h3>
          <span className="text-xs text-slate-400">{state.cashSessions.length} sessions enregistrées</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px]">
              <tr>
                <th className="px-5 py-3">Code / Date</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Caissier</th>
                <th className="px-4 py-3 text-right">Fond Initial</th>
                <th className="px-4 py-3 text-right">Solde Théorique</th>
                <th className="px-4 py-3 text-right">Espèces Réelles</th>
                <th className="px-4 py-3 text-center">Écart de Caisse</th>
                <th className="px-4 py-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.cashSessions.map((cs) => {
                const isGap = cs.discrepancy !== undefined && cs.discrepancy !== 0;

                return (
                  <tr key={cs.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{cs.session_code}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(cs.opened_at)}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{cs.store_name}</td>
                    <td className="px-4 py-3 text-slate-700">{cs.user_name}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(cs.opening_balance)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(cs.closing_balance_system)}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      {cs.closing_balance_real !== undefined ? formatCurrency(cs.closing_balance_real) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cs.status === 'CLOSED' ? (
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-md ${
                            cs.discrepancy === 0
                              ? 'text-emerald-700 bg-emerald-50'
                              : cs.discrepancy! < 0
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-blue-700 bg-blue-50'
                          }`}
                        >
                          {cs.discrepancy === 0 ? '0 (Parfait)' : formatCurrency(cs.discrepancy)}
                        </span>
                      ) : (
                        <span className="text-slate-400">En cours</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          cs.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cs.status === 'OPEN' ? '🟢 Ouverte' : 'Clôturée'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Session Modal */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <h3 className="text-sm font-bold">Ouverture de Caisse</h3>
              <button onClick={() => setIsOpenModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleOpenSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fond de Caisse Initial (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={initialFloat || ''}
                  onChange={(e) => setInitialFloat(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-[11px]">
                L'ouverture active la caisse pour enregistrer les ventes et dépenses de la journée.
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-black shadow-md shadow-emerald-600/20"
                >
                  Valider l'Ouverture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Session Modal with Gap Calculation */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <h3 className="text-sm font-bold">Clôture & Comptage de Caisse</h3>
              <button onClick={() => setIsCloseModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCloseSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Solde Théorique Système :</span>
                  <span className="font-black text-slate-900">{formatCurrency(currentSession?.closing_balance_system)}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Espèces Réellement Comptées dans le Tiroir (FCFA) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={countedCash || ''}
                  onChange={(e) => setCountedCash(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Gap Preview */}
              {currentSession && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Écart calculé :</span>
                  <span
                    className={`font-black text-sm ${
                      countedCash - currentSession.closing_balance_system === 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(countedCash - currentSession.closing_balance_system)}
                  </span>
                </div>
              )}

              {currentSession && countedCash !== currentSession.closing_balance_system && (
                <div>
                  <label className="font-bold text-rose-700 block mb-1">
                    Justification / Motif de l'Écart (Requis si écart) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Erreur rendu de monnaie client, avance non saisie..."
                    value={gapReason}
                    onChange={(e) => setGapReason(e.target.value)}
                    className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black shadow-md shadow-rose-600/20"
                >
                  Clôturer Définitivement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
