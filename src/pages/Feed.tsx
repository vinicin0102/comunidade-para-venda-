import { MainLayout } from '@/components/layout/MainLayout';
import { CreatePostCard } from '@/components/feed/CreatePostCard';
import { PostCard } from '@/components/feed/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { Skeleton } from '@/components/ui/skeleton';
import { MotivationalNotificationButton } from '@/components/pwa/MotivationalNotificationButton';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Feed() {
  const { data: posts, isLoading } = usePosts();
  const [showCreateCard, setShowCreateCard] = useState(false);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* Header INÍCIO */}
        <div className="flex items-start justify-between mb-6 pt-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">INÍCIO</h1>
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              Faça publicações dos seus resultados para conquistar pontos e trocar por prêmios, além de incentivar outros alunos!
            </p>
            <p className="text-gray-400 text-xs">
              Comunidade • {posts?.length || 0} {posts?.length === 1 ? 'publicação' : 'publicações'}
            </p>
            <div className="mt-3">
              <MotivationalNotificationButton />
            </div>
          </div>
          <Button
            onClick={() => setShowCreateCard(!showCreateCard)}
            className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 flex-shrink-0 ml-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar
          </Button>
        </div>

        {showCreateCard && (
          <div className="mb-6">
            <CreatePostCard />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-[#2a2a2a]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-[#2a2a2a]" />
                    <Skeleton className="h-3 w-16 bg-[#2a2a2a]" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mb-3 bg-[#2a2a2a]" />
                <Skeleton className="h-8 w-full bg-[#2a2a2a]" />
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="text-center py-16">
            <h3 className="text-white text-lg font-semibold mb-4">
              Nenhuma publicação ainda
            </h3>
            <Button
              onClick={() => setShowCreateCard(true)}
              className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 text-base font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar primeira publicação
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
