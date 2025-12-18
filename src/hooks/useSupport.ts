import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { deleteImage } from '@/lib/upload';
import { deleteAudio } from '@/lib/audioUpload';

const ADMIN_EMAIL = 'admin@gmail.com';

export function useIsSupport() {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  
  // Se for admin@gmail.com, sempre retorna true
  if (user?.email === ADMIN_EMAIL) {
    return true;
  }
  
  // Se o perfil não carregou ainda, retorna false temporariamente
  if (!profile) {
    return false;
  }
  
  const profileData = profile as { role?: string } | undefined;
  return profileData?.role === 'support' || profileData?.role === 'admin';
}

export function useSupportUsers() {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const profileData = profile as { role?: string } | undefined;
  const isSupport = profileData?.role === 'support' || profileData?.role === 'admin';
  const isAdmin = user?.email === ADMIN_EMAIL;
  const canAccess = isSupport || isAdmin;

  return useQuery({
    queryKey: ['support-users', user?.email],
    queryFn: async () => {
      if (!canAccess && user?.email !== ADMIN_EMAIL) {
        console.log('Acesso negado - não é suporte nem admin');
        return [];
      }

      console.log('Buscando usuários...', { isSupport, isAdmin, canAccess, userEmail: user?.email });

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url, email, telefone, points, subscription_plan, role, is_banned, banned_until, is_muted, mute_until, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }
      
      console.log('Usuários encontrados:', data?.length || 0);
      
      // Debug: verificar se telefone está sendo retornado
      if (data && data.length > 0) {
        const firstUser = data[0] as any;
        console.log('🔍 [useSupportUsers] Primeiro usuário retornado:', {
          username: firstUser.username,
          email: firstUser.email,
          telefone: firstUser.telefone,
          hasTelefone: !!firstUser.telefone,
          telefoneType: typeof firstUser.telefone
        });
        
        // Contar quantos têm telefone
        const withTelefone = data.filter((u: any) => u.telefone && u.telefone.trim() !== '').length;
        console.log(`📊 [useSupportUsers] Usuários com telefone: ${withTelefone} de ${data.length}`);
      }
      
      return data || [];
    },
    enabled: !!user && (canAccess || user?.email === ADMIN_EMAIL),
    retry: 1,
  });
}

export function useBanUser() {
  return useBanUserTemporary();
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const profileData = profile as { role?: string } | undefined;
  const isAdmin = user?.email === ADMIN_EMAIL || profileData?.role === 'admin' || profileData?.role === 'support';

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!isAdmin) throw new Error('Sem permissão. Apenas admins podem executar esta ação.');

      console.log('Desbanindo usuário via RPC:', { userId });

      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        'unban_user_admin',
        { p_user_id: userId }
      );

      console.log('Resposta RPC unban_user_admin:', { rpcData, rpcError });

      if (rpcError) {
        console.error('Erro RPC:', rpcError);
        throw new Error(rpcError.message || 'Erro ao desbanir usuário');
      }

      if (rpcData && typeof rpcData === 'object' && rpcData.success === false) {
        throw new Error(rpcData.error || 'Erro ao desbanir usuário');
      }

      return rpcData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const profileData = profile as { role?: string } | undefined;
  const isSupport = profileData?.role === 'support' || profileData?.role === 'admin';

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!isSupport) throw new Error('Sem permissão');

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const profileData = profile as { role?: string } | undefined;
  const isSupport = profileData?.role === 'support' || profileData?.role === 'admin';

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!isSupport) throw new Error('Sem permissão');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeleteChatMessage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const profileData = profile as { role?: string } | undefined;
  const isSupport = profileData?.role === 'support' || profileData?.role === 'admin';

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('Não autenticado');

      // Buscar a mensagem para verificar se é do usuário
      const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('user_id, content')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;
      if (!message) throw new Error('Mensagem não encontrada');

      // Permitir deletar se for o próprio usuário OU se for admin/support
      const isOwnMessage = message.user_id === user.id;
      if (!isOwnMessage && !isSupport) {
        throw new Error('Você só pode deletar suas próprias mensagens');
      }

      // Deletar áudio do storage se existir (formato: 🎤AUDIO:URL|DURATION)
      if (message.content?.startsWith('🎤AUDIO:')) {
        try {
          const match = message.content.match(/🎤AUDIO:(.+?)\|(\d+)/);
          if (match && match[1]) {
            const audioUrl = match[1];
            await deleteAudio(audioUrl);
          }
        } catch (error) {
          console.error('Erro ao deletar áudio:', error);
          // Continuar mesmo se falhar ao deletar o áudio
        }
      }

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages'] });
    },
  });
}

