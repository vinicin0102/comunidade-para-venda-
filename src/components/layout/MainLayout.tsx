import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { AIButton } from '@/components/feed/AIButton';
import { useHasDiamondAccess } from '@/hooks/useSubscription';
import { useIsSupport } from '@/hooks/useSupport';
import { useDailyLogin } from '@/hooks/useDailyLogin';
import { usePointsNotifications } from '@/hooks/usePointsNotifications';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const hasDiamondAccess = useHasDiamondAccess();
  const isSupport = useIsSupport();
  
  // Verificar login diário e dar 8 pontos
  useDailyLogin();
  
  // Escutar notificações de pontos em tempo real
  usePointsNotifications();
  
  // Páginas onde o botão de IA NÃO deve aparecer
  const hideAIButton = location.pathname === '/chat' || location.pathname === '/support';
  
  // Páginas onde o Navbar NÃO deve aparecer
  const hideNavbar = location.pathname === '/chat' || location.pathname === '/support';
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {!hideNavbar && <Navbar />}
      <main className={`container pb-20 bg-[#0a0a0a] ${hideNavbar ? 'pt-0' : 'pt-16'}`}>
        {children}
      </main>
      <BottomNav />
      {!hideAIButton && (
        <AIButton
          onCopyAI={() => {
            // Aqui você pode adicionar a lógica da IA de Copy
          }}
          onCreativeAI={() => {
            // Aqui você pode adicionar a lógica da IA de Criativo
          }}
        />
      )}
    </div>
  );
}
