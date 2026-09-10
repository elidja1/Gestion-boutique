'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  X,
  CheckCircle2,
  Share2,
  PlusSquare,
  MoreVertical,
  Laptop,
  ArrowRight,
} from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect user platform
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setPlatform('ios');
    } else if (/android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('✅ Service Worker PWA enregistré avec succès :', reg.scope);
        })
        .catch((err) => {
          console.error('❌ Erreur enregistrement Service Worker :', err);
        });
    }

    // Capture native PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if app is already running in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Listener for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowGuideModal(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setShowGuideModal(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Erreur lors du prompt PWA:', err);
        setShowGuideModal(true);
      }
    } else {
      // If browser doesn't support direct trigger (like iOS Safari or manual trigger), show guided modal
      setShowGuideModal(true);
    }
  };

  if (isInstalled || isDismissed) return null;

  return (
    <>
      {/* Top Notification Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-3 sm:px-4 py-2 text-xs flex items-center justify-between shadow-md relative z-40">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-blue-200" />
          </div>
          <p className="font-medium truncate">
            <strong className="font-black text-white">Application Vertu De Gloire Market</strong> :
            Installez-la sur votre téléphone ou PC pour un accès hors-ligne instantané !
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-800 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Installer l'App</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-blue-200 hover:text-white rounded-lg transition-colors"
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide Installation Modal (for iOS, Safari, or manual browser install) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">
                  🏪
                </div>
                <div>
                  <h3 className="text-base font-black">Installer Vertu De Gloire</h3>
                  <p className="text-[11px] text-blue-100">Application de Caisse & Gestion Multi-Boutiques</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-blue-200 hover:text-white rounded-xl bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with Platform Tabs */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                <button
                  onClick={() => setPlatform('android')}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                    platform === 'android' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Android / Chrome
                </button>
                <button
                  onClick={() => setPlatform('ios')}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                    platform === 'ios' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  iPhone / Safari
                </button>
                <button
                  onClick={() => setPlatform('desktop')}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                    platform === 'desktop' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  PC / Mac
                </button>
              </div>

              {/* Instructions based on platform */}
              {platform === 'android' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Ouvrez le menu de Chrome</p>
                      <p className="text-slate-500 text-[11px]">Appuyez sur les 3 points verticaux (⋮) en haut à droite de votre navigateur.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Appuyez sur « Installer l'application »</p>
                      <p className="text-slate-500 text-[11px]">(ou « Ajouter à l'écran d'accueil » selon votre version).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Validez l'installation</p>
                      <p className="text-slate-500 text-[11px]">L'icône Vertu De Gloire apparaîtra comme une vraie application sur votre écran d'accueil !</p>
                    </div>
                  </div>
                </div>
              )}

              {platform === 'ios' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        Bouton Partager <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                      </p>
                      <p className="text-slate-500 text-[11px]">Sur Safari, appuyez sur l'icône de partage en bas au centre.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        « Sur l'écran d'accueil » <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" />
                      </p>
                      <p className="text-slate-500 text-[11px]">Faites défiler vers le bas et sélectionnez cette option.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Appuyez sur « Ajouter »</p>
                      <p className="text-slate-500 text-[11px]">L'application s'ouvrira désormais en plein écran sans barre Safari.</p>
                    </div>
                  </div>
                </div>
              )}

              {platform === 'desktop' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Barre d'adresse Chrome / Edge</p>
                      <p className="text-slate-500 text-[11px]">Cliquez sur l'icône d'ordinateur avec une flèche (💻⬇️) à droite de l'URL.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Cliquez sur « Installer »</p>
                      <p className="text-slate-500 text-[11px]">L'application s'exécutera dans sa propre fenêtre indépendante sur votre bureau Windows/Mac.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Hors-Ligne & Rapide
                </span>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  J'ai compris
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
