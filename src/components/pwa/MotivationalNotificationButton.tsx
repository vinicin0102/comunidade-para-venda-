import { useState, useEffect } from 'react';
import despia from 'despia-native';
import { Bell, Sparkles } from 'lucide-react';

interface MotivationalMessage {
    id: string;
    title: string;
    body: string;
}

const DEFAULT_MESSAGES: MotivationalMessage[] = [
    { id: '1', title: "Você está no caminho certo! 🚀", body: "Continue focado, cada passo conta!" },
    { id: '2', title: "Hora de brilhar! ✨", body: "Sua dedicação vai te levar longe!" },
    { id: '3', title: "Não desista! 💪", body: "Os melhores resultados vêm com persistência." },
    { id: '4', title: "Você é incrível! 🌟", body: "Acredite no seu potencial ilimitado!" },
    { id: '5', title: "Foco total! 🎯", body: "Mantenha os olhos no objetivo!" },
    { id: '6', title: "Energia positiva! ⚡", body: "Hoje é dia de fazer acontecer!" },
    { id: '7', title: "Momento de ação! 🔥", body: "Transforme seus sonhos em realidade!" },
    { id: '8', title: "Você consegue! 🏆", body: "Campeões nunca desistem!" },
    { id: '9', title: "Inspire-se! 💡", body: "Cada dia é uma nova oportunidade!" },
    { id: '10', title: "Vamos juntos! 🤝", body: "A comunidade está com você!" },
    { id: '11', title: "Supere seus limites! 🦅", body: "Você é mais forte do que imagina!" },
    { id: '12', title: "Acredite mais! 💎", body: "Seu esforço será recompensado!" },
    { id: '13', title: "Momento de crescer! 🌱", body: "Evolua um pouco mais hoje!" },
    { id: '14', title: "Você é especial! ⭐", body: "Sua jornada é única e valiosa!" },
    { id: '15', title: "Continue firme! 🛡️", body: "A consistência é a chave do sucesso!" },
];

function getMessages(): MotivationalMessage[] {
    const saved = localStorage.getItem('motivational_messages');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return DEFAULT_MESSAGES;
        }
    }
    return DEFAULT_MESSAGES;
}

function getRandomMessage(): MotivationalMessage {
    const messages = getMessages();
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
}

export function MotivationalNotificationButton() {
    const [isScheduled, setIsScheduled] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const scheduleNotification = async () => {
        if (isScheduled) return;

        // Trigger haptic feedback
        try {
            despia('lighthaptic://');
        } catch (e) {
            // Silently fail if not in native environment
        }

        setIsScheduled(true);
        setCountdown(5);

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Schedule notification for 5 seconds
        setTimeout(async () => {
            const message = getRandomMessage();

            // Try despia native notification first
            try {
                // despia localpush format: localpush://title/body
                const encodedTitle = encodeURIComponent(message.title);
                const encodedBody = encodeURIComponent(message.body);
                await despia(`localpush://${encodedTitle}/${encodedBody}`);
                despia('mediumhaptic://');
            } catch (e) {
                // Fallback to Web Notification API
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(message.title, {
                        body: message.body,
                        icon: '/pwa-192x192.png',
                        badge: '/pwa-192x192.png',
                    });
                } else if ('Notification' in window && Notification.permission !== 'denied') {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        new Notification(message.title, {
                            body: message.body,
                            icon: '/pwa-192x192.png',
                        });
                    }
                }
            }

            setIsScheduled(false);
        }, 5000);
    };

    return (
        <button
            onClick={scheduleNotification}
            disabled={isScheduled}
            className={`
        flex items-center justify-center gap-2 
        px-4 py-3 rounded-xl 
        font-medium text-sm
        transition-all duration-300
        ${isScheduled
                    ? 'bg-primary/20 text-primary cursor-wait'
                    : 'bg-gradient-to-r from-primary to-orange-500 text-white hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                }
      `}
        >
            {isScheduled ? (
                <>
                    <div className="animate-pulse">
                        <Sparkles size={18} />
                    </div>
                    <span>Notificação em {countdown}s...</span>
                </>
            ) : (
                <>
                    <Bell size={18} />
                    <span>Receber Motivação</span>
                </>
            )}
        </button>
    );
}
