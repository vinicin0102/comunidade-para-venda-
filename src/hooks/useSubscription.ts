import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  subscription_plan: 'free' | 'diamond';
  subscription_expires_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_expires_at')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    enabled: !!user,
  });
}

export function useHasDiamondAccess() {
  const { data: subscription } = useSubscription();

  if (!subscription) return false;
  
  if (subscription.subscription_plan === 'diamond') {
    // Se não tem data de expiração ou ainda não expirou
    if (!subscription.subscription_expires_at) return true;
    return new Date(subscription.subscription_expires_at) > new Date();
  }

  return false;
}

