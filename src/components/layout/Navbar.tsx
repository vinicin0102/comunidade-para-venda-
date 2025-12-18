import { User, LogOut, Settings, Shield, HelpCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useCommunityName } from '@/hooks/useAppTheme';

export function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const isAdmin = useIsAdmin();
  const communityName = useCommunityName();
  
  // Verificar se tem acesso Diamond diretamente do perfil
  const hasDiamondAccess = profile?.subscription_plan === 'diamond' && 
    (!profile?.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/auth');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#2a2a2a] bg-[#1a1a1a]/95 backdrop-blur-md" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
      <div className="container flex h-16 items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <span className="font-display text-lg font-semibold">
            {communityName.split(' ').length > 1 ? (
              <>
                <span className="text-white">{communityName.split(' ').slice(0, -1).join(' ')}</span>
                <span className="text-primary"> {communityName.split(' ').slice(-1).join(' ')}</span>
              </>
            ) : (
              <span className="text-white">{communityName}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage 
                    src={profile?.avatar_url || ''} 
                    alt={profile?.username}
                    className="object-cover object-center"
                  />
                  <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
                    {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={profile?.avatar_url || ''} 
                    className="object-cover object-center"
                  />
                  <AvatarFallback className="gradient-primary text-primary-foreground">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{profile?.username || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground">{profile?.points || 0} pontos</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/support')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Suporte
              </DropdownMenuItem>
              {!hasDiamondAccess && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate('/upgrade')}
                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 focus:text-cyan-300 focus:bg-gradient-to-r focus:from-cyan-500/30 focus:to-blue-500/30 border border-cyan-500/30"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-cyan-400" />
                    <div className="flex flex-col">
                      <span className="font-semibold">Virar Diamond</span>
                      <span className="text-xs text-cyan-400/70">Desbloqueie recursos exclusivos</span>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate('/support/dashboard')}
                    className="text-primary focus:text-primary"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Painel Admin
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
