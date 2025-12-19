import { useEffect, useState } from 'react';

const ONESIGNAL_APP_ID = '3260a824-ee35-4a20-bb87-d14e7ba0cd1b';

declare global {
    interface Window {
        OneSignalDeferred?: Array<(OneSignal: any) => void>;
    }
}

export function useOneSignal() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            setIsSupported(false);
            return;
        }

        // Load OneSignal SDK
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        document.head.appendChild(script);

        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function (OneSignal: any) {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                safari_web_id: undefined,
                notifyButton: {
                    enable: false, // We'll use our own UI
                },
                allowLocalhostAsSecureOrigin: true, // For development
            });

            // Check initial subscription state
            const permission = await OneSignal.Notifications.permission;
            setIsSubscribed(permission);

            // Listen for permission changes
            OneSignal.Notifications.addEventListener('permissionChange', (granted: boolean) => {
                setIsSubscribed(granted);
            });
        });

        return () => {
            // Cleanup
            const existingScript = document.querySelector('script[src*="OneSignalSDK"]');
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, []);

    const requestPermission = async () => {
        if (!window.OneSignalDeferred) return;

        window.OneSignalDeferred.push(async function (OneSignal: any) {
            await OneSignal.Notifications.requestPermission();
        });
    };

    return { isSubscribed, isSupported, requestPermission };
}
