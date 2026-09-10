'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseCredentials, resetSupabaseClient } from '@/lib/supabaseClient';
import { Database, Key, Copy, Check, ExternalLink, ShieldCheck, Terminal } from 'lucide-react';

export const SupabaseConfig: React.FC = () => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setUrl(creds.url);
    setAnonKey(creds.anonKey);
  }, []);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    resetSupabaseClient(url, anonKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopySQL = async () => {
    try {
      const res = await fetch('/schema.sql');
      // If fetched or fallback from embedded text
      const sqlText = `-- ==============================================================================
-- 🏪 MULTI-SHOP BOUTIQUE MANAGEMENT SYSTEM (VERTU DE GLOIRE MARKET)
-- SUPABASE POSTGRESQL DATABASE SCHEMA
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    ifu VARCHAR(50),
    rccm VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'FCFA',
    invoice_footer_message TEXT DEFAULT 'Merci pour votre confiance !',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Cotonou',
    phone VARCHAR(50),
    manager_name VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    level INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    code VARCHAR(30) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(50),
    monthly_sales_target NUMERIC(12, 2) DEFAULT 1500000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    unit VARCHAR(50) DEFAULT 'Pièce',
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    promo_price NUMERIC(12, 2),
    min_stock_alert INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    UNIQUE(product_id, store_id)
);

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(50) UNIQUE,
    loyalty_points INT DEFAULT 0,
    total_spent NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT,
    seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    change_returned NUMERIC(14, 2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    source_store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT,
    destination_store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    session_code VARCHAR(50) NOT NULL UNIQUE,
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    closing_balance_system NUMERIC(14, 2),
    closing_balance_real NUMERIC(14, 2),
    discrepancy NUMERIC(14, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'OPEN',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    expense_code VARCHAR(50) NOT NULL UNIQUE,
    amount NUMERIC(14, 2) NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.companies FOR ALL USING (true);
CREATE POLICY "Public full access on stores" ON public.stores FOR ALL USING (true);
CREATE POLICY "Public full access on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Public full access on sales" ON public.sales FOR ALL USING (true);
`;
      await navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Supabase Connection Manager */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Connexion Supabase PostgreSQL
              </h3>
              <p className="text-xs text-slate-500">
                Connectez votre projet Supabase en renseignant l'URL et la clé anonyme (Anon Key)
              </p>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <span>Console Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Project URL (NEXT_PUBLIC_SUPABASE_URL)
            </label>
            <input
              type="text"
              placeholder="https://votre-projet.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Anon Public API Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Stockage sécurisé local & Variables d'environnement supportées</span>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              <span>{isSaved ? 'Connexion Sauvegardée !' : 'Enregistrer la Connexion'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SQL Migration Script Copy Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Script SQL Complet pour Supabase</h3>
              <p className="text-xs text-slate-400">
                Fichier disponible dans le projet : <code className="text-blue-300 font-bold">supabase/schema.sql</code>
              </p>
            </div>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'SQL Copié dans le Presse-papier !' : 'Copier le Code SQL'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-2 leading-relaxed">
          <p className="font-bold text-white">📋 Instructions d'Exécution sur Supabase :</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Ouvrez votre projet sur <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 underline">supabase.com</a>.</li>
            <li>Rendez-vous dans la section <strong>SQL Editor</strong> dans le menu latéral gauche.</li>
            <li>Créez une <strong>New Query</strong>, collez le contenu du fichier <code className="text-blue-300">supabase/schema.sql</code> et cliquez sur <strong>RUN</strong>.</li>
            <li>Toutes les tables (boutiques, stocks, caisses, ventes, rôles, employés) et données initiales sont créées instantanément !</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
