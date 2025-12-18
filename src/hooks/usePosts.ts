import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface UserBadge {
  badge_id: string;
  badges: {
    name: string;
    icon: string;
    points_required: number | null;
  };
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  likes_count: number;
  comments_count: number;
  is_support_post?: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
    role?: 'user' | 'support' | 'admin';
    subscription_plan?: string;
    tier?: string;
  } | null;
  user_badges?: UserBadge[];
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export function usePosts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      // Get unique user IDs
      const userIds = [...new Set((posts as any[]).map(p => p.user_id))];
      
      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);
      
      // Fetch user badges with badge details
      let userBadges: any[] = [];
      if (userIds.length > 0) {
        const { data, error: badgesError } = await supabase
          .from('user_badges')
          .select('user_id, badge_id, badges(name, icon, points_required)')
          .in('user_id', userIds);
        
        if (badgesError) {
          console.error('❌ Error fetching user badges:', badgesError);
        } else {
          userBadges = data || [];
          console.log('✅ Fetched user badges:', userBadges.length, 'badges for', userIds.length, 'users');
        }
      }
      
      // Create maps for quick lookup
      const profileMap = new Map((profiles as any[] || []).map(p => [p.user_id, p]));
      
      // Group badges by user_id
      const badgesMap = new Map<string, UserBadge[]>();
      userBadges.forEach(ub => {
        if (ub && ub.user_id && ub.badges) {
          const existing = badgesMap.get(ub.user_id) || [];
          existing.push({ badge_id: ub.badge_id, badges: ub.badges });
          badgesMap.set(ub.user_id, existing);
        }
      });
      
      console.log('📊 Badges map:', Array.from(badgesMap.entries()).map(([uid, badges]) => ({ user_id: uid, count: badges.length })));
      
      // Combine posts with profiles and badges
      const postsWithData = (posts as any[]).map(post => {
        const postBadges = badgesMap.get(post.user_id) || [];
        if (postBadges.length > 0) {
          console.log(`🎖️ Post from ${profileMap.get(post.user_id)?.username} has ${postBadges.length} badges:`, postBadges.map(b => b.badges.name));
        }
        return {
          ...post,
          profiles: profileMap.get(post.user_id) || null,
          user_badges: postBadges
        };
      }) as Post[];
      
      return postsWithData;
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, imageUrl, isSupport }: { content: string; imageUrl?: string; isSupport?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Verificar se está mutado
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      const profile = profileData as { is_muted?: boolean; mute_until?: string | null; role?: string } | null;
      
      if (profile?.is_muted) {
        const muteUntil = profile.mute_until ? new Date(profile.mute_until) : null;
        const now = new Date();
        
        // Se tem data de expiração e já passou, não está mais mutado
        if (muteUntil && muteUntil < now) {
          // Atualizar status no banco
          await (supabase.from('profiles') as any)
            .update({ is_muted: false, mute_until: null })
            .eq('user_id', user.id);
        } else {
          // Está mutado
          const daysLeft = muteUntil 
            ? Math.ceil((muteUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          throw new Error(
            muteUntil 
              ? `Você está mutado por mais ${daysLeft} dia(s). Você não pode criar publicações.`
              : 'Você está mutado permanentemente. Você não pode criar publicações.'
          );
        }
      }
      
      // Verificar se é suporte
      let isSupportPost = isSupport || false;
      if (!isSupportPost) {
        isSupportPost = profile?.role === 'support' || profile?.role === 'admin';
      }
      
      // Garantir que content não seja null (usar espaço se vazio, pois o banco exige NOT NULL)
      const postContent = content?.trim() || ' ';
      
      const { data, error } = await (supabase.from('posts') as any)
        .insert({
          user_id: user.id,
          content: postContent,
          image_url: imageUrl || null,
          is_support_post: isSupportPost,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar post:', error);
        throw new Error(error.message || 'Erro ao criar publicação');
      }
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // Forçar atualização imediata do perfil
      await queryClient.refetchQueries({ queryKey: ['profile'] });
      
      // Mostrar notificação imediata (fallback caso banco não crie)
      // Se o banco criar, o usePointsNotifications vai mostrar também, mas com debounce
      setTimeout(() => {
        toast.success('Pontos Ganhos!', {
          description: '+5 pontos por criar uma publicação!',
          duration: 4000,
        });
      }, 500);
    },
  });
}

export function useDeleteOwnPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Buscar o post para verificar se o usuário é o dono
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id, image_url')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;
      if (!post) throw new Error('Post não encontrado');

      // Verificar se o usuário é o dono
      if (post.user_id !== user.id) {
        throw new Error('Você não tem permissão para deletar esta publicação');
      }

      // Deletar imagem do storage se existir
      if (post.image_url) {
        try {
          const imagePath = post.image_url.split('/').pop()?.split('?')[0];
          if (imagePath) {
            const { error: deleteImageError } = await supabase.storage
              .from('posts')
              .remove([imagePath]);
            
            if (deleteImageError) {
              console.error('Erro ao deletar imagem:', deleteImageError);
              // Continua mesmo se falhar ao deletar a imagem
            }
          }
        } catch (error) {
          console.error('Erro ao processar imagem:', error);
          // Continua mesmo se falhar
        }
      }

      // Deletar o post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: existingLike } = await supabase
        .from('likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingLike) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        return { liked: false };
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;
        return { liked: true };
      }
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['likes'] });
      queryClient.invalidateQueries({ queryKey: ['user_likes'] });
      
      // Forçar atualização imediata do perfil
      await queryClient.refetchQueries({ queryKey: ['profile'] });
      
      // Mostrar notificação apenas quando curtir (não quando descurtir)
      if (data.liked) {
        // A notificação será criada pelo trigger do banco para o dono do post
        // Aqui apenas invalidamos as queries para atualizar os pontos
      }
    },
  });
}

export function useUserLikes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['likes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(like => like.post_id);
    },
    enabled: !!user,
  });
}

export function useComments(postId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (commentsError) throw commentsError;
      
      // Get unique user IDs
      const userIds = [...new Set(comments.map(c => c.user_id))];
      
      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);
      
      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      // Combine comments with profiles
      return comments.map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null
      })) as Comment[];
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Verificar se está mutado
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      const profile = profileData as { is_muted?: boolean; mute_until?: string | null } | null;
      
      if (profile?.is_muted) {
        const muteUntil = profile.mute_until ? new Date(profile.mute_until) : null;
        const now = new Date();
        
        // Se tem data de expiração e já passou, não está mais mutado
        if (muteUntil && muteUntil < now) {
          // Atualizar status no banco
          await (supabase.from('profiles') as any)
            .update({ is_muted: false, mute_until: null })
            .eq('user_id', user.id);
        } else {
          // Está mutado
          const daysLeft = muteUntil 
            ? Math.ceil((muteUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          throw new Error(
            muteUntil 
              ? `Você está mutado por mais ${daysLeft} dia(s). Você não pode comentar.`
              : 'Você está mutado permanentemente. Você não pode comentar.'
          );
        }
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // Forçar atualização imediata do perfil
      await queryClient.refetchQueries({ queryKey: ['profile'] });
      
      // Mostrar notificação imediata (fallback caso banco não crie)
      setTimeout(() => {
        toast.success('Pontos Ganhos!', {
          description: '+1 ponto por comentar!',
          duration: 4000,
        });
      }, 500);
    },
  });
}
