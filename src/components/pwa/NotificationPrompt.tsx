import { useState } from 'react';
import { useOneSignal } from '@/hooks/useOneSignal';
import { Bell, BellOff, X } from 'lucide-react';

export function NotificationPrompt() {
    const { isSubscribed, isSupported, requestPermission } = useOneSignal();
    const [dismissed, setDismissed] = useState(false);

    // Don't show if not supported, already subscribed, or dismissed
    if (!isSupported || isSubscribed || dismissed) {
        return null;
    }

    // Check if already dismissed in this session
    if (sessionStorage.getItem('notification-prompt-dismissed')) {
        return null;
    }

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem('notification-prompt-dismissed', 'true');
    };

    const handleEnable = async () => {
        await requestPermission();
        setDismissed(true);
    };

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-[#1a1a1a] to-[#252525] border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/20 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>

            <div className="flex items-start gap-3">
                <div className="bg-primary/20 rounded-full p-2.5">
                    <Bell className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm mb-1">
                        Ative as notificações
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed mb-3">
                        Receba alertas sobre novos conteúdos, atualizações do ranking e promoções exclusivas.
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={handleEnable}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Bell size={14} />
                            Ativar
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                            <BellOff size={14} />
                            Agora não
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
