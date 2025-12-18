import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useDailyLogin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasCheckedToday, setHasCheckedToday] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Verificar se já checou hoje (usando localStorage)
    const today = new Date().toISOString().split('T')[0];
    const lastCheckKey = `daily_login_${user.id}_${today}`;
    const alreadyChecked = localStorage.getItem(lastCheckKey);

    if (alreadyChecked || hasCheckedToday) {
      return; // Já checou hoje, não fazer nada
    }

    const recordDailyLogin = async () => {
      try {
        // Chamar função do Supabase para registrar login diário
        const { data, error } = await (supabase.rpc as any)('record_daily_login', {
          p_user_id: user.id
        });

        if (error) {
          console.error('Erro ao registrar login diário:', error);
          return;
        }

        // Marcar como checado hoje
        localStorage.setItem(lastCheckKey, 'true');
        setHasCheckedToday(true);

        // Verificar resultado da função
        if (data) {
          const result = data as any;
          
          if (result.points_earned && result.points_earned > 0) {
            // Forçar atualização imediata do perfil
            await queryClient.refetchQueries({ queryKey: ['profile'] });
            
            // Mostrar notificação apenas se ganhou pontos
            toast.success(`🎉 +${result.points_earned} pontos por login diário!`, {
              description: 'Continue voltando todos os dias!'
            });
          } else if (result.already_logged) {
            // Já ganhou pontos hoje, não mostrar notificação
            console.log('Login já registrado hoje');
            // Mesmo assim, atualizar o perfil
            await queryClient.refetchQueries({ queryKey: ['profile'] });
          }
        } else {
          // Se não retornou dados, ainda assim atualizar
          await queryClient.refetchQueries({ queryKey: ['profile'] });
        }
      } catch (error) {
        console.error('Erro ao registrar login diário:', error);
      }
    };

    // Registrar após 2 segundos do login (para não poluir a tela inicial)
    const timer = setTimeout(() => {
      recordDailyLogin();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, hasCheckedToday, queryClient]);
}
