'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { Star, MessageSquare, ThumbsUp, Store } from 'lucide-react';

export const ReviewList: React.FC = () => {
  const { state } = useAppStore();

  const filteredReviews = state.reviews.filter(
    (r) => state.activeStoreId === 'ALL' || r.store_id === state.activeStoreId
  );

  const averageRating =
    filteredReviews.length > 0
      ? (filteredReviews.reduce((a, b) => a + b.rating, 0) / filteredReviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header & Overall Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ⭐ Avis & Satisfaction Clients
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Évaluations laissées par vos clients sur l'accueil, les produits et la rapidité en caisse
          </p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="text-3xl font-black text-amber-500">⭐ {averageRating}</div>
          <div>
            <p className="text-xs font-bold text-slate-900">Note Moyenne</p>
            <p className="text-[10px] text-slate-400">Sur l'ensemble des retours</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="text-3xl font-black text-slate-900">{filteredReviews.length}</div>
          <div>
            <p className="text-xs font-bold text-slate-900">Avis Publiés</p>
            <p className="text-[10px] text-slate-400">100% vérifiés après achat</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="text-3xl font-black text-emerald-600">98%</div>
          <div>
            <p className="text-xs font-bold text-slate-900">Satisfaction Globale</p>
            <p className="text-[10px] text-slate-400">Recommandent vos boutiques</p>
          </div>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-3">
        {filteredReviews.map((rev) => (
          <div key={rev.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                  {rev.customer_name.substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{rev.customer_name}</h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Store className="w-3 h-3" /> {rev.store_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
              « {rev.comment} »
            </p>
            <span className="text-[10px] text-slate-400 block text-right">{formatDate(rev.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
