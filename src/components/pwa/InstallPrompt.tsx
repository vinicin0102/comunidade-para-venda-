import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share2, Plus, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useCommunityName } from '@/hooks/useAppTheme';

export function InstallPrompt() {
  const { 
    isInstallable, 
    isInstalled, 
    promptInstall, 
    isIOS, 
    isAndroid, 
    isStandalone,
    isOnline,
    displayMode 
  } = usePWAInstall();
  const communityName = useCommunityName();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Não mostrar se já está instalado
    if (isInstalled || isStandalone) {
      setShowPrompt(false);
      return;
    }

    // Verificar se já foi dispensado
    const dismissedKey = 'pwa-install-dismissed';
    const dismissedTime = localStorage.getItem(dismissedKey);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (dismissedTime && parseInt(dismissedTime) > oneDayAgo) {
      setDismissed(true);
      setShowPrompt(false);
      return;
    }

    // Mostrar prompt após 3 segundos
    const timer = setTimeout(() => {
      if (isInstallable || isIOS || isAndroid) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isStandalone, isIOS, isAndroid]);

  const handleInstall = async () => {
    if (isInstallable) {
      const installed = await promptInstall();
      if (installed) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || dismissed || isInstalled || isStandalone) {
    return null;
  }

  // Instruções para iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
        <Card className="border-2 border-primary bg-[#1a1a1a] shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Instalar no iPhone
                {!isOnline && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-sm">
              Instale a {communityName} no seu iPhone para acesso rápido e melhor experiência!
            </p>
            <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3 text-sm">
              <p className="text-white font-semibold flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                Passo a passo:
              </p>
              <ol className="text-gray-300 space-y-2 list-decimal list-inside ml-2">
                <li>Toque no botão <span className="font-semibold text-primary">Compartilhar</span> <Share2 className="h-3 w-3 inline" /> na barra inferior do Safari</li>
                <li>Role para baixo e encontre <span className="font-semibold text-primary">"Adicionar à Tela de Início"</span></li>
                <li>Toque e personalize o nome (opcional)</li>
                <li>Toque em <span className="font-semibold text-primary">"Adicionar"</span> no canto superior direito</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDismiss}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Entendi!
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                Depois
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prompt para Android/Chrome
  if (isInstallable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
        <Card className="border-2 border-primary bg-[#1a1a1a] shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Instalar App
                {isOnline ? (
                  <Badge variant="outline" className="ml-2 text-xs border-green-500 text-green-500">
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-500">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-sm">
              Instale a {communityName} no seu dispositivo Android para:
            </p>
            <ul className="text-gray-300 text-sm space-y-1.5 list-disc list-inside ml-2">
              <li>Acesso rápido direto da tela inicial</li>
              <li>Notificações push em tempo real</li>
              <li>Funcionamento offline</li>
              <li>Melhor performance e experiência nativa</li>
            </ul>
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!isOnline}
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar Agora
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                Depois
              </Button>
            </div>
            {!isOnline && (
              <p className="text-xs text-yellow-500 text-center">
                ⚠️ Conecte-se à internet para instalar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Instruções genéricas para Android (quando não há prompt nativo)
  if (isAndroid) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
        <Card className="border-2 border-primary bg-[#1a1a1a] shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Instalar no Android
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-sm">
              Instale a {communityName} para acesso rápido e melhor experiência!
            </p>
            <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3 text-sm">
              <p className="text-white font-semibold flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                Como instalar:
              </p>
              <ol className="text-gray-300 space-y-2 list-decimal list-inside ml-2">
                <li>Toque no menu <span className="font-semibold text-primary">⋮</span> (três pontos) no canto superior direito do Chrome</li>
                <li>Procure por <span className="font-semibold text-primary">"Adicionar à tela inicial"</span> ou <span className="font-semibold text-primary">"Instalar app"</span></li>
                <li>Toque e confirme a instalação</li>
                <li>O app aparecerá na sua tela inicial!</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDismiss}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Entendi!
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                Depois
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

