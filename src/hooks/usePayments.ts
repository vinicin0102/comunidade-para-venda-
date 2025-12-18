import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'diamond';
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  payment_provider: 'mercadopago' | 'stripe' | 'manual' | null;
  payment_provider_subscription_id: string | null;
  payment_provider_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  payment_provider: string;
  payment_provider_payment_id: string | null;
  payment_method: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Hook para buscar assinatura do usuário
export function useUserSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userSubscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user,
  });
}

// Hook para buscar histórico de pagamentos
export function usePaymentHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['paymentHistory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as Payment[];
    },
    enabled: !!user,
  });
}

// Hook para criar checkout no Stripe
export function useCreatePaymentPreference() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ planType, duration }: { planType: 'diamond'; duration?: '1m' | '3m' | '6m' | '12m' }) => {
      if (!user) throw new Error('Usuário não autenticado');

      console.log('Criando checkout Stripe para:', { planType, duration, userId: user.id });

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { planType, duration: duration || '1m' }
      });

      if (error) {
        console.error('Erro ao chamar função Stripe:', error);
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      if (!data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      console.log('Checkout criado com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      if (data?.checkout_url) {
        console.log('Redirecionando para:', data.checkout_url);
        window.location.href = data.checkout_url;
      } else {
        toast.error('URL de checkout não recebida');
      }
    },
    onError: (error: any) => {
      console.error('Erro ao criar checkout:', error);
      toast.error(error?.message || 'Erro ao processar pagamento', { duration: 5000 });
    },
  });
}

// Hook para cancelar assinatura
export function useCancelSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      toast.success('Assinatura cancelada com sucesso. Você ainda tem acesso até o final do período.');
    },
    onError: (error: any) => {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error(error?.message || 'Erro ao cancelar assinatura');
    },
  });
}

// Hook para reativar assinatura
export function useReactivateSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      toast.success('Assinatura reativada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao reativar assinatura:', error);
      toast.error(error?.message || 'Erro ao reativar assinatura');
    },
  });
}

