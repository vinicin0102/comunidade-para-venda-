import { useState, useEffect } from 'react';

export interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  canInstall: boolean;
  displayMode: 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';
}

export function usePWAStatus(): PWAStatus {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    canInstall: false,
    displayMode: 'browser',
  });

  useEffect(() => {
    // Detectar plataforma
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Detectar modo standalone
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    // Detectar display mode
    let displayMode: 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' = 'browser';
    if (window.matchMedia('(display-mode: standalone)').matches) {
      displayMode = 'standalone';
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      displayMode = 'minimal-ui';
    } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
      displayMode = 'fullscreen';
    }

    // Detectar se pode instalar
    let canInstall = false;
    if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
      canInstall = true;
    }

    setStatus({
      isInstalled: isStandalone,
      isStandalone,
      isIOS,
      isAndroid,
      isOnline: navigator.onLine,
      hasUpdate: false, // Será atualizado pelo service worker
      canInstall,
      displayMode,
    });

    // Listener para mudanças de conexão
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener para atualizações do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setStatus(prev => ({ ...prev, hasUpdate: true }));
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

