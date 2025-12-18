import { Trophy, Medal, Crown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
// Ícones de medalhas profissionais para níveis
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRanking } from '@/hooks/useRanking';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BadgesList } from '@/components/badges/BadgesList';

const getTierInfo = (tier?: string) => {
  switch (tier) {
    case 'diamond':
      return { 
        name: 'Diamante', 
        color: 'text-cyan-400', 
        bg: 'bg-cyan-500/20', 
        border: 'border-cyan-500/50', 
        icon: '💎'
      };
    case 'platinum':
      return { 
        name: 'Platina', 
        color: 'text-gray-300', 
        bg: 'bg-gray-300/20', 
        border: 'border-gray-300/50', 
        icon: '✨'
      };
    case 'gold':
      return { 
        name: 'Ouro', 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-500/20', 
        border: 'border-yellow-500/50', 
        icon: '🏆'
      };
    case 'silver':
      return { 
        name: 'Prata', 
        color: 'text-gray-400', 
        bg: 'bg-gray-400/20', 
        border: 'border-gray-400/50', 
        icon: '🥈'
      };
    case 'bronze':
      return { 
        name: 'Bronze', 
        color: 'text-amber-600', 
        bg: 'bg-amber-600/20', 
        border: 'border-amber-600/50', 
        icon: '🥉'
      };
    default:
      return { 
        name: 'Sem nível', 
        color: 'text-gray-500', 
        bg: 'bg-gray-500/20', 
        border: 'border-gray-500/50', 
        icon: '⚪'
      };
  }
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-gray-400">{rank}º</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/20';
    case 2:
      return 'bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/20';
    case 3:
      return 'bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/20';
    default:
      return '';
  }
};

export default function Ranking() {
  const { data: ranking, isLoading: rankingLoading } = useRanking();
  const { data: currentProfile } = useProfile();

  const currentUserRank = ranking?.find(r => r.user_id === currentProfile?.user_id);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Stats */}
        {currentProfile && (
          <Card className="overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]">
            <div className="bg-primary p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-white/20">
                  <AvatarImage 
                    src={currentProfile.avatar_url || ''} 
                    className="object-cover object-center"
                  />
                  <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                    {currentProfile.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white flex-1">
                  <h2 className="font-display text-xl font-bold">{currentProfile.username}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {currentUserRank && (
                      <span className="text-white/80 text-sm">
                        {currentUserRank.rank}º lugar
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-display font-bold text-white">
                    {currentProfile.points || 0}
                  </p>
                  <p className="text-sm text-white/80">pontos</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Badges/Conquistas - Estática na posição */}
        <BadgesList />

        {/* Ranking List */}
        <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-primary" />
              Ranking Global
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rankingLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : ranking && ranking.length > 0 ? (
              <div className="divide-y divide-border">
                {ranking.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 p-4 transition-colors hover:bg-[#2a2a2a] overflow-hidden',
                      user.user_id === currentProfile?.user_id && 'bg-primary/10',
                      getRankBg(user.rank)
                    )}
                  >
                    <div className="w-8 flex items-center justify-center">
                      {getRankIcon(user.rank)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={user.avatar_url || ''} 
                        className="object-cover object-center"
                      />
                      <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-semibold">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.subscription_plan === 'diamond' && (
                          <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 text-[10px] px-1.5 py-0 flex-shrink-0">
                            💎 Diamond
                          </Badge>
                        )}
                        <p className="font-semibold text-sm text-white truncate min-w-0">
                          {user.username}
                        </p>
                        {user.user_id === currentProfile?.user_id && (
                          <Badge className="bg-primary text-white text-xs flex-shrink-0">você</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {user.full_name || 'Membro da Tribo'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-primary">{user.points || 0}</p>
                      <p className="text-xs text-gray-400">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhum ranking disponível
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
