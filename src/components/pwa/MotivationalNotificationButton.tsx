import { useState } from 'react';
import despia from 'despia-native';
import { Bell, Sparkles } from 'lucide-react';

const MOTIVATIONAL_MESSAGES = [
    { title: "Você está no caminho certo! 🚀", body: "Continue focado, cada passo conta!" },
    { title: "Hora de brilhar! ✨", body: "Sua dedicação vai te levar longe!" },
    { title: "Não desista! 💪", body: "Os melhores resultados vêm com persistência." },
    { title: "Você é incrível! 🌟", body: "Acredite no seu potencial ilimitado!" },
    { title: "Foco total! 🎯", body: "Mantenha os olhos no objetivo!" },
    { title: "Energia positiva! ⚡", body: "Hoje é dia de fazer acontecer!" },
    { title: "Momento de ação! 🔥", body: "Transforme seus sonhos em realidade!" },
    { title: "Você consegue! 🏆", body: "Campeões nunca desistem!" },
    { title: "Inspire-se! 💡", body: "Cada dia é uma nova oportunidade!" },
    { title: "Vamos juntos! 🤝", body: "A comunidade está com você!" },
    { title: "Supere seus limites! 🦅", body: "Você é mais forte do que imagina!" },
    { title: "Acredite mais! 💎", body: "Seu esforço será recompensado!" },
    { title: "Momento de crescer! 🌱", body: "Evolua um pouco mais hoje!" },
    { title: "Você é especial! ⭐", body: "Sua jornada é única e valiosa!" },
    { title: "Continue firme! 🛡️", body: "A consistência é a chave do sucesso!" },
];

function getRandomMessage() {
    const index = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    return MOTIVATIONAL_MESSAGES[index];
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
