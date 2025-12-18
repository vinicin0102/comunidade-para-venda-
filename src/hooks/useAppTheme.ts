import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface AppTheme {
  primaryHue: number;
  primarySaturation: number;
  primaryLightness: number;
  appName: string;
  communityName: string;
}

const DEFAULT_THEME: AppTheme = {
  primaryHue: 25,
  primarySaturation: 95,
  primaryLightness: 53,
  appName: 'Sociedade Nutra',
  communityName: 'Comunidade dos Sócios'
};

export function useAppTheme() {
  return useQuery({
    queryKey: ['app-theme'],
    queryFn: async () => {
      try {
      const { data, error } = await supabase
        .from('support_settings')
        .select('*')
        .in('key', ['app_primary_hue', 'app_primary_saturation', 'app_primary_lightness', 'app_name', 'community_name']);
        
        // Se a tabela não existir, retornar valores padrão
        if (error) {
          console.warn('Tabela support_settings não encontrada. Usando valores padrão.', error);
          return DEFAULT_THEME;
        }
        
        const theme: AppTheme = { ...DEFAULT_THEME };
        
        (data || []).forEach((item: any) => {
          switch (item.key) {
            case 'app_primary_hue':
              theme.primaryHue = parseInt(item.value) || DEFAULT_THEME.primaryHue;
              break;
            case 'app_primary_saturation':
              theme.primarySaturation = parseInt(item.value) || DEFAULT_THEME.primarySaturation;
              break;
            case 'app_primary_lightness':
              theme.primaryLightness = parseInt(item.value) || DEFAULT_THEME.primaryLightness;
              break;
          case 'app_name':
            theme.appName = item.value || DEFAULT_THEME.appName;
            break;
          case 'community_name':
            theme.communityName = item.value || DEFAULT_THEME.communityName;
            break;
        }
      });
        
        return theme;
      } catch (err) {
        console.error('Erro ao carregar tema:', err);
        return DEFAULT_THEME;
      }
    },
    staleTime: 60000, // 1 minuto
    retry: false, // Não tentar novamente se falhar
  });
}

export function useUpdateAppTheme() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (theme: Partial<AppTheme>) => {
      try {
        const updates = [];
        
        if (theme.primaryHue !== undefined) {
          updates.push({ key: 'app_primary_hue', value: theme.primaryHue.toString() });
        }
        if (theme.primarySaturation !== undefined) {
          updates.push({ key: 'app_primary_saturation', value: theme.primarySaturation.toString() });
        }
        if (theme.primaryLightness !== undefined) {
          updates.push({ key: 'app_primary_lightness', value: theme.primaryLightness.toString() });
        }
      if (theme.appName !== undefined) {
        updates.push({ key: 'app_name', value: theme.appName });
      }
      if (theme.communityName !== undefined) {
        updates.push({ key: 'community_name', value: theme.communityName });
      }
        
        for (const update of updates) {
          const { data: existingData, error: checkError } = await supabase
            .from('support_settings')
            .select('id')
            .eq('key', update.key)
            .maybeSingle();
          
          if (checkError && checkError.code === 'PGRST116') {
            // Tabela não existe
            throw new Error('A tabela support_settings não existe. Execute o script SQL para criá-la.');
          }
          
          if (existingData) {
            const { error } = await supabase
              .from('support_settings')
              .update({ 
                value: update.value,
                updated_at: new Date().toISOString()
              })
              .eq('key', update.key);
            
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('support_settings')
              .insert({ key: update.key, value: update.value });
            
            if (error) throw error;
          }
        }
      } catch (err: any) {
        if (err.message?.includes('Could not find the table') || err.message?.includes('support_settings')) {
          throw new Error('A tabela support_settings não existe. Execute o script SQL no Supabase para criá-la.');
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-theme'] });
      toast.success('Tema atualizado com sucesso!');
      // Recarregar a página para aplicar as mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar tema: ${error.message}`);
    },
  });
}

// Hook para aplicar o tema dinamicamente
export function useApplyTheme() {
  const { data: theme, isLoading, error } = useAppTheme();
  
  useEffect(() => {
    // Se estiver carregando ou houver erro, usar valores padrão
    if (isLoading || error) {
      const root = document.documentElement;
      root.style.setProperty('--primary', `${DEFAULT_THEME.primaryHue} ${DEFAULT_THEME.primarySaturation}% ${DEFAULT_THEME.primaryLightness}%`);
      return;
    }
    
    if (!theme) return;
    
    try {
      const root = document.documentElement;
      
      // Aplicar cores primárias
      root.style.setProperty('--primary', `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`);
      
      // Aplicar cores secundárias (ligeiramente mais escura)
      root.style.setProperty('--secondary', `${theme.primaryHue} ${theme.primarySaturation}% ${Math.max(theme.primaryLightness - 8, 40)}%`);
      
      // Aplicar ring (borda de foco)
      root.style.setProperty('--ring', `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`);
      
      // Aplicar gradientes
      root.style.setProperty(
        '--gradient-primary',
        `linear-gradient(135deg, hsl(${theme.primaryHue} ${theme.primarySaturation}% ${Math.max(theme.primaryLightness - 3, 50)}%) 0%, hsl(${theme.primaryHue} ${theme.primarySaturation}% ${Math.min(theme.primaryLightness + 7, 60)}%) 100%)`
      );
      
      // Aplicar sidebar colors
      root.style.setProperty('--sidebar-primary', `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`);
      root.style.setProperty('--sidebar-ring', `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`);
      
      // Aplicar no modo dark também
      const darkPrimaryLightness = Math.min(theme.primaryLightness + 2, 55);
      root.style.setProperty('--primary', `${theme.primaryHue} ${theme.primarySaturation}% ${darkPrimaryLightness}%`);
    } catch (err) {
      console.error('Erro ao aplicar tema:', err);
    }
  }, [theme, isLoading, error]);
}

// Hook para obter o nome do app
export function useAppName() {
  const { data: theme } = useAppTheme();
  return theme?.appName || DEFAULT_THEME.appName;
}

// Hook para obter o nome da comunidade
export function useCommunityName() {
  const { data: theme } = useAppTheme();
  return theme?.communityName || DEFAULT_THEME.communityName;
}

