import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useReorderModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      // Atualizar todos os módulos em uma transação
      const promises = updates.map(({ id, order_index }) =>
        supabase
          .from('modules')
          .update({ order_index })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      
      // Verificar se houve algum erro
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Erro ao atualizar ordem dos módulos');
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-lessons'] });
      toast.success('Ordem dos módulos atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar ordem: ' + error.message);
    },
  });
}

