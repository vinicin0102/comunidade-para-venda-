import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RankingUser {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  subscription_plan?: 'free' | 'diamond';
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  points_required: number;
}

export function useRanking() {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      return data.map((profile, index) => ({
        ...profile,
        rank: index + 1,
      })) as RankingUser[];
    },
  });
}

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true });
      
      if (error) throw error;
      return data as Badge[];
    },
  });
}

export function useUserBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_badges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
