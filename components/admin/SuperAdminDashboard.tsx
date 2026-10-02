'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { getSupabaseCredentials, resetSupabaseClient } from '@/lib/supabaseClient';
import { checkSupabaseHealth, DatabaseHealthReport, syncNotificationToSupabase } from '@/lib/supabaseSync';
import { registerPushNotification, sendTestPushNotification } from '@/lib/pushNotifications';
import { NotificationItem } from '@/lib/types';
import {
  ShieldAlert,
  Database,
  RefreshCw,
  Bell,
  CheckCircle2,
  XCircle,
  Zap,
  Code2,
  Play,
  Square,
  Trash2,
  ExternalLink,
  MonitorPlay,
} from 'lucide-react';

// Local storage key for the banner widget
const BANNER_STORAGE_KEY = 'vgm_superadmin_banner_v1';

export interface BannerConfig {
  isActive: boolean;
  html: string;
  css: string;
  js: string;
  title: string;
}

const DEFAULT_BANNER: BannerConfig = {
  isActive: false,
  title: 'Bannière Promotionnelle',
  html: `<div class="vgm-banner">
  <span class="vgm-banner-icon">🎉</span>
  <div>
    <strong>Information Importante !</strong>
    <p>Système de gestion boutique en ligne. Promotions et réductions par palier actives !</p>
  </div>
  <button class="vgm-banner-close" onclick="this.closest('.vgm-banner').remove()">✕</button>
</div>`,
  css: `.vgm-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #1e40af, #7c3aed);
  color: white;
  padding: 12px 20px;
  font-size: 13px;
  position: relative;
  animation: slidein 0.4s ease;
}
.vgm-banner strong { font-weight: 800; display: block; }
.vgm-banner p { margin: 2px 0 0; opacity: 0.85; }
.vgm-banner-icon { font-size: 22px; flex-shrink: 0; }
.vgm-banner-close {
  margin-left: auto;
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  border-radius: 8px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
}
@keyframes slidein { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`,
  js: `// Optionnel: code JavaScript`,
};

function loadBanner(): BannerConfig {
  if (typeof window === 'undefined') return DEFAULT_BANNER;
  try {
    const raw = localStorage.getItem(BANNER_STORAGE_KEY);
    if (raw) return { ...DEFAULT_BANNER, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_BANNER;
}

function saveBanner(config: BannerConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(config));
  }
}

