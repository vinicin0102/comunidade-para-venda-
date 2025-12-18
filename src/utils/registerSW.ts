// Registrar Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Limpar caches antigos primeiro
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes('nutra-elite') || cacheName.includes('v1')) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            caches.delete(cacheName);
          }
        });
      });
    }

    // Registrar imediatamente, não esperar pelo load
    // Verificar se o arquivo existe antes de registrar
    fetch('/sw.js', { method: 'HEAD' })
      .then(() => {
        return navigator.serviceWorker.register('/sw.js', { scope: '/' });
      })
      .then((registration) => {
        console.log('[SW] Service Worker registrado com sucesso:', registration.scope);
        
        // Forçar atualização imediata
        registration.update();

        // Verificar se há atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                console.log('[SW] Nova versão disponível!');
                // Não mostrar prompt automático, apenas log
              } else if (newWorker.state === 'activated') {
                // Service worker ativado
                console.log('[SW] Service Worker ativado');
              }
            });
          }
        });

        // Verificar atualizações periodicamente
        setInterval(() => {
          registration.update().catch((err) => {
            console.warn('[SW] Erro ao verificar atualizações:', err);
          });
        }, 60 * 60 * 1000); // 1 hora
      })
      .catch((error) => {
        // Ignorar erro se o arquivo não existir
        if (error.message?.includes('404') || error.message?.includes('Failed to fetch')) {
          console.log('[SW] Service Worker não encontrado, continuando sem PWA');
        } else {
          console.error('[SW] Erro ao registrar Service Worker:', error);
        }
        // Não bloquear a aplicação se o SW falhar
      });

    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        window.location.reload();
      }
    });

    // Listener para erros do Service Worker
    navigator.serviceWorker.addEventListener('error', (error) => {
      console.error('[SW] Erro no Service Worker:', error);
    });
  } else {
    console.warn('[SW] Service Workers não são suportados neste navegador');
  }
}

