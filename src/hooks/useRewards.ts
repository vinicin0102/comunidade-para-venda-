import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_required: number;
  points_cost?: number; // Alias for compatibility
  stock?: number;
  is_active: boolean;
  created_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  rewards?: Reward;
}

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      console.log('🔍 [useRewards] Buscando prêmios...');
      
      try {
        const { data, error } = await supabase
          .from('rewards')
          .select('*')
          .eq('is_active', true)
          .order('points_required', { ascending: true });

        console.log('📊 [useRewards] Resposta:', { data, error });

        if (error) {
          console.error('❌ [useRewards] Erro:', error);
          return [] as Reward[];
        }
        
        if (!data || data.length === 0) {
          console.warn('⚠️ [useRewards] Nenhum prêmio encontrado!');
          return [] as Reward[];
        }
        
        // Mapear para o formato esperado
        const rewards = data.map((reward) => ({
          id: reward.id,
          name: reward.name,
          description: reward.description,
          image_url: reward.image_url || null,
          points_required: reward.points_required,
          points_cost: reward.points_required, // Alias
          is_active: reward.is_active !== false,
          created_at: reward.created_at,
        })) as Reward[];
        
        console.log('✅ [useRewards] Prêmios encontrados:', rewards.length);
        
        return rewards;
      } catch (err: any) {
        console.error('💥 [useRewards] Erro inesperado:', err);
        return [] as Reward[];
      }
    },
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useRedemptions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['redemptions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase.from('redemptions') as any)
        .select(`
          *,
          rewards (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Redemption[];
    },
    enabled: !!user,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase.rpc as any)('redeem_reward', {
        p_user_id: user.id,
        p_reward_id: rewardId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; message: string }[] | null;
      if (result && result.length > 0 && !result[0].success) {
        throw new Error(result[0].message);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Prêmio resgatado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao resgatar prêmio');
    },
  });
}