export const SuperAdminDashboard: React.FC = () => {
  const {
    state,
    syncWithSupabase,
    currentUser,
  } = useAppStore();

  // --- Supabase Connection ---
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthReport, setHealthReport] = useState<DatabaseHealthReport | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // --- Push Notifications ---
  const [pushTitle, setPushTitle] = useState('📢 Message de la Direction VGM');
  const [pushBody, setPushBody] = useState('Nouvelle instruction importante de la Direction. Merci de consulter votre responsable.');
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  // --- HTML Banner ---
  const [banner, setBanner] = useState<BannerConfig>(DEFAULT_BANNER);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [isBannerSaved, setIsBannerSaved] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setUrl(creds.url);
    setAnonKey(creds.anonKey);
    setBanner(loadBanner());
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const report = await checkSupabaseHealth();
      setHealthReport(report);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    resetSupabaseClient(url, anonKey);
    setIsSaved(true);
    runHealthCheck();
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    const res = await syncWithSupabase();
    setIsSyncing(false);
    if (res.success) {
      setSyncMessage('✅ Synchronisation réussie ! Toutes les tables sont à jour.');
      runHealthCheck();
    } else {
      setSyncMessage('⚠️ Synchronisation terminée avec avertissement. Mode hors-ligne actif.');
    }
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleEnablePush = async () => {
    setIsRegisteringPush(true);
    const res = await registerPushNotification(currentUser.id, currentUser.full_name);
    setPushFeedback(res.message);
    setIsRegisteringPush(false);
    setTimeout(() => setPushFeedback(null), 5000);
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingPush(true);
    const res = await sendTestPushNotification(pushTitle, pushBody);
    setPushFeedback(res.message);
    setIsSendingPush(false);
    setTimeout(() => setPushFeedback(null), 5000);
  };

  const BANNER_UUID = '00000000-0000-4000-8000-0000000000bb';

  const broadcastBannerToSupabase = async (config: BannerConfig) => {
    try {
      await syncNotificationToSupabase({
        id: BANNER_UUID,
        title: 'SYSTEM_BANNER',
        message: JSON.stringify(config),
        type: 'SYSTEM_BANNER' as any,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to broadcast banner to Supabase:', e);
    }
  };

  const handleBannerChange = (field: keyof BannerConfig, value: string | boolean) => {
    setBanner((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBanner = async () => {
    saveBanner(banner);
    setIsBannerSaved(true);
    window.dispatchEvent(new CustomEvent('vgm-banner-update', { detail: banner }));
    await broadcastBannerToSupabase(banner);
    setTimeout(() => setIsBannerSaved(false), 2500);
  };

  const handleToggleBanner = async () => {
    const updated = { ...banner, isActive: !banner.isActive };
    setBanner(updated);
    saveBanner(updated);
    window.dispatchEvent(new CustomEvent('vgm-banner-update', { detail: updated }));
    await broadcastBannerToSupabase(updated);
  };

  const handleResetBanner = async () => {
    setBanner(DEFAULT_BANNER);
    saveBanner(DEFAULT_BANNER);
    window.dispatchEvent(new CustomEvent('vgm-banner-update', { detail: DEFAULT_BANNER }));
    await broadcastBannerToSupabase(DEFAULT_BANNER);
  };

  const renderPreview = () => {
    return `
      <html><head>
        <style>* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui; } ${banner.css}</style>
      </head><body>
        ${banner.html}
        <script>${banner.js}<\/script>
      </body></html>
    `;
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-4 right-8 text-[180px] leading-none select-none">🛠️</div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              Console Développeur Super Admin
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Panneau de Contrôle Technique
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              Espace réservé au développeur. Gérez la connexion Supabase, diffusez des notifications Push et activez des bannières HTML sur l'interface principale.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runHealthCheck}
              disabled={isCheckingHealth}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-indigo-400' : ''}`} />
              {isCheckingHealth ? 'Vérification...' : 'Tester DB'}
            </button>
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/30"
            >
              <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Forcer Sync'}
            </button>
          </div>
        </div>
        {syncMessage && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-900/60 border border-indigo-500/40 text-xs text-indigo-200 font-semibold">
            {syncMessage}
          </div>
        )}
      </div>

      {/* ── Section 1: Supabase Connector ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900">Connexion Supabase PostgreSQL</h2>
            <p className="text-xs text-slate-500">Modifiez l'URL et la clé API sans toucher au code</p>
          </div>
          <div className="flex items-center gap-2">
            {healthReport && (
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                healthReport.isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {healthReport.isConnected
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Connecté</>
                  : <><XCircle className="w-3 h-3" />Hors ligne</>}
              </span>
            )}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Dashboard
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <form onSubmit={handleSaveCredentials} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Project URL <span className="font-normal text-slate-400">(NEXT_PUBLIC_SUPABASE_URL)</span>
              </label>
              <input
                type="text"
                placeholder="https://xyz.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Anon Key <span className="font-normal text-slate-400">(NEXT_PUBLIC_SUPABASE_ANON_KEY)</span>
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* DB Table counts */}
          {healthReport?.isConnected && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
              {Object.entries(healthReport.tableCounts).map(([table, count]) => (
                <div key={table} className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                  <p className="text-[9px] font-mono font-bold text-slate-400 uppercase truncate" title={table}>{table.replace('_', ' ')}</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">{count}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">🔒 Stocké localement dans le profil développeur</p>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 text-xs"
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              {isSaved ? 'Enregistré !' : 'Enregistrer la Connexion'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Section 2: PWA Push Notifications ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900">Notifications Web Push (PWA)</h2>
            <p className="text-xs text-slate-500">Diffusez des messages à tous les terminaux abonnés</p>
          </div>
          <button
            onClick={handleEnablePush}
            disabled={isRegisteringPush}
            className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-xs font-bold transition-all"
          >
            {isRegisteringPush ? 'Activation...' : "S'abonner aux Push"}
          </button>
        </div>

        <form onSubmit={handleSendPush} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre</label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Corps du message</label>
              <input
                type="text"
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Preview bubble */}
          <div className="bg-slate-900 rounded-2xl p-4 flex items-start gap-3 text-white text-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">VG</div>
            <div>
              <p className="font-bold text-sm">{pushTitle || 'Titre...'}</p>
              <p className="text-slate-400 mt-0.5 leading-snug">{pushBody || 'Corps du message...'}</p>
            </div>
          </div>

          {pushFeedback && (
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium">
              {pushFeedback}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Service Worker actif • VAPID PWA</span>
            <button
              type="submit"
              disabled={isSendingPush}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 text-xs"
            >
              <Bell className="w-4 h-4" />
              {isSendingPush ? 'Émission...' : 'Envoyer Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Section 3: HTML Banner Widget ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900">Bannière HTML / CSS / JS — Page Principale</h2>
            <p className="text-xs text-slate-500">
              Injectez un message ou une promotion qui s'affiche en haut de l'interface pour tous les utilisateurs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBanner}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                banner.isActive
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {banner.isActive ? <><Square className="w-3.5 h-3.5" />Désactiver</> : <><Play className="w-3.5 h-3.5" />Activer</>}
            </button>
            <button
              onClick={handleResetBanner}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              title="Réinitialiser"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Status Pill */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border w-fit ${
            banner.isActive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${banner.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {banner.isActive ? '✅ Bannière ACTIVE — visible par tous les utilisateurs' : '⏸ Bannière INACTIVE — masquée de l\'interface'}
          </div>

          {/* Banner Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom / Description (interne)</label>
            <input
              type="text"
              value={banner.title}
              onChange={(e) => handleBannerChange('title', e.target.value)}
              placeholder="Ex: Promotion Fête Nationale"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Code editor tabs */}
          <div>
            <div className="flex items-center gap-1 mb-3 bg-slate-100 p-1 rounded-xl w-fit">
              {(['html', 'css', 'js'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${
                    activeTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <textarea
              rows={8}
              value={banner[activeTab] as string}
              onChange={(e) => handleBannerChange(activeTab, e.target.value)}
              spellCheck={false}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-emerald-300 outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
              placeholder={
                activeTab === 'html' ? '<div class="banner">Votre message ici...</div>' :
                activeTab === 'css' ? '.banner { background: #1e40af; color: white; }' :
                '// JavaScript optionnel'
              }
            />
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MonitorPlay className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Aperçu en direct</span>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <iframe
                srcDoc={renderPreview()}
                title="banner-preview"
                className="w-full h-32 bg-white"
                sandbox="allow-scripts"
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              💡 Les modifications s'appliquent en temps réel après enregistrement
            </p>
            <button
              onClick={handleSaveBanner}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 text-xs"
            >
              {isBannerSaved ? <CheckCircle2 className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
              {isBannerSaved ? 'Enregistré & Diffusé sur tous les appareils !' : 'Enregistrer & Diffuser la Bannière'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

