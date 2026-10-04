'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { getSupabaseCredentials, resetSupabaseClient } from '@/lib/supabaseClient';
import { checkSupabaseHealth, DatabaseHealthReport, syncNotificationToSupabase } from '@/lib/supabaseSync';
import { registerPushNotification, sendTestPushNotification } from '@/lib/pushNotifications';
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
  LayoutTemplate,
  Layers,
  Sparkles,
  Eye,
  X,
} from 'lucide-react';

// Local storage key for the custom HTML widget/modal/banner
const BANNER_STORAGE_KEY = 'vgm_superadmin_banner_v1';

export interface BannerConfig {
  isActive: boolean;
  displayMode: 'modal' | 'banner' | 'both';
  targetAudience: 'ALL' | 'SELLER' | 'MANAGER' | 'OWNER';
  title: string;
  modalTitle: string;
  modalWidth: 'sm' | 'md' | 'lg' | 'full';
  html: string;
  css: string;
  js: string;
}

const DEFAULT_BANNER: BannerConfig = {
  isActive: false,
  displayMode: 'modal',
  targetAudience: 'ALL',
  title: 'Annonce Modale Direction',
  modalTitle: '📢 Message Spécial de la Direction',
  modalWidth: 'md',
  html: `<div class="vgm-modal-card">
  <div class="vgm-badge">NOUVEAU</div>
  <h2>🎉 Offres Promotionnelles & Tarifs par Palier</h2>
  <p>Chers collaborateurs, les nouveaux tarifs dégressifs par quantité et au carton sont maintenant activés sur le module caisse (POS).</p>
  <div class="vgm-feature-list">
    <div class="vgm-feature-item">✅ Réductions automatiques par volume</div>
    <div class="vgm-feature-item">✅ Synchronisation temps réel multi-boutiques</div>
    <div class="vgm-feature-item">✅ Impression ticket thermique & facture</div>
  </div>
  <button class="vgm-btn-confirm" onclick="parent.postMessage('close-vgm-modal', '*')">J'ai compris & continuer</button>
</div>`,
  css: `body {
  font-family: system-ui, -apple-system, sans-serif;
  color: #0f172a;
  background: transparent;
  padding: 10px;
}
.vgm-modal-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}
.vgm-badge {
  display: inline-block;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 800;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}
h2 {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 8px;
}
p {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 16px;
}
.vgm-feature-list {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vgm-btn-confirm {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  font-weight: 800;
  font-size: 13px;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}
.vgm-btn-confirm:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}`,
  js: `// Gestion des clics et animations
console.log('VGM Custom Widget Loaded');`,
};

