import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function usePointsNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Escutar notificações de pontos em tempo real
    const channel = supabase
      .channel('points-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new as any;
          
          // Mostrar toast apenas para notificações de pontos
          if (notification.type === 'points' && notification.message) {
            // Forçar atualização imediata dos pontos
            await queryClient.refetchQueries({ queryKey: ['profile'] });
            
            // Usar um ID único para evitar duplicatas
            const notificationId = `points-${notification.id || Date.now()}`;
            
            // Verificar se já existe uma notificação similar (evitar duplicatas)
            toast.success(notification.title || 'Pontos Ganhos!', {
              description: notification.message,
              duration: 4000,
              id: notificationId,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}

