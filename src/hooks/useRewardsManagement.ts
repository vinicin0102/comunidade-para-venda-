import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Reward } from './useRewards';
import { toast } from 'sonner';

export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Reward, 'id' | 'created_at'>) => {
      // Não incluir stock por enquanto - a coluna ainda não existe no banco
      // TODO: Adicionar stock quando a migração for executada
      const rewardData: any = {
        name: data.name,
        description: data.description || null,
        image_url: data.image_url || null,
        points_required: data.points_required,
        is_active: data.is_active !== false,
      };

      const { data: reward, error } = await supabase
        .from('rewards')
        .insert(rewardData)
        .select()
        .single();

      if (error) throw error;
      return reward;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['all_rewards'] });
      toast.success('Prêmio criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar prêmio: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Reward> & { id: string }) => {
      // Remover campos que não existem no banco antes de processar
      const { points_cost, stock, ...cleanData } = data as any;
      
      const updateData: any = {};
      
      // Filtrar apenas os campos que existem no banco de dados
      if (cleanData.name !== undefined) updateData.name = cleanData.name;
      if (cleanData.description !== undefined) updateData.description = cleanData.description;
      if (cleanData.image_url !== undefined) updateData.image_url = cleanData.image_url;
      if (cleanData.points_required !== undefined) {
        updateData.points_required = cleanData.points_required;
      }
      // Não incluir points_cost - essa coluna não existe no banco
      // Não incluir stock por enquanto - a coluna ainda não existe no banco
      // TODO: Adicionar stock quando a migração for executada
      if (cleanData.is_active !== undefined) updateData.is_active = cleanData.is_active;

      const { data: reward, error } = await supabase
        .from('rewards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return reward;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['all_rewards'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      toast.success('Prêmio atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar prêmio: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Primeiro, verificar se há resgates pendentes
      const { data: redemptions } = await supabase
        .from('redemptions')
        .select('id')
        .eq('reward_id', id)
        .in('status', ['pending', 'approved']);

      if (redemptions && redemptions.length > 0) {
        throw new Error('Não é possível excluir um prêmio com resgates pendentes ou aprovados. Cancele ou entregue os resgates primeiro.');
      }

      // Deletar resgates cancelados ou entregues relacionados
      await supabase
        .from('redemptions')
        .delete()
        .eq('reward_id', id)
        .in('status', ['cancelled', 'delivered']);

      // Deletar o prêmio
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['all_rewards'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      toast.success('Prêmio excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir prêmio: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

