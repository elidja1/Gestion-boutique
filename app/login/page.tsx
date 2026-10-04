'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Crown,
  ShoppingCart,
  Eye,
  EyeOff,
  Store as StoreIcon,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { state, login } = useAppStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'ADMIN' | 'SELLER'>('ADMIN');

  // If already authenticated, redirect to main application
  useEffect(() => {
    let isAuth = state.isAuthenticated;
    if (typeof window !== 'undefined' && !isAuth) {
      try {
        const authRaw = localStorage.getItem('vgm_auth_session_v4');
        if (authRaw) {
          isAuth = JSON.parse(authRaw).isAuthenticated === true;
        }
      } catch {}
    }
    if (isAuth) {
      router.replace('/');
    }
  }, [state.isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Veuillez renseigner tous les champs.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await login(identifier, password);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleQuickFill = (id: string, pass: string, mode: 'ADMIN' | 'SELLER') => {
    setIdentifier(id);
    setPassword(pass);
    setLoginMode(mode);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Background Decorative Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* Brand Header */}
        <div className="p-8 pb-6 border-b border-slate-800/80 bg-linear-to-b from-slate-800/50 to-transparent">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25">
              VG
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Vertu De Gloire</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                  POS
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Système de Gestion Commerciale & Stocks Multi-Boutiques
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 mx-8 mt-6 bg-slate-950/60 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setLoginMode('ADMIN');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'ADMIN'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Admin / Direction</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('SELLER');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'SELLER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Vendeur / Caisse</span>
          </button>
        </div>

        {/* Form Area */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-2xl animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-2xl">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Identifier Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {loginMode === 'ADMIN' ? 'Identifiant / Email Administrateur' : 'Code Vendeur ou Email'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder={loginMode === 'ADMIN' ? 'admin ou email' : 'Code caissier (ex: EMP-01 ou vendeur)'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password or PIN Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {loginMode === 'ADMIN' ? 'Mot de passe' : 'Code PIN Caisse ou Mot de passe'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={loginMode === 'ADMIN' ? '••••••••' : 'Code PIN (ex: 1234)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 mt-3 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 ${
                loginMode === 'ADMIN'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
              }`}
            >
              <span>{isLoading ? 'Connexion en cours...' : 'Accéder à la plateforme'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Quick Credentials Assistant */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Comptes de démonstration préconfigurés :</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin', 'ADMIN')}
                className="p-2.5 text-left rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 transition-all group"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 group-hover:text-amber-300">
                  <Crown className="w-3 h-3" />
                  <span>Admin / DG</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  admin / admin
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('vendeur', '1234', 'SELLER')}
                className="p-2.5 text-left rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 transition-all group"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
                  <ShoppingCart className="w-3 h-3" />
                  <span>Vendeur Caisse</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  vendeur / 1234
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 text-center border-t border-slate-800/80 text-[11px] text-slate-500">
          Système Sécurisé Vertu De Gloire Market &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
