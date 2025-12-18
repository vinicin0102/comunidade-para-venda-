import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Gem, Home, MessageCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppName } from '@/hooks/useAppTheme';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const appName = useAppName();

  // Atualizar plano IMEDIATAMENTE após pagamento
  useEffect(() => {
    const updatePlanImmediately = async () => {
      if (!user) {
        console.log('Usuário não autenticado, aguardando...');
        return;
      }

      try {
        console.log('🔄 Verificando e atualizando plano imediatamente...');
        setIsUpdating(true);

        // Verificar plano atual
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_plan, subscription_expires_at')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Erro ao verificar perfil:', profileError);
          setIsUpdating(false);
          return;
        }

        // Se já é Diamond, apenas invalidar queries
        if (profile?.subscription_plan === 'diamond') {
          console.log('✅ Já é Diamond, apenas atualizando cache...');
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
          queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
          setIsUpdating(false);
          return;
        }

        // Se não é Diamond, atualizar IMEDIATAMENTE
        console.log('💎 Atualizando plano para Diamond imediatamente...');
        
        // Calcular data de expiração baseada na duração (padrão: 30 dias)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias padrão

        // Tentar atualizar o plano (apenas subscription_plan e subscription_expires_at)
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'diamond',
            subscription_expires_at: expiresAt.toISOString()
          })
          .eq('user_id', user.id)
          .select('user_id, username, subscription_plan, subscription_expires_at')
          .single();

        console.log('Resultado do UPDATE:', { updatedProfile, updateError });

        if (updateError) {
          console.error('❌ Erro ao atualizar plano:', updateError);
          console.error('Detalhes:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          
          // Se erro de permissão, aguardar webhook
          if (updateError.code === '42501' || updateError.message?.includes('permission') || updateError.message?.includes('policy') || updateError.message?.includes('RLS')) {
            console.log('⚠️ Erro de permissão (RLS), aguardando webhook processar...');
            toast.info('Aguarde alguns segundos. O plano será ativado automaticamente pelo webhook.');
            
            // Aguardar e verificar novamente
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('subscription_plan')
              .eq('user_id', user.id)
              .single();
            
            if (retryProfile?.subscription_plan === 'diamond') {
              console.log('✅ Webhook atualizou o plano!');
              toast.success('Plano Diamond ativado!');
              queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
              queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
              queryClient.invalidateQueries({ queryKey: ['unlocked-modules', user.id] });
              queryClient.invalidateQueries({ queryKey: ['modules'] });
              queryClient.invalidateQueries({ queryKey: ['courses'] });
            } else {
              toast.error('Execute o SQL permitir-usuario-atualizar-proprio-plano.sql no Supabase para liberar imediatamente.', {
                duration: 10000
              });
            }
          } else {
            toast.error(`Erro: ${updateError.message}. O webhook processará em breve.`);
          }
        } else {
          console.log('✅ Plano atualizado para Diamond com sucesso!', updatedProfile);
          toast.success('Plano Diamond ativado com sucesso!');
          
          // Invalidar queries para atualizar UI
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
          queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
          queryClient.invalidateQueries({ queryKey: ['support-users'] });
          queryClient.invalidateQueries({ queryKey: ['unlocked-modules', user.id] });
          queryClient.invalidateQueries({ queryKey: ['modules'] });
          queryClient.invalidateQueries({ queryKey: ['courses'] });
        }

        setIsUpdating(false);
      } catch (error) {
        console.error('❌ Erro ao verificar/atualizar plano:', error);
        setIsUpdating(false);
        toast.error('Erro ao processar. O webhook ativará o plano em breve.');
      }
    };

    // Executar imediatamente quando a página carregar
    updatePlanImmediately();
  }, [user, queryClient]);

  useEffect(() => {
    // Disparar confete quando a página carregar
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 pb-20 pt-12">
        <Card className="border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/30 p-8 text-center">
            <div className="inline-flex items-center justify-center bg-green-500 rounded-full p-4 mb-4 animate-bounce">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-gray-300">
              Bem-vindo ao Plano Diamond
            </p>
          </div>

          <CardContent className="p-8 space-y-6 text-center">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-4 shadow-glow">
              <Gem className="h-10 w-10 text-white" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                Sua assinatura está ativa!
              </h2>
              <p className="text-gray-400">
                Você agora tem acesso total a todos os recursos premium da {appName}.
              </p>
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-6 text-left space-y-3">
              <h3 className="text-white font-semibold mb-3 text-center">O que você desbloqueou:</h3>
              <div className="grid gap-2">
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Chat da Comunidade com mensagens ilimitadas</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>IAs de Copy e Criativo</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Resgate de Prêmios Exclusivos</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Badge Diamond exclusivo</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Suporte prioritário</span>
                </div>
              </div>
            </div>

            {paymentId && (
              <div className="text-xs text-gray-500 bg-[#2a2a2a] rounded p-3">
                ID do Pagamento: {paymentId}
              </div>
            )}

            {isUpdating && (
              <div className="flex items-center justify-center gap-2 text-yellow-400 bg-yellow-400/10 rounded p-3">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Atualizando seu plano...</span>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <Button
                onClick={() => navigate('/chat')}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Ir para o Chat
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
              >
                <Home className="h-5 w-5 mr-2" />
                Voltar ao Feed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}


