import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Module, Lesson } from '@/hooks/useCourses';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { cn } from '@/lib/utils';

interface ModuleLessonsProps {
  module: Module;
  onBack: () => void;
}

export function ModuleLessons({ module, onBack }: ModuleLessonsProps) {
  const navigate = useNavigate();
  const { completedLessons } = useLessonProgress();
  const publishedLessons = module.lessons?.filter(l => l.is_published) || [];
  const completedCount = publishedLessons.filter(l => completedLessons.includes(l.id)).length;
  const progress = publishedLessons.length > 0 ? Math.round((completedCount / publishedLessons.length) * 100) : 0;

  const handleLessonClick = (lesson: Lesson) => {
    navigate(`/lesson/${lesson.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <div className="h-48 md:h-64 relative overflow-hidden">
          {module.cover_url ? (
            <img src={module.cover_url} alt={module.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-orange-500/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <Button variant="ghost" size="icon" onClick={onBack} className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-full">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{module.title}</h1>
          {module.description && <p className="text-muted-foreground mt-2 max-w-2xl">{module.description}</p>}
        </div>
      </div>
      <div className="p-4 md:p-6 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-sm text-muted-foreground">Seu Progresso</p><p className="text-2xl font-bold text-foreground">{progress}% concluído</p></div>
            <div className="text-right"><p className="text-sm text-muted-foreground">Aulas</p><p className="text-lg font-semibold text-foreground">{completedCount}/{publishedLessons.length}</p></div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground px-1">Aulas do Módulo</h2>
          {publishedLessons.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center"><Play className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Nenhuma aula disponível ainda</p></div>
          ) : (
            <div className="space-y-2">
              {publishedLessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id);
                return (
                  <button key={lesson.id} onClick={() => handleLessonClick(lesson)} className={cn("w-full flex items-center gap-4 p-3 md:p-4 rounded-xl border transition-all bg-card border-border hover:border-primary/50 cursor-pointer", isCompleted && "border-green-500/30 bg-green-500/5")}>
                    <div className="w-20 h-12 md:w-28 md:h-16 rounded-lg overflow-hidden shrink-0 relative">
                      {lesson.cover_url ? <img src={lesson.cover_url} alt={lesson.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-muted-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", isCompleted ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground")}>{index + 1}</span>
                      </div>
                      <h3 className="font-medium truncate mt-1 text-foreground">{lesson.title}</h3>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3" />{lesson.duration_minutes || 0} min</span>
                    </div>
                    <div className="shrink-0">{isCompleted ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Play className="w-5 h-5 text-primary" />}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