const PRESET_BANNER: BannerConfig = {
  isActive: true,
  displayMode: 'banner',
  targetAudience: 'ALL',
  title: 'Bannière Flash Header',
  modalTitle: 'Bannière Flash',
  modalWidth: 'full',
  html: `<div class="vgm-banner">
  <span class="vgm-banner-icon">⚡</span>
  <div>
    <strong>Avis important du Système :</strong>
    <p>Inventaire centralisé en cours ce soir. Clôturez vos caisses à l'heure.</p>
  </div>
</div>`,
  css: `.vgm-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: white;
  padding: 10px 20px;
  font-size: 12px;
  border-bottom: 2px solid #3b82f6;
}
.vgm-banner strong { font-weight: 800; }
.vgm-banner p { opacity: 0.85; margin: 0; }
.vgm-banner-icon { font-size: 20px; }`,
  js: '',
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
  const { state, syncWithSupabase, currentUser } = useAppStore();

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

  // --- HTML / CSS / JS Widget & Modal ---
  const [banner, setBanner] = useState<BannerConfig>(DEFAULT_BANNER);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [isBannerSaved, setIsBannerSaved] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

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
      console.warn('Failed to broadcast widget to Supabase:', e);
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

  const handleLoadPresetModal = () => {
    setBanner({ ...DEFAULT_BANNER, isActive: true });
  };

  const handleLoadPresetBanner = () => {
    setBanner({ ...PRESET_BANNER, isActive: true });
  };

  const renderPreviewDoc = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; }
            ${banner.css}
          </style>
        </head>
        <body>
          ${banner.html}
          <script>${banner.js}<\/script>
        </body>
      </html>
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
              Espace réservé au développeur. Gérez la connexion Supabase, testez les modifications de boutiques et diffusez des fenêtres modales HTML en temps réel.
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
            <p className="text-xs text-slate-500">Supervisez l'état des tables et la connectivité temps réel</p>
          </div>
          <div className="flex items-center gap-2">
            {healthReport && (
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  healthReport.isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {healthReport.isConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connecté à Supabase
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Hors ligne
                  </>
                )}
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
                  <p className="text-[9px] font-mono font-bold text-slate-400 uppercase truncate" title={table}>
                    {table.replace('_', ' ')}
                  </p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">{count}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">🔒 Stocké de façon persistante dans le profil développeur</p>
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

      {/* ── Section 2: Custom HTML / CSS / JS — Modale & Bannière Dialog ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900">Éditeur HTML / CSS / JS — Fenêtre Modale & Popup</h2>
            <p className="text-xs text-slate-500">
              Injectez un message, une modale popup ou une bannière interactive sur l'application
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
              {banner.isActive ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  Désactiver
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Activer
                </>
              )}
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

        <div className="p-6 space-y-5">
          {/* Status & Quick Templates */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                banner.isActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${banner.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              {banner.isActive
                ? `✅ Widget ACTIF — Affichage : ${banner.displayMode.toUpperCase()} (${banner.targetAudience})`
                : '⏸ Widget INACTIF — Masqué de l’application'}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Modèles prêts :</span>
              <button
                type="button"
                onClick={handleLoadPresetModal}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                Template Modale Popup
              </button>
              <button
                type="button"
                onClick={handleLoadPresetBanner}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                Template Bannière Top
              </button>
            </div>
          </div>

          {/* Configuration Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mode d'Affichage *</label>
              <select
                value={banner.displayMode || 'modal'}
                onChange={(e) => handleBannerChange('displayMode', e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="modal">🪟 Fenêtre Modale (Popup Dialog avec Overlay)</option>
                <option value="banner">📢 Bannière Flottante (Haut d'écran)</option>
                <option value="both">✨ Les Deux (Modale + Bannière)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Public Cible *</label>
              <select
                value={banner.targetAudience || 'ALL'}
                onChange={(e) => handleBannerChange('targetAudience', e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">👥 Tous les Utilisateurs (Caissiers, Gérants, Admin)</option>
                <option value="SELLER">🛒 Uniquement les Vendeurs / Caissiers</option>
                <option value="MANAGER">👨‍💼 Uniquement les Gérants</option>
                <option value="OWNER">👑 Uniquement les Administrateurs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre Barre Modale</label>
              <input
                type="text"
                value={banner.modalTitle || ''}
                onChange={(e) => handleBannerChange('modalTitle', e.target.value)}
                placeholder="Ex: Message Important de la Direction"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Code editor tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
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

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Tester la Modale Plein Écran</span>
              </button>
            </div>

            <textarea
              rows={9}
              value={banner[activeTab] as string}
              onChange={(e) => handleBannerChange(activeTab, e.target.value)}
              spellCheck={false}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-emerald-300 outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
              placeholder={
                activeTab === 'html'
                  ? '<div class="vgm-modal-card">Votre contenu HTML ici...</div>'
                  : activeTab === 'css'
                  ? '.vgm-modal-card { background: white; padding: 20px; }'
                  : '// JavaScript'
              }
            />
          </div>

          {/* Live Preview Container */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MonitorPlay className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Aperçu en direct (Sandbox)</span>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 p-4 flex justify-center items-center min-h-[160px]">
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200">
                <iframe
                  srcDoc={renderPreviewDoc()}
                  title="widget-preview"
                  className="w-full h-56 bg-transparent border-0"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>

          {/* Save / Broadcast Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              💡 Les modifications s'appliquent immédiatement sur l'application de tous les collaborateurs
            </p>
            <button
              onClick={handleSaveBanner}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 text-xs"
            >
              {isBannerSaved ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {isBannerSaved ? 'Enregistré & Diffusé avec Succès !' : 'Enregistrer & Diffuser sur l’App'}
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Test Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">{banner.modalTitle || 'Aperçu Modale'}</h3>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <iframe
                srcDoc={renderPreviewDoc()}
                title="preview-modal-live"
                className="w-full min-h-[260px] border-0"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Section 3: Web Push Notifications ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900">Notifications Web Push (PWA)</h2>
            <p className="text-xs text-slate-500">Diffusez des alertes instantanées sur les écrans</p>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre Notification</label>
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

          {pushFeedback && (
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium">
              {pushFeedback}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Service Worker actif • Protocole VAPID PWA</span>
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
    </div>
  );
};
