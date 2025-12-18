import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email?: string | null;
  points: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  subscription_plan?: 'free' | 'diamond';
  subscription_expires_at?: string | null;
  role?: 'user' | 'support' | 'admin';
  is_banned?: boolean;
  banned_until?: string | null;
  is_muted?: boolean;
  mute_until?: string | null;
  posts_count?: number;
  likes_given_count?: number;
  comments_given_count?: number;
  consecutive_days?: number;
  last_login_date?: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscription em tempo real para atualizar pontos automaticamente
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Forçar atualização imediata quando o perfil for atualizado (pontos mudarem)
          await queryClient.refetchQueries({ queryKey: ['profile', user.id] });
          await queryClient.refetchQueries({ queryKey: ['profile'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Erro ao carregar perfil:', error);
          // Não lançar erro, retornar null para não quebrar a UI
          return null;
        }
        
        return data as Profile | null;
      } catch (err) {
        console.error('Erro inesperado ao carregar perfil:', err);
        return null;
      }
    },
    enabled: !!user,
    retry: 1,
    refetchOnWindowFocus: true,
    staleTime: 0, // Sempre buscar dados atualizados
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });
}
