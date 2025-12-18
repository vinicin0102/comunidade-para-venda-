import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SupportSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export function useSupportSettings() {
  return useQuery({
    queryKey: ['support-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_settings')
        .select('*');
      
      if (error) throw error;
      
      // Convert array to object for easier access
      const settings: Record<string, string> = {};
      (data as SupportSetting[])?.forEach(item => {
        settings[item.key] = item.value;
      });
      
      return settings;
    },
  });
}

export function useUpdateSupportSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: existingData } = await supabase
        .from('support_settings')
        .select('id')
        .eq('key', key)
        .single();
      
      if (existingData) {
        // Update existing
        const { error } = await supabase
          .from('support_settings')
          .update({ 
            value,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('support_settings')
          .insert({ key, value });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-settings'] });
      toast.success('Configuração salva!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });
}

// Helper function to check if auto reply is enabled (for use in Support.tsx)
export async function isAutoReplyEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('support_settings')
      .select('value')
      .eq('key', 'auto_reply_enabled')
      .single();
    
    if (error) {
      console.error('Erro ao verificar configuração de mensagem automática:', error);
      return true; // Default to true if error
    }
    
    return data?.value === 'true';
  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
    return true; // Default to true if error
  }
}

// Helper function to get auto reply message (for use in Support.tsx)
export async function getAutoReplyMessage(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('support_settings')
      .select('value')
      .eq('key', 'auto_reply_message')
      .single();
    
    if (error || !data) {
      // Retornar mensagem padrão se não encontrar
      return 'Olá! Recebemos sua mensagem. Nossa equipe de suporte responderá em até 10 minutos. Obrigado pela paciência! 🙏';
    }
    
    return data.value || 'Olá! Recebemos sua mensagem. Nossa equipe de suporte responderá em até 10 minutos. Obrigado pela paciência! 🙏';
  } catch (error) {
    console.error('Erro ao buscar mensagem automática:', error);
    return 'Olá! Recebemos sua mensagem. Nossa equipe de suporte responderá em até 10 minutos. Obrigado pela paciência! 🙏';
  }
}
