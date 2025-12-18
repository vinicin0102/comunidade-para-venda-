import { useState, useEffect } from 'react';
import { Ban, CheckCircle, Trash2, Search, VolumeX, Volume2, Crown, Coins, MoreVertical, Unlock, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  useSupportUsers, 
  useBanUserTemporary, 
  useUnbanUser,
  useMuteUser,
  useUnmuteUser,
  useDeleteUser,
  useChangeUserPlan,
  useUpdateUserPoints,
  useUnlockMentoria
} from '@/hooks/useSupport';
import { useIsAdmin } from '@/hooks/useAdmin';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  telefone?: string;
  points?: number;
  subscription_plan?: string;
  role?: string;
  is_banned?: boolean;
  banned_until?: string;
  is_muted?: boolean;
  mute_until?: string;
}

export function UserManagement() {
  const isAdmin = useIsAdmin();
  const { data: usersData = [], isLoading, error } = useSupportUsers();
  const users = usersData as unknown as UserProfile[];
  
  // Debug: verificar se telefone está sendo buscado
  if (users.length > 0) {
    console.log('🔍 [UserManagement] Primeiro usuário:', {
      username: users[0].username,
      email: users[0].email,
      telefone: users[0].telefone,
      hasTelefone: !!users[0].telefone
    });
  }
  
  const banUserTemporary = useBanUserTemporary();
  const unbanUser = useUnbanUser();
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const deleteUser = useDeleteUser();
  const changePlan = useChangeUserPlan();
  const updatePoints = useUpdateUserPoints();
  const unlockMentoria = useUnlockMentoria();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [newPlan, setNewPlan] = useState<'free' | 'diamond'>('free');
  const [newPoints, setNewPoints] = useState('');

  // Função para formatar telefone para exibição
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');
    // Formata: (00) 00000-0000 ou (00) 0000-0000
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telefone?.includes(searchTerm)
  );

  const handleBan3Days = async (userId: string, username: string) => {
    try {
      await banUserTemporary.mutateAsync({ userId, days: 3 });
      toast.success(`Usuário ${username} foi banido por 3 dias`);
    } catch (error: any) {
      toast.error(`Erro ao banir usuário: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleUnban = async (userId: string, username: string) => {
    try {
      await unbanUser.mutateAsync(userId);
      toast.success(`Usuário ${username} foi desbanido`);
    } catch (error) {
      toast.error('Erro ao desbanir usuário');
    }
  };

  const handleMute = async (userId: string, username: string, days?: number) => {
    try {
      await muteUser.mutateAsync({ userId, days });
      toast.success(`Usuário ${username} foi mutado${days ? ` por ${days} dias` : ' permanentemente'}`);
    } catch (error: any) {
      toast.error(`Erro ao mutar usuário: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleUnmute = async (userId: string, username: string) => {
    try {
      await unmuteUser.mutateAsync(userId);
      toast.success(`Usuário ${username} foi desmutado`);
    } catch (error) {
      toast.error('Erro ao desmutar usuário');
    }
  };

  const handleUnlockMentoria = async (userId: string, username: string) => {
    console.log('🔓 [UserManagement] handleUnlockMentoria chamado', { userId, username });
    try {
      const result = await unlockMentoria.mutateAsync(userId);
      console.log('✅ [UserManagement] Resultado:', result);
      
      const typedResult = result as { modules_unlocked?: number; unlocked?: number; total_modules?: number } | undefined;
      const modulesCount = typedResult?.modules_unlocked || typedResult?.unlocked || typedResult?.total_modules || 'todos';
      toast.success(`Mentoria liberada para ${username}! ${username} precisa recarregar a página para ver os módulos desbloqueados.`, {
        duration: 8000
      });
      
      console.log('ℹ️ [UserManagement] O usuário precisa recarregar a página para ver as alterações');
    } catch (error: any) {
      console.error('❌ [UserManagement] Erro ao liberar mentoria:', error);
      const errorMsg = error?.message || error?.error || 'Erro desconhecido';
      toast.error(`Erro ao liberar mentoria: ${errorMsg}`, {
        duration: 5000
      });
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      toast.success(`Usuário ${username} foi excluído`);
    } catch (error) {
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleChangePlan = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('🔄 [UserManagement] handleChangePlan chamado', { 
      selectedUser: selectedUser?.user_id, 
      newPlan,
      isPending: changePlan.isPending
    });

    if (!selectedUser) {
      console.error('❌ selectedUser é null');
      toast.error('Usuário não selecionado');
      return;
    }

    try {
      console.log('🔄 [UserManagement] Tentando alterar plano:', { 
        userId: selectedUser.user_id, 
        username: selectedUser.username,
        currentPlan: selectedUser.subscription_plan,
        newPlan 
      });

      const result = await changePlan.mutateAsync({
        userId: selectedUser.user_id,
        plan: newPlan,
        expiresAt: null,
      });

      console.log('✅ [UserManagement] Plano alterado com sucesso:', result);

      toast.success(`Plano de ${selectedUser.username} alterado para ${newPlan === 'diamond' ? '💎 Diamond' : 'Free'}`);
      
      // Fechar dialog e limpar
      setShowPlanDialog(false);
      setSelectedUser(null);
      setNewPlan('free');
      
      // Forçar refresh da lista de usuários após 500ms
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('❌ [UserManagement] Erro ao alterar plano:', error);
      console.error('Detalhes completos do erro:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        name: error?.name
      });
      
      const errorMessage = error?.message || 'Erro desconhecido ao alterar plano';
      
      // Mensagem mais específica baseada no erro
      if (errorMessage.includes('RLS') || errorMessage.includes('policy') || errorMessage.includes('permission') || errorMessage.includes('42501')) {
        toast.error('Erro de permissão. Execute o script criar-funcao-change-plan-admin.sql no Supabase SQL Editor.', {
          duration: 12000
        });
      } else if (errorMessage.includes('function') || errorMessage.includes('does not exist')) {
        toast.error('Função RPC não encontrada. Execute o script criar-funcao-change-plan-admin.sql no Supabase SQL Editor.', {
          duration: 12000
        });
      } else {
        toast.error(`Erro: ${errorMessage}`, {
          duration: 8000
        });
      }
    }
  };

  const handleUpdatePoints = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('🔄 [UserManagement] handleUpdatePoints chamado', { 
      selectedUser: selectedUser?.user_id, 
      newPoints,
      isPending: updatePoints.isPending
    });

    if (!selectedUser) {
      console.error('❌ selectedUser é null');
      toast.error('Usuário não selecionado');
      return;
    }

    if (!newPoints || newPoints.trim() === '') {
      console.error('❌ newPoints está vazio');
      toast.error('Preencha o campo de pontos');
      return;
    }
    
    try {
      const points = parseInt(newPoints.trim());
      console.log('📊 Pontos parseados:', { raw: newPoints, parsed: points, isNaN: isNaN(points) });

      if (isNaN(points)) {
        console.error('❌ Pontos não é um número válido');
        toast.error('Pontos inválidos. Digite um número válido');
        return;
      }

      if (points < 0) {
        console.error('❌ Pontos é negativo');
        toast.error('Pontos inválidos. Digite um número maior ou igual a 0');
        return;
      }

      console.log('🔄 [UserManagement] Tentando atualizar pontos:', { 
        userId: selectedUser.user_id, 
        username: selectedUser.username,
        currentPoints: selectedUser.points,
        newPoints: points 
      });

      const result = await updatePoints.mutateAsync({
        userId: selectedUser.user_id,
        points,
      });

      console.log('✅ [UserManagement] Pontos atualizados com sucesso:', result);

      toast.success(`Pontuação de ${selectedUser.username} alterada para ${points.toLocaleString('pt-BR')} pontos`);
      
      // Fechar dialog e limpar
      setShowPointsDialog(false);
      setSelectedUser(null);
      setNewPoints('');
      
      // Forçar refresh da lista de usuários após 500ms
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('❌ [UserManagement] Erro ao alterar pontuação:', error);
      console.error('Detalhes completos do erro:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        name: error?.name
      });
      
      const errorMessage = error?.message || 'Erro desconhecido ao alterar pontuação';
      
      // Mensagem mais específica baseada no erro
      if (errorMessage.includes('RLS') || errorMessage.includes('policy') || errorMessage.includes('permission') || errorMessage.includes('42501')) {
        toast.error('Erro de permissão. Execute o script FIX-RLS-DEFINITIVO.sql no Supabase SQL Editor. Veja EXECUTAR-SQL-AGORA.md', {
          duration: 12000
        });
      } else {
        toast.error(`Erro: ${errorMessage}`, {
          duration: 8000
        });
      }
    }
  };

  if (!isAdmin) {
    return (
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardContent className="pt-6">
          <p className="text-white text-center">Acesso negado. Apenas admin@gmail.com pode acessar esta área.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardContent className="pt-6">
          <p className="text-gray-400 text-center">Carregando usuários...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardContent className="pt-6">
          <p className="text-red-400 text-center">Erro ao carregar usuários: {String(error)}</p>
          <Button onClick={() => window.location.reload()} className="w-full mt-4">Recarregar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardHeader>
          <CardTitle className="text-white">Painel Administrativo</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#2a2a2a] max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="p-4 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-white">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {user.full_name || user.username || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {user.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        {user.telefone ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{formatPhoneDisplay(user.telefone)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-gray-400 italic">
                            <Phone className="h-3 w-3 opacity-50" />
                            <span className="truncate">Sem telefone</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">{user.points || 0} pontos</span>
                        {user.subscription_plan && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            user.subscription_plan === 'diamond' 
                              ? 'bg-cyan-500/20 text-cyan-500' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.subscription_plan === 'diamond' ? '💎 Diamond' : 'Free'}
                          </span>
                        )}
                        {user.role && (
                          <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                            {user.role}
                          </span>
                        )}
                        {user.is_banned && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500">
                            Banido
                            {user.banned_until && ` até ${new Date(user.banned_until).toLocaleDateString('pt-BR')}`}
                          </span>
                        )}
                        {user.is_muted && (
                          <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-500">
                            Mutado
                            {user.mute_until && ` até ${new Date(user.mute_until).toLocaleDateString('pt-BR')}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                      {!user.is_banned ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-400">
                              <Ban className="h-4 w-4 mr-2" />
                              Banir 3 dias
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Banir por 3 dias</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Tem certeza que deseja banir {user.username} por 3 dias?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-[#2a2a2a] text-white">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleBan3Days(user.user_id, user.username)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Banir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUnban(user.user_id, user.username)} className="text-green-400">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Desbanir
                        </DropdownMenuItem>
                      )}
                      
                      {!user.is_muted ? (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-orange-400">
                                <VolumeX className="h-4 w-4 mr-2" />
                                Mutar (7 dias)
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Mutar usuário</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Mutar {user.username} por 7 dias na comunidade?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-[#2a2a2a] text-white">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleMute(user.user_id, user.username, 7)}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  Mutar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUnmute(user.user_id, user.username)} className="text-green-400">
                          <Volume2 className="h-4 w-4 mr-2" />
                          Desmutar
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setNewPlan((user.subscription_plan as 'free' | 'diamond') || 'free');
                          setShowPlanDialog(true);
                        }}
                        className="text-blue-400"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Mudar plano
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setNewPoints(String(user.points || 0));
                          setShowPointsDialog(true);
                        }}
                        className="text-yellow-400"
                      >
                        <Coins className="h-4 w-4 mr-2" />
                        Alterar pontuação
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => handleUnlockMentoria(user.user_id, user.username)}
                        className="text-cyan-400"
                        disabled={unlockMentoria.isPending}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        {unlockMentoria.isPending ? 'Liberando...' : 'Liberar Mentoria'}
                      </DropdownMenuItem>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-400">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir usuário
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Excluir usuário</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Tem certeza que deseja excluir {user.username}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-[#2a2a2a] text-white">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.user_id, user.username)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de mudança de plano */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Alterar Plano</DialogTitle>
            <DialogDescription className="text-gray-400">
              Alterar plano de {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Plano</Label>
              <Select value={newPlan} onValueChange={(value: 'free' | 'diamond') => setNewPlan(value)}>
                <SelectTrigger className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a]">
                  <SelectItem value="free" className="text-white">Free</SelectItem>
                  <SelectItem value="diamond" className="text-white">💎 Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="border-[#3a3a3a] text-white">
              Cancelar
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Botão Salvar (Plano) clicado');
                handleChangePlan(e);
              }} 
              className="bg-primary"
              disabled={changePlan.isPending || !selectedUser}
            >
              {changePlan.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de alteração de pontos */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Alterar Pontuação</DialogTitle>
            <DialogDescription className="text-gray-400">
              Alterar pontuação de {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Pontos</Label>
              <Input
                type="number"
                value={newPoints}
                onChange={(e) => setNewPoints(e.target.value)}
                className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPointsDialog(false);
                setSelectedUser(null);
                setNewPoints('');
              }} 
              className="border-[#3a3a3a] text-white"
              disabled={updatePoints.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Botão Salvar clicado');
                handleUpdatePoints();
              }} 
              className="bg-primary"
              disabled={updatePoints.isPending || !newPoints || newPoints.trim() === ''}
            >
              {updatePoints.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
