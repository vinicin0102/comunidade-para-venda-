import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseBanner {
  id: string;
  image_url?: string | null;
  title?: string | null;
  description?: string | null;
  link_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCourseBanner() {
  return useQuery({
    queryKey: ['course_banner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_banners')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data as CourseBanner | null;
    },
    staleTime: 30000, // 30 segundos
  });
}

export function useUpdateCourseBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: {
      image_url?: string;
      title?: string;
      description?: string;
      link_url?: string;
    }) => {
      // Primeiro, desativar todos os banners existentes
      await supabase
        .from('course_banners')
        .update({ is_active: false })
        .eq('is_active', true);

      // Depois, criar ou atualizar o banner ativo
      const { data, error } = await supabase
        .from('course_banners')
        .upsert({
          ...banner,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course_banner'] });
    },
  });
}

export function useDeleteCourseBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('course_banners')
        .update({ is_active: false })
        .eq('is_active', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course_banner'] });
    },
  });
}

