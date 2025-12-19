import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { NotificationPrompt } from "@/components/pwa/NotificationPrompt";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import Ranking from "./pages/Ranking";
import Notifications from "./pages/Notifications";
import Support from "./pages/Support";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import SupportLogin from "./pages/SupportLogin";
import SupportDashboard from "./pages/SupportDashboard";
import Rewards from "./pages/Rewards";
import Upgrade from "./pages/Upgrade";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import Courses from "./pages/Courses";
import Lesson from "./pages/Lesson";
import LessonRedirect from "./pages/LessonRedirect";
import { DiamondRoute } from "./components/subscription/DiamondRoute";
import { useApplyTheme } from "@/hooks/useAppTheme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minuto
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checkingBan, setCheckingBan] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banMessage, setBanMessage] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout de segurança: se loading demorar mais de 10 segundos, libera
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout - liberando interface');
        setLoadingTimeout(true);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  useEffect(() => {
    const checkBan = async () => {
      if (!user) {
        setCheckingBan(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar ban:', error);
          setCheckingBan(false);
          return;
        }

        const isBannedProfile = (profile as { is_banned?: boolean; banned_until?: string | null })?.is_banned;
        const bannedUntilStr = (profile as { is_banned?: boolean; banned_until?: string | null })?.banned_until;

        if (isBannedProfile) {
          const bannedUntil = bannedUntilStr ? new Date(bannedUntilStr) : null;
          const now = new Date();

          // Se tem data de expiração e já passou, não está mais banido
          if (bannedUntil && bannedUntil < now) {
            // Atualizar status no banco
            await (supabase
              .from('profiles') as any)
              .update({ is_banned: false, banned_until: null })
              .eq('user_id', user.id);
            setIsBanned(false);
          } else {
            // Está banido
            setIsBanned(true);
            const daysLeft = bannedUntil
              ? Math.ceil((bannedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null;
            setBanMessage(
              bannedUntil
                ? `Sua conta foi banida. Você poderá acessar novamente em ${daysLeft} dia(s) (${bannedUntil.toLocaleDateString('pt-BR')}).`
                : 'Sua conta foi banida permanentemente.'
            );
            // Fazer logout
            await supabase.auth.signOut();
          }
        } else {
          setIsBanned(false);
        }
      } catch (error) {
        console.error('Erro ao verificar ban:', error);
        // Em caso de erro, não bloquear o acesso
        setIsBanned(false);
      } finally {
        setCheckingBan(false);
      }
    };

    if (!loading && user) {
      checkBan();
    } else if (!loading && !user) {
      setCheckingBan(false);
    }
  }, [user, loading]);

  // Se loading demorar muito, libera mesmo assim
  if ((loading && !loadingTimeout) || checkingBan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="bg-primary rounded-2xl p-4 animate-pulse">
          <span className="text-4xl">🏋️</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <div className="bg-[#1a1a1a] border border-red-500/50 rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-4">Conta Suspensa</h1>
          <p className="text-gray-400">{banMessage}</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function SupportRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="bg-primary rounded-2xl p-4 animate-pulse">
          <span className="text-4xl">🏋️</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/support/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/support/login" element={<SupportLogin />} />
      <Route path="/support/dashboard" element={<SupportRoute><SupportDashboard /></SupportRoute>} />
      <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
      <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      <Route path="/payment/failure" element={<ProtectedRoute><PaymentFailure /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
      <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
      <Route path="/courses/:moduleId/:lessonId" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
      <Route path="/lesson/:lessonId" element={<ProtectedRoute><LessonRedirect /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppContent() {
  // Aplicar tema dinamicamente (dentro do QueryClientProvider)
  useApplyTheme();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <InstallPrompt />
          <NotificationPrompt />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
