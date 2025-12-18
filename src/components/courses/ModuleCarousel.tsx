import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Image as ImageIcon } from 'lucide-react';
import { Module } from '@/hooks/useCourses';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useUnlockedModules } from '@/hooks/useUnlockedModules';
import { cn } from '@/lib/utils';
import { DiamondOfferModal } from './DiamondOfferModal';

interface ModuleCardProps {
  module: Module;
  progress: number;
  isLocked?: boolean;
  onClick: () => void;
}

function ModuleCard({ module, progress, isLocked = false, onClick }: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[160px] md:w-[200px] rounded-2xl overflow-hidden transition-all duration-300 relative",
        "bg-card text-left cursor-pointer",
        isLocked 
          ? "grayscale border-2 border-border hover:border-cyan-500/50 hover:grayscale-0" 
          : "border-2 border-primary/60 shadow-[0_0_20px_rgba(251,146,60,0.3),inset_0_0_20px_rgba(251,146,60,0.05)]"
      )}
    >
      {/* Card image - vertical phone-like aspect ratio */}
      <div className="relative aspect-[9/16] overflow-hidden">
        {module.cover_url ? (
          <img 
            src={module.cover_url} 
            alt={module.title} 
            className={cn(
              "w-full h-full object-cover",
              isLocked && "grayscale"
            )} 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange-500/10 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        {/* Progress badge - top left */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-md bg-black/70 backdrop-blur-sm">
          <span className="text-xs font-bold text-white">{progress} %</span>
        </div>
        
        {/* Lock icon - top right (only for locked modules) */}
        {isLocked && (
          <div className="absolute top-3 right-3 p-2 rounded-full bg-black/70 backdrop-blur-sm">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
        
        {/* Module title - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 uppercase tracking-wide">
            {module.title}
          </h3>
        </div>
      </div>
    </button>
  );
}

interface ModuleCarouselProps {
  modules: Module[];
  onModuleSelect: (module: Module) => void;
}

export function ModuleCarousel({ modules, onModuleSelect }: ModuleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDiamondOffer, setShowDiamondOffer] = useState(false);
  const { completedLessons } = useLessonProgress();
  const isAdmin = useIsAdmin();
  const { isUnlocked } = useUnlockedModules();
  const publishedModules = modules.filter(m => m.is_published);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = window.innerWidth < 768 ? 176 : 216; // card width + gap
    const newIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(publishedModules.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    scrollRef.current.scrollTo({ left: newIndex * cardWidth, behavior: 'smooth' });
  };

  const getModuleProgress = (module: Module) => {
    const lessons = module.lessons?.filter(l => l.is_published) || [];
    if (lessons.length === 0) return 0;
    const completed = lessons.filter(l => completedLessons.includes(l.id)).length;
    return Math.round((completed / lessons.length) * 100);
  };

  const isModuleLocked = (module: Module, index: number) => {
    // Admins can always access all modules
    if (isAdmin) return false;
    // Check if module is explicitly locked in database
    if (module.is_locked) {
      // Check if module is manually unlocked for this user
      if (isUnlocked(module.id)) return false;
      return true;
    }
    return false;
  };

  if (publishedModules.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section title with orange bar */}
      <div className="flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="text-xl font-bold text-foreground">Módulos do Curso</h2>
        </div>
        
        {/* Navigation arrows - square orange style */}
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')} 
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              currentIndex > 0 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )} 
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')} 
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              currentIndex < publishedModules.length - 1 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )} 
            disabled={currentIndex >= publishedModules.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Cards carousel */}
      <div 
        ref={scrollRef} 
        className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-6 scrollbar-hide scroll-smooth"
      >
        {publishedModules.map((module, index) => {
          const locked = isModuleLocked(module, index);
          const handleModuleClick = () => {
            if (locked) {
              // Se estiver bloqueado, mostrar oferta Diamond
              setShowDiamondOffer(true);
            } else {
              // Se não estiver bloqueado, selecionar módulo
              onModuleSelect(module);
            }
          };
          
          return (
            <ModuleCard 
              key={module.id} 
              module={module} 
              progress={getModuleProgress(module)} 
              isLocked={locked}
              onClick={handleModuleClick} 
            />
          );
        })}
      </div>

      {/* Modal de oferta Diamond */}
      <DiamondOfferModal 
        open={showDiamondOffer} 
        onOpenChange={setShowDiamondOffer} 
      />
    </div>
  );
}
