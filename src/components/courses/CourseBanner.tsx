import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useCourseBanner } from '@/hooks/useCourseBanner';

export function CourseBanner() {
  const { data: banner, isLoading, error } = useCourseBanner();
  
  // Sempre mostrar o banner, mesmo se houver erro ou não houver dados
  // O placeholder será mostrado se não houver banner configurado

  const BannerContent = () => {
    if (!banner) {
      return (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/50 w-full bg-muted/30 flex items-center justify-center" style={{ minHeight: '100px', height: 'auto' }}>
          <div className="text-center p-4 w-full">
            <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Espaço para banner promocional
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">
              Configure no painel admin
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-2xl border border-border w-full" style={{ minHeight: '100px', height: 'auto' }}>
        {banner.image_url ? (
          <img 
            src={banner.image_url} 
            alt={banner.title || 'Banner'} 
            className="w-full h-auto object-cover block"
            loading="lazy"
            style={{ minHeight: '100px' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-orange-500/20" style={{ minHeight: '100px' }} />
        )}
        
        {(banner.title || banner.description) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
            <div className="p-3 sm:p-4 md:p-6 w-full">
              {banner.title && (
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">
                  {banner.title}
                </h3>
              )}
              {banner.description && (
                <p className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 sm:line-clamp-none">
                  {banner.description}
                </p>
              )}
              {banner.link_url && (
                <a
                  href={banner.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 sm:mt-3 text-primary hover:text-primary/80 font-medium text-xs sm:text-sm"
                >
                  Saiba mais
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Se estiver carregando, mostrar skeleton
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border w-full bg-muted animate-pulse" style={{ minHeight: '100px', height: 'auto' }} />
    );
  }

  // Se houver erro, ainda mostrar o placeholder para que o espaço seja visível
  if (error) {
    console.warn('Erro ao carregar banner:', error);
    // Continuar e mostrar placeholder mesmo com erro
  }

  // Se houver banner apenas com link (sem título/descrição), tornar o banner inteiro clicável
  if (banner && banner.link_url && !banner.title && !banner.description) {
    return (
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <BannerContent />
      </a>
    );
  }

  // Sempre renderizar o conteúdo do banner (pode ser placeholder se não houver banner)
  return <BannerContent />;
}

