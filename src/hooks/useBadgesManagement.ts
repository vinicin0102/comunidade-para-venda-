import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from './useRanking';
import { toast } from 'sonner';

export function useCreateBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Badge, 'id'>) => {
      const { data: result, error } = await supabase
        .rpc('create_badge_admin', {
          p_name: data.name,
          p_icon: data.icon,
          p_description: data.description || undefined,
          p_points_required: data.points_required || 0
        });

      if (error) throw error;
      
      const response = result as { success: boolean; error?: string; id?: string };
      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar conquista');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Conquista criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar conquista: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

export function useUpdateBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Badge> & { id: string }) => {
      const { data: result, error } = await supabase
        .rpc('update_badge_admin', {
          p_badge_id: id,
          p_name: data.name || undefined,
          p_description: data.description || undefined,
          p_icon: data.icon || undefined,
          p_points_required: data.points_required ?? undefined
        });

      if (error) throw error;
      
      const response = result as { success: boolean; error?: string };
      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar conquista');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['user_badges'] });
      toast.success('Conquista atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar conquista: ' + (error.message || 'Erro desconhecido'));
    },
  });
}

export function useDeleteBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .rpc('delete_badge_admin', {
          p_badge_id: id
        });

      if (error) throw error;
      
      const response = result as { success: boolean; error?: string };
      if (!response.success) {
        throw new Error(response.error || 'Erro ao excluir conquista');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['user_badges'] });
      toast.success('Conquista excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir conquista: ' + (error.message || 'Erro desconhecido'));
    },
  });
}
