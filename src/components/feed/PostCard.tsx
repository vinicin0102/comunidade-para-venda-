import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Shield, Gem, Medal, Award, Sparkles, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Post, useLikePost, useUserLikes, useDeleteOwnPost } from '@/hooks/usePosts';
import { CommentsSection } from './CommentsSection';
import { useDeletePost, useIsSupport } from '@/hooks/useSupport';
import { PostBadges } from '@/components/badges/PostBadges';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
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
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
}

const getTierBadge = (tier?: string) => {
  switch (tier) {
    case 'diamond':
      return { emoji: '💎', label: 'Diamante', color: 'text-cyan-400' };
    case 'platinum':
      return { emoji: '✨', label: 'Platina', color: 'text-gray-300' };
    case 'gold':
      return { emoji: '🏆', label: 'Ouro', color: 'text-yellow-500' };
    case 'silver':
      return { emoji: '🥈', label: 'Prata', color: 'text-gray-400' };
    case 'bronze':
      return { emoji: '🥉', label: 'Bronze', color: 'text-amber-600' };
    default:
      return null;
  }
};

const getPlanBadge = (plan?: string) => {
  switch (plan) {
    case 'diamond':
      return { emoji: '💎', label: 'Diamond', className: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' };
    case 'premium':
      return { emoji: '⭐', label: 'Premium', className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' };
    case 'basic':
      return { emoji: '🔹', label: 'Basic', className: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' };
    case 'free':
      return { emoji: '🆓', label: 'Free', className: 'bg-gray-600 text-white' };
    default:
      return null;
  }
};

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const likePost = useLikePost();
  const { data: userLikes = [] } = useUserLikes();
  const deletePostSupport = useDeletePost();
  const deleteOwnPost = useDeleteOwnPost();
  const isSupport = useIsSupport();
  const { user } = useAuth();
  
  const isLiked = userLikes.includes(post.id);
  const profile = post.profiles;
  const isSupportPost = post.is_support_post || profile?.role === 'support' || profile?.role === 'admin';
  const isOwnPost = user?.id === post.user_id;
  
  // Debug: verificar se está detectando corretamente
  if (process.env.NODE_ENV === 'development') {
    if (user?.id && post.user_id) {
      console.log('PostCard Debug:', {
        userId: user.id,
        postUserId: post.user_id,
        isOwnPost,
        isSupport,
        showMenu: isOwnPost || isSupport
      });
    }
  }

  const handleDelete = async () => {
    try {
      if (isSupport) {
        await deletePostSupport.mutateAsync(post.id);
      } else if (isOwnPost) {
        await deleteOwnPost.mutateAsync(post.id);
      } else {
        throw new Error('Sem permissão para deletar');
      }
      toast.success('Publicação removida');
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover publicação');
    }
  };

  const handleLike = async () => {
    try {
      await likePost.mutateAsync(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <Card className={cn(
      "mb-4 animate-slide-up overflow-hidden border shadow-sm",
      isSupportPost 
        ? "border-primary/50 bg-[#1a1a1a] ring-2 ring-primary/20" 
        : "border-[#2a2a2a] bg-[#1a1a1a]"
    )}>
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4 pt-4">
        <Avatar className="h-12 w-12 border-2 border-card">
          <AvatarImage 
            src={profile?.avatar_url || ''} 
            className="object-cover object-center"
          />
          <AvatarFallback className="gradient-primary text-primary-foreground font-semibold text-base">
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-base leading-tight truncate text-white">
              {profile?.full_name || profile?.username || 'Usuário'}
            </p>
            {/* Mostrar plano de assinatura se existir */}
            {getPlanBadge((profile as any)?.subscription_plan) && (
              <Badge className={cn(
                "border-0 text-[10px] px-1.5 py-0",
                getPlanBadge((profile as any)?.subscription_plan)?.className
              )}>
                {getPlanBadge((profile as any)?.subscription_plan)?.emoji} {getPlanBadge((profile as any)?.subscription_plan)?.label}
              </Badge>
            )}
            {/* Mostrar badges/conquistas */}
            {(() => {
              const hasBadges = post.user_badges && post.user_badges.length > 0;
              if (hasBadges) {
                console.log(`✅ PostCard: ${profile?.username} has ${post.user_badges.length} badges:`, post.user_badges);
              } else {
                console.log(`⚠️ PostCard: ${profile?.username} has no badges. user_badges:`, post.user_badges);
              }
              return hasBadges && post.user_badges ? (
                <PostBadges badges={post.user_badges} maxDisplay={3} />
              ) : null;
            })()}
            {isSupportPost && (
              <Badge className="bg-primary text-white text-xs px-2 py-0.5">
                <Shield className="h-3 w-3 mr-1" />
                Suporte
              </Badge>
            )}
          </div>
          {profile?.username && profile?.full_name && (
            <p className="text-xs text-gray-400 truncate">
              {profile.username}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(post.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(isOwnPost || isSupport) && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 flex-shrink-0 text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                  {(isOwnPost || isSupport) && (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir publicação
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      Remover publicação
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Tem certeza que deseja remover esta publicação? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      onClick={() => setShowDeleteDialog(false)}
                      className="bg-[#2a2a2a] text-white border-[#3a3a3a] hover:bg-[#3a3a3a]"
                    >
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={deleteOwnPost.isPending || deletePostSupport.isPending}
                    >
                      {deleteOwnPost.isPending || deletePostSupport.isPending ? 'Removendo...' : 'Remover'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4 px-4">
        {/* Mostrar conteúdo apenas se não for apenas emoji ou espaço */}
        {post.content && post.content.trim() && post.content.trim() !== '📷' && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3 text-white">{post.content}</p>
        )}
        
        {post.image_url && (
          <div className={cn(
            "rounded-lg overflow-hidden bg-[#2a2a2a]",
            post.content && post.content.trim() && post.content.trim() !== '📷' ? "mt-3" : ""
          )}>
            <img 
              src={post.image_url} 
              alt="Post" 
              className="w-full max-h-[600px] object-cover"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3 pt-0">
        <div className="flex items-center justify-between w-full border-t border-[#2a2a2a] pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likePost.isPending}
            className={cn(
              'gap-2 transition-all text-gray-400 hover:text-white',
              isLiked && 'text-red-500 hover:text-red-500'
            )}
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
            <span className="text-white">{post.likes_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2 text-gray-400 hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-white">{post.comments_count}</span>
          </Button>
        </div>

        {showComments && (
          <div className="w-full border-t border-[#2a2a2a] pt-3">
            <CommentsSection postId={post.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
