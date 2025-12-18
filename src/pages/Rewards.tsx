import { useState } from 'react';
import { Gift, Coins, Package, CheckCircle, Info, MessageSquare } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRewards, useRedemptions, useRedeemReward } from '@/hooks/useRewards';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { useHasDiamondAccess } from '@/hooks/useSubscription';
import { useIsSupport } from '@/hooks/useSupport';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500/20 text-green-500';
    case 'delivered':
      return 'bg-blue-500/20 text-blue-500';
    case 'cancelled':
      return 'bg-red-500/20 text-red-500';
    default:
      return 'bg-yellow-500/20 text-yellow-500';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Aprovado';
    case 'delivered':
      return 'Entregue';
    case 'cancelled':
      return 'Cancelado';
    default:
      return 'Pendente';
  }
};

export default function Rewards() {
  const { data: profile } = useProfile();
  const { data: rewards, isLoading: rewardsLoading, error: rewardsError } = useRewards();
  
  // Debug
  console.log('🎯 [Rewards Page] Estado:', {
    rewardsLoading,
    rewardsError,
    rewardsCount: rewards?.length || 0,
    rewards: rewards
  });
  const { data: redemptions, isLoading: redemptionsLoading } = useRedemptions();
  const redeemReward = useRedeemReward();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const hasDiamondAccess = useHasDiamondAccess();
  const isSupport = useIsSupport();
  const navigate = useNavigate();

  const handleRedeem = async (rewardId: string) => {
    // Todos podem resgatar prêmios se tiverem pontos suficientes
    try {
      await redeemReward.mutateAsync(rewardId);
      setSelectedReward(null);
      toast.success('Solicitação de resgate enviada! Aguarde a avaliação do suporte.');
    } catch (error) {
      // Erro já é tratado no hook
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 px-4 pb-20">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center bg-primary rounded-2xl p-4 mb-4">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Premiação
          </h1>
          <p className="text-gray-400">
            Troque seus pontos por prêmios incríveis!
          </p>
        </div>

        {/* User Points Card */}
        {profile && (
          <Card className="border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Seus Pontos</p>
                  <p className="text-4xl font-display font-bold text-white">
                    {profile.points || 0}
                  </p>
                </div>
                <div className="bg-white/20 rounded-full p-4">
                  <Coins className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="rewards" className="space-y-4">
          <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] w-full">
            <TabsTrigger value="rewards" className="flex-1 data-[state=active]:bg-primary">
              <Gift className="h-4 w-4 mr-2" />
              Prêmios
            </TabsTrigger>
            <TabsTrigger value="redemptions" className="flex-1 data-[state=active]:bg-primary">
              <Package className="h-4 w-4 mr-2" />
              Meus Resgates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-4">
            {/* Aviso sobre saques - APENAS PARA DIAMOND */}
            {hasDiamondAccess && (
              <Card className="border border-cyan-500/50 bg-gradient-to-r from-cyan-600/20 to-blue-500/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="bg-cyan-500/20 rounded-full p-2">
                        <Info className="h-5 w-5 text-cyan-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-cyan-400" />
                        💎 Benefício Diamond: Saques = Pontos
                      </h3>
                      <p className="text-sm text-gray-200 leading-relaxed">
                        Fez um saque nas plataformas? Envie o print do saque para o{' '}
                        <span className="font-semibold text-cyan-400">suporte</span>. 
                        Após análise, o valor do saque será{' '}
                        <span className="font-semibold text-primary">convertido em pontos</span> na comunidade!
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        onClick={() => navigate('/support')}
                      >
                        Ir para Suporte
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {rewardsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-lg bg-[#2a2a2a]" />
                ))}
              </div>
            ) : rewards && rewards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  console.log('📦 Renderizando prêmios:', rewards.length, rewards);
                  return rewards.map((reward) => {
                    console.log('🎁 Prêmio:', reward.name, 'Imagem:', reward.image_url);
                    const canAfford = (profile?.points || 0) >= (reward.points_cost || reward.points_required);
                    const isOutOfStock = reward.stock !== undefined && reward.stock === 0;

                  return (
                    <Card
                      key={reward.id}
                      className={cn(
                        'border overflow-hidden transition-all',
                        canAfford && !isOutOfStock
                          ? 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-primary/50'
                          : 'border-[#2a2a2a] bg-[#1a1a1a] opacity-60'
                      )}
                    >
                      <div className="aspect-video bg-[#2a2a2a] overflow-hidden relative">
                        <img
                          src={reward.image_url || `https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=${encodeURIComponent(reward.name)}`}
                          alt={reward.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('placeholder')) {
                              target.src = `https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=${encodeURIComponent(reward.name)}`;
                            }
                          }}
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-lg">
                            {reward.name}
                          </h3>
                          {isOutOfStock && (
                            <Badge variant="destructive" className="text-xs">
                              Esgotado
                            </Badge>
                          )}
                        </div>
                        {reward.description && (
                          <p className="text-sm text-gray-400 mb-4">
                            {reward.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-primary" />
                            <span className="font-bold text-primary">
                              {reward.points_cost || reward.points_required} pontos
                            </span>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                disabled={!canAfford || isOutOfStock || redeemReward.isPending}
                                className="bg-primary hover:bg-primary/90"
                              >
                                Resgatar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">
                                  Confirmar Resgate
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Você tem certeza que deseja resgatar "{reward.name}" por {reward.points_cost || reward.points_required} pontos?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-[#2a2a2a] text-white border-[#3a3a3a]">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRedeem(reward.id)}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
                })()}
              </div>
            ) : (
              <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
                <CardContent className="py-12 text-center">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum prêmio disponível no momento</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="redemptions" className="space-y-4">
            {redemptionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg bg-[#2a2a2a]" />
                ))}
              </div>
            ) : redemptions && redemptions.length > 0 ? (
              <div className="space-y-4">
                {redemptions.map((redemption) => (
                  <Card
                    key={redemption.id}
                    className="border border-[#2a2a2a] bg-[#1a1a1a]"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">
                              {redemption.rewards?.name || 'Prêmio'}
                            </h3>
                            <Badge className={getStatusColor(redemption.status)}>
                              {getStatusLabel(redemption.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>
                              {redemption.points_spent} pontos gastos
                            </span>
                            <span>•</span>
                            <span>
                              {format(new Date(redemption.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        {redemption.status === 'delivered' && (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Você ainda não resgatou nenhum prêmio</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