export function useDeleteSupportMessage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const profileData = profile as { role?: string } | undefined;
  const isSupport = profileData?.role === 'support' || profileData?.role === 'admin' || user?.email === ADMIN_EMAIL;

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!isSupport) throw new Error('Sem permissão');

      // Buscar a mensagem antes de deletar para verificar se tem áudio
      const { data: message, error: fetchError } = await supabase
        .from('support_chat')
        .select('message')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Deletar o áudio do storage se existir (formato: 🎤AUDIO:URL|DURATION)
      if (message?.message?.startsWith('🎤AUDIO:')) {
        try {
          const match = message.message.match(/🎤AUDIO:(.+?)\|(\d+)/);
          if (match && match[1]) {
            const audioUrl = match[1];
            await deleteAudio(audioUrl);
          }
        } catch (error) {
          console.error('Erro ao deletar áudio do storage:', error);
        }
      }

      // Deletar a mensagem do banco
      const { error } = await supabase
        .from('support_chat')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-chat'] });
    },
  });
}

export function useBanUserTemporary() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return useMutation({
    mutationFn: async ({ userId, days = 3 }: { userId: string; days?: number }) => {
      if (!isAdmin) throw new Error('Sem permissão. Apenas admin@gmail.com pode executar esta ação.');

      console.log('Banindo usuário:', { userId, days, isAdmin, userEmail: user?.email });

      if (!userId || userId === '') {
        throw new Error('ID do usuário inválido');
      }

      const { data, error } = await (supabase.rpc as any)('ban_user_temporary', {
        p_user_id: userId,
        p_days: days,
      });

      console.log('Resposta do RPC ban_user_temporary:', { data, error });

      if (error) {
        console.error('Erro ao banir usuário:', error);
        throw new Error(error.message || 'Erro ao banir usuário.');
      }

      console.log('Usuário banido com sucesso:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0] as { success?: boolean; error?: string };
        if (result.success === false) {
          throw new Error(result.error || 'Erro ao banir usuário');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useMuteUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days?: number }) => {
      if (!isAdmin) throw new Error('Sem permissão. Apenas admin@gmail.com pode executar esta ação.');

      console.log('Mutando usuário:', { userId, days, isAdmin, userEmail: user?.email });

      if (!userId || userId === '') {
        throw new Error('ID do usuário inválido');
      }

      const { data, error } = await (supabase.rpc as any)('mute_user', {
        p_user_id: userId,
        p_hours: days ? days * 24 : null,
      });

      console.log('Resposta do RPC mute_user:', { data, error });

      if (error) {
        console.error('Erro ao mutar usuário:', error);
        throw new Error(error.message || 'Erro ao mutar usuário.');
      }

      console.log('Usuário mutado com sucesso:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0] as { success?: boolean; error?: string };
        if (result.success === false) {
          throw new Error(result.error || 'Erro ao mutar usuário');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useUnmuteUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const profileData = profile as { role?: string } | undefined;
  const isAdmin = user?.email === ADMIN_EMAIL || profileData?.role === 'admin' || profileData?.role === 'support';

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!isAdmin) throw new Error('Sem permissão. Apenas admins podem executar esta ação.');

      console.log('Desmutando usuário via RPC:', { userId });

      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        'unmute_user_admin',
        { p_user_id: userId }
      );

      console.log('Resposta RPC unmute_user_admin:', { rpcData, rpcError });

      if (rpcError) {
        console.error('Erro RPC:', rpcError);
        throw new Error(rpcError.message || 'Erro ao desmutar usuário');
      }

      if (rpcData && typeof rpcData === 'object' && rpcData.success === false) {
        throw new Error(rpcData.error || 'Erro ao desmutar usuário');
      }

      return rpcData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!isAdmin) throw new Error('Sem permissão. Apenas admin@gmail.com pode executar esta ação.');

      // Delete user profile (cascade will handle related records)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useChangeUserPlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const profileData = profile as { role?: string } | undefined;
  const isAdmin = user?.email === ADMIN_EMAIL || profileData?.role === 'admin';

  return useMutation({
    mutationFn: async ({ 
      userId, 
      plan, 
      expiresAt 
    }: { 
      userId: string; 
      plan: 'free' | 'diamond'; 
      expiresAt?: string | null;
    }) => {
      if (!isAdmin) {
        console.error('Acesso negado - não é admin:', { userEmail: user?.email, role: profileData?.role });
        throw new Error('Sem permissão. Apenas admins podem executar esta ação.');
      }

      console.log('Alterando plano via RPC:', { userId, plan, expiresAt });

      // Usar função RPC com SECURITY DEFINER para ignorar RLS
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        'change_user_plan_admin',
        {
          p_user_id: userId,
          p_plan: plan,
          p_expires_at: expiresAt || null
        }
      );

      console.log('Resposta RPC change_user_plan_admin:', { rpcData, rpcError });

      if (rpcError) {
        console.error('Erro RPC:', rpcError);
        throw new Error(rpcError.message || 'Erro ao alterar plano');
      }

      // Verificar resposta da função
      if (rpcData && typeof rpcData === 'object') {
        if (rpcData.success === false) {
          throw new Error(rpcData.error || 'Erro ao alterar plano');
        }
        
        if (rpcData.success === true) {
          console.log('✅ Plano alterado com sucesso:', rpcData.message);
          return { success: true, message: rpcData.message };
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useUnlockMentoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('🔓 [useUnlockMentoria] Iniciando liberação de mentoria para:', userId);
      
      try {
        // Primeiro, tentar usar a função RPC
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('unlock_mentoria_for_user', {
          p_user_id: userId
        });

        console.log('📡 [useUnlockMentoria] Resposta RPC:', { rpcData, rpcError });

        if (rpcError) {
          console.error('❌ [useUnlockMentoria] Erro na RPC:', rpcError);
          
          // Se a função RPC não existir, tentar método direto como fallback
          if (rpcError.message?.includes('function') || rpcError.code === '42883') {
            console.warn('⚠️ [useUnlockMentoria] Função RPC não encontrada, tentando método direto...');
            return await unlockMentoriaDirect(userId);
          }
          
          throw rpcError;
        }

        const typedRpcData = rpcData as { success?: boolean; error?: string; modules_unlocked?: number; total_modules?: number } | null;

        if (typedRpcData && typeof typedRpcData === 'object') {
          if ('success' in typedRpcData && !typedRpcData.success) {
            const errorMsg = typedRpcData.error || 'Erro ao liberar mentoria';
            console.error('❌ [useUnlockMentoria] Função RPC retornou erro:', errorMsg);
            throw new Error(errorMsg);
          }
          
          console.log('✅ [useUnlockMentoria] Mentoria liberada com sucesso via RPC');
          return typedRpcData;
        }

        // Fallback para método direto se RPC não retornar resultado esperado
        console.warn('⚠️ [useUnlockMentoria] RPC não retornou resultado esperado, tentando método direto...');
        return await unlockMentoriaDirect(userId);
        
      } catch (error: any) {
        console.error('❌ [useUnlockMentoria] Erro geral:', error);
        throw error;
      }
    },
    onSuccess: (data, userId) => {
      console.log('✅ [useUnlockMentoria] Sucesso, invalidando queries para usuário:', userId);
      
      // Invalidar queries gerais
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // Invalidar especificamente a query do usuário alvo que teve a mentoria liberada
      queryClient.invalidateQueries({ queryKey: ['unlocked-modules', userId] });
      queryClient.invalidateQueries({ queryKey: ['unlocked-modules'] });
      
      // Remover do cache para forçar refetch
      queryClient.removeQueries({ queryKey: ['unlocked-modules', userId] });
      
      console.log('✅ [useUnlockMentoria] Queries invalidadas');
    },
    onError: (error: any) => {
      console.error('❌ [useUnlockMentoria] Erro no mutation:', error);
    },
  });
}

// Função auxiliar para método direto (fallback)
async function unlockMentoriaDirect(userId: string) {
  console.log('🔧 [unlockMentoriaDirect] Usando método direto para usuário:', userId);
  
  // Buscar todos os módulos bloqueados
  const { data: lockedModules, error: modulesError } = await supabase
    .from('modules')
    .select('id')
    .eq('is_locked', true);

  if (modulesError) {
    console.error('❌ [unlockMentoriaDirect] Erro ao buscar módulos:', modulesError);
    throw modulesError;
  }

  if (!lockedModules || lockedModules.length === 0) {
    console.warn('⚠️ [unlockMentoriaDirect] Nenhum módulo bloqueado encontrado');
    throw new Error('Nenhum módulo bloqueado encontrado');
  }

  console.log(`📦 [unlockMentoriaDirect] Encontrados ${lockedModules.length} módulos bloqueados`);

  // Tentar inserir módulos desbloqueados
  let successCount = 0;
  let errorCount = 0;
  
  for (const module of lockedModules) {
    const { error: unlockError } = await supabase
      .from('unlocked_modules')
      .insert({ user_id: userId, module_id: module.id });
    
    if (unlockError) {
      // Ignorar erros de duplicata (código 23505 é unique violation)
      if (unlockError.code === '23505') {
        console.log(`ℹ️ [unlockMentoriaDirect] Módulo ${module.id} já estava desbloqueado`);
        successCount++;
      } else {
        console.error(`❌ [unlockMentoriaDirect] Erro ao desbloquear módulo ${module.id}:`, unlockError);
        errorCount++;
      }
    } else {
      successCount++;
    }
  }

  console.log(`✅ [unlockMentoriaDirect] Processamento concluído: ${successCount} sucesso, ${errorCount} erros`);
  
  if (errorCount > 0 && successCount === 0) {
    throw new Error(`Não foi possível desbloquear nenhum módulo. Verifique as permissões RLS.`);
  }

  return { unlocked: successCount, total: lockedModules.length };
}

export function useUpdateUserPoints() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const profileData = profile as { role?: string } | undefined;
  const isAdmin = user?.email === ADMIN_EMAIL || profileData?.role === 'admin';

  return useMutation({
    mutationFn: async ({ 
      userId, 
      points, 
    }: { 
      userId: string; 
      points: number; 
      reason?: string;
    }) => {
      if (!isAdmin) {
        console.error('Acesso negado - não é admin:', { userEmail: user?.email, role: profileData?.role });
        throw new Error('Sem permissão. Apenas admin@gmail.com pode executar esta ação.');
      }

      console.log('Atualizando pontos:', { userId, points, isAdmin, userEmail: user?.email });

      if (!userId || userId === '') {
        throw new Error('ID do usuário inválido');
      }

      if (isNaN(points) || points < 0) {
        throw new Error('Pontos inválidos');
      }

      console.log('=== INÍCIO ATUALIZAÇÃO DE PONTOS ===');
      console.log('Dados recebidos:', { userId, points, isAdmin, userEmail: user?.email, userRole: profileData?.role });

      // Primeiro, verificar se o usuário existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('user_id, points, username, email, role')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Perfil existente:', { existingProfile, checkError });

      if (checkError) {
        console.error('❌ Erro ao verificar perfil:', checkError);
        throw new Error(`Erro ao verificar perfil: ${checkError.message} (Código: ${checkError.code})`);
      }

      if (!existingProfile) {
        console.error('❌ Usuário não encontrado:', userId);
        throw new Error('Usuário não encontrado');
      }

      console.log('✅ Perfil encontrado:', existingProfile);
      console.log('Atualizando pontos de', existingProfile.points, 'para', points);

      // Usar função RPC com SECURITY DEFINER para ignorar RLS
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        'update_user_points_admin',
        {
          p_user_id: userId,
          p_points: points
        }
      );

      console.log('=== RESPOSTA DA ATUALIZAÇÃO (RPC) ===');
      console.log('RPC Data retornada:', rpcData);
      console.log('RPC Erro retornado:', rpcError);

      if (rpcError) {
        console.error('❌ ERRO AO ATUALIZAR PONTOS (RPC):', rpcError);
        console.error('Detalhes completos do erro:', {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint
        });
        throw new Error(rpcError.message || 'Erro ao atualizar pontos via RPC');
      }

      // Verificar se a função retornou sucesso
      if (rpcData && typeof rpcData === 'object') {
        if (rpcData.success === false) {
          console.error('❌ Função RPC retornou erro:', rpcData.error);
          throw new Error(rpcData.error || 'Erro ao atualizar pontos');
        }
        
        if (rpcData.success === true) {
          console.log('✅ Pontos atualizados com sucesso via RPC:', rpcData);
          // Buscar o perfil atualizado para retornar
          const { data: updatedProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('user_id, username, points, email, role')
            .eq('user_id', userId)
            .single();
          
          if (fetchError) {
            console.error('Erro ao buscar perfil atualizado:', fetchError);
            // Mesmo assim retornar sucesso, pois os pontos foram atualizados
            return { user_id: userId, points: points };
          }
          
          return updatedProfile;
        }
      }

      // Fallback: tentar UPDATE direto se RPC não estiver disponível
      console.warn('⚠️ RPC não retornou resultado esperado, tentando UPDATE direto...');
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          points: points,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .select('user_id, username, points, email, role');

      console.log('=== RESPOSTA DA ATUALIZAÇÃO (FALLBACK) ===');
      console.log('Data retornada:', data);
      console.log('Erro retornado:', error);

      if (error) {
        console.error('❌ ERRO AO ATUALIZAR PONTOS (FALLBACK):', error);
        console.error('Detalhes completos do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: (error as any).status
        });
        
        // Mensagem de erro mais específica
        let errorMessage = `Erro ao atualizar pontos: ${error.message}`;
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          errorMessage = 'Erro de permissão. Verifique se a policy RLS foi criada. Execute o script criar-policy-admin-update-profiles.sql no Supabase.';
        }
        
        throw new Error(`${errorMessage} (Código: ${error.code})`);
      }

      if (!data || data.length === 0) {
        console.error('❌ Nenhum dado retornado após atualização');
        console.error('Isso geralmente indica problema de RLS policy');
        throw new Error('Nenhum dado retornado. Verifique se a policy RLS "Admins can update any profile" foi criada no Supabase.');
      }

      console.log('✅ Pontos atualizados com sucesso!');
      console.log('Dados atualizados:', data[0]);
      console.log('=== FIM ATUALIZAÇÃO DE PONTOS ===');
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      console.error('Erro na mutation de atualização de pontos:', error);
    },
  });
}
