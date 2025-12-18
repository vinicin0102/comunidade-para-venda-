import { Gem, Check, Zap, Lock, CreditCard, Clock, Shield, CheckCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useCreatePaymentPreference, useUserSubscription, useCancelSubscription, useReactivateSubscription } from '@/hooks/usePayments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const benefits = [
  'Acesso ao Chat da Comunidade',
  'Enviar mensagens e mídias no Chat',
  'Visualizar Ranking completo',
  'Resgatar Prêmios exclusivos',
  'Usar IAs de Copy e Criativo',
  'Badge Diamond exclusivo',
  'Suporte prioritário',
];

const paymentFeatures = [
  { icon: Shield, text: 'Pagamento 100% seguro' },
  { icon: CreditCard, text: 'Cartão, Pix ou Boleto' },
  { icon: Clock, text: 'Acesso vitalício' },
];

// Plano único de R$ 497
const PLAN_PRICE = 497;

export default function Upgrade() {
  const navigate = useNavigate();
  const createPayment = useCreatePaymentPreference();
  const { data: subscription, isLoading: loadingSub } = useUserSubscription();
  const cancelSubscription = useCancelSubscription();
  const reactivateSubscription = useReactivateSubscription();

  const handleUpgrade = () => {
    createPayment.mutate({ planType: 'diamond', duration: '1m' });
  };

  const handleCancel = () => {
    if (!subscription) return;
    if (confirm('Tem certeza que deseja cancelar sua assinatura? Você ainda terá acesso até o final do período atual.')) {
      cancelSubscription.mutate(subscription.id);
    }
  };

  const handleReactivate = () => {
    if (!subscription) return;
    reactivateSubscription.mutate(subscription.id);
  };

  if (loadingSub) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 pb-20 pt-4 space-y-4">
          <Skeleton className="h-32 w-full bg-[#2a2a2a]" />
          <Skeleton className="h-96 w-full bg-[#2a2a2a]" />
        </div>
      </MainLayout>
    );
  }

  if (subscription?.plan_type === 'diamond' && subscription?.status === 'active') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 pb-20 pt-4">
          <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
            <CardHeader className="border-b border-[#2a2a2a]">
              <div className="text-center">
                <div className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-4 mb-4 shadow-glow">
                  <Gem className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Você é Diamond!
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="text-center text-gray-400">
                <p className="mb-2">Sua assinatura está ativa e você tem acesso total à plataforma.</p>
                {subscription.current_period_end && (
                  <p className="text-sm">
                    Próxima cobrança: {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>

              <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-2">
                <h3 className="text-white font-semibold mb-3">Seus benefícios ativos:</h3>
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {subscription.cancel_at_period_end ? (
                  <>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-500 text-sm">
                      ⚠️ Sua assinatura será cancelada em {format(new Date(subscription.current_period_end!), "dd/MM/yyyy")}
                    </div>
                    <Button
                      onClick={handleReactivate}
                      disabled={reactivateSubscription.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Reativar Assinatura
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleCancel}
                    disabled={cancelSubscription.isPending}
                    variant="outline"
                    className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    Cancelar Assinatura
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                >
                  Voltar ao Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 pb-20 pt-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-4 mb-4 shadow-glow">
            <Gem className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Plano Diamond
          </h1>
          <p className="text-gray-400">
            Desbloqueie todo o potencial da comunidade
          </p>
        </div>

        {/* Price Card */}
        <Card className="border-2 border-cyan-500 bg-cyan-500/10 mb-6">
          <CardContent className="p-6 text-center">
            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm mb-4">
              <Zap className="h-4 w-4 mr-1" />
              Acesso Completo
            </Badge>
            <div className="mb-4">
              <span className="text-5xl font-bold text-white">
                R$ {PLAN_PRICE}
              </span>
            </div>
            <p className="text-gray-400">Pagamento único • Acesso vitalício</p>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        <Card className="border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden mb-6">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white font-semibold mb-2">Benefícios inclusos:</h3>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-white">{benefit}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Features */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {paymentFeatures.map((feature, index) => (
            <Card key={index} className="border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-center">
              <feature.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-gray-400">{feature.text}</p>
            </Card>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleUpgrade}
            disabled={createPayment.isPending}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
          >
            <Gem className="h-5 w-5 mr-2" />
            {createPayment.isPending 
              ? 'Processando...' 
              : `Assinar por R$ ${PLAN_PRICE}`
            }
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
          >
            Voltar ao Feed
          </Button>
        </div>

        {/* Payment Info */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mt-6 text-center text-sm text-gray-400">
          <Shield className="h-5 w-5 text-green-500 mx-auto mb-2" />
          <p>Pagamento processado pela <strong className="text-white">Stripe</strong></p>
          <p className="text-xs mt-1">Ambiente seguro e criptografado • Cartão, Pix ou Boleto</p>
        </div>

        {/* Free Plan Info */}
        <Card className="border border-[#2a2a2a] bg-[#1a1a1a] mt-6">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-400" />
              Plano Gratuito
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400 space-y-2">
            <p>✓ Acesso ao Feed da comunidade</p>
            <p>✓ Suporte via chat</p>
            <p className="text-primary mt-4">
              Faça upgrade para Diamond e desbloqueie tudo!
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
