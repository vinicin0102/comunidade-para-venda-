import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useModulesWithLessons, Lesson, Module } from '@/hooks/useCourses';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useUnlockedModules } from '@/hooks/useUnlockedModules';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ContinueWatching() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: modules, isLoading } = useModulesWithLessons();
  const { completedLessons } = useLessonProgress();
  const { isUnlocked } = useUnlockedModules();

  // Get watch progress from localStorage
  const getWatchProgress = (lessonId: string) => {
    try {
      const progress = localStorage.getItem(`lesson_progress_${lessonId}`);
      if (progress) {
        return JSON.parse(progress);
      }
    } catch (e) {
      console.error('Error reading progress:', e);
    }
    return null;
  };

  // Calculate progress percentage and time
  const getLessonProgress = (lesson: Lesson) => {
    const progress = getWatchProgress(lesson.id);
    if (!progress || !lesson.duration_minutes) {
      return { percentage: 0, currentMinutes: 0 };
    }
    
    const currentSeconds = progress.currentTime || 0;
    const totalSeconds = lesson.duration_minutes * 60;
    const percentage = totalSeconds > 0 ? Math.round((currentSeconds / totalSeconds) * 100) : 0;
    const currentMinutes = Math.floor(currentSeconds / 60);
    
    return { percentage, currentMinutes };
  };

  if (isLoading || !modules) return null;

  const incompleteLessons: { lesson: Lesson; module: Module; progress: { percentage: number; currentMinutes: number } }[] = [];
  modules.filter(m => m.is_published && (!m.is_locked || isUnlocked(m.id))).forEach(module => {
    module.lessons?.filter(l => l.is_published && !completedLessons.includes(l.id)).forEach(lesson => {
      const progress = getLessonProgress(lesson);
      // Only show lessons with some progress
      if (progress.percentage > 0) {
        incompleteLessons.push({ lesson, module, progress });
      }
    });
  });

  // Sort by progress (most recent first)
  incompleteLessons.sort((a, b) => b.progress.percentage - a.progress.percentage);

  const lessonsToShow = incompleteLessons.slice(0, 5);
  if (lessonsToShow.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = window.innerWidth < 640 ? 300 : 380;
    const newIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(lessonsToShow.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    scrollRef.current.scrollTo({ left: newIndex * cardWidth, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Section title with orange bar */}
      <div className="flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Continue Assistindo</h2>
        </div>
        
        {/* Navigation arrows */}
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')} 
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all",
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
              "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all",
              currentIndex < lessonsToShow.length - 1 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )} 
            disabled={currentIndex >= lessonsToShow.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal carousel - redesigned to match reference */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-6 scrollbar-hide scroll-smooth"
      >
        {lessonsToShow.map(({ lesson, module, progress }) => (
          <div 
            key={lesson.id} 
            className={cn(
              "flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] rounded-2xl overflow-hidden",
              "bg-card border border-border",
              "hover:border-primary/50 transition-all cursor-pointer"
            )}
            onClick={() => navigate(`/courses/${module.id}/${lesson.id}`)}
          >
            {/* Thumbnail - 16:9 aspect ratio */}
            <div className="relative w-full aspect-video bg-muted">
              {module.cover_url ? (
                <img 
                  src={module.cover_url} 
                  alt={module.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              {/* Module title - white */}
              <h3 className="font-bold text-foreground text-base line-clamp-1">
                {module.title}
              </h3>
              
              {/* Module description - gray */}
              {module.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {module.description}
                </p>
              )}
              
              {/* Lesson title - orange/primary */}
              <p className="text-sm text-primary font-medium line-clamp-1">
                {lesson.title}
              </p>
              
              {/* Progress and Continue button row */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold text-foreground">
                  {progress.percentage}%
                </span>
                
                <Button 
                  size="sm"
                  className="gap-2 bg-primary hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/courses/${module.id}/${lesson.id}`);
                  }}
                >
                  Continuar
                  <Play className="w-4 h-4" fill="currentColor" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
