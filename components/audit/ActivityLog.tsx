'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { Activity, Search, ShieldCheck, User } from 'lucide-react';

export const ActivityLog: React.FC = () => {
  const { state } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = state.auditLogs.filter((l) => {
    const matchStore = state.activeStoreId === 'ALL' || l.store_id === state.activeStoreId;
    const matchQuery =
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStore && matchQuery;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            📋 Journal d'Activité & Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Traçabilité intégrale de toutes les actions sensibles effectuées dans le système
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sécurité & Traçabilité Active</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filtrer les actions, utilisateurs, entités..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-medium text-slate-900 outline-none"
        />
      </div>

      {/* Log Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredLogs.map((log) => (
          <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3">
            <div className="mt-1 w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-950">{log.user_name}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
                    {log.action}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{formatDate(log.created_at)}</span>
              </div>

              <p className="text-xs text-slate-700 mt-1 leading-relaxed">{log.details}</p>

              {log.store_name && (
                <span className="text-[10px] text-blue-600 font-semibold mt-1 inline-block">
                  📍 {log.store_name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
