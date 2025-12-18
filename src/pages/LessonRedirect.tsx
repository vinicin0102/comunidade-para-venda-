import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLesson } from '@/hooks/useCourses';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function LessonRedirect() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { data: lesson, isLoading, error } = useLesson(lessonId || '');
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    if (redirectAttempted) return;
    
    if (lesson && lesson.module_id) {
      setRedirectAttempted(true);
      navigate(`/courses/${lesson.module_id}/${lesson.id}`, { replace: true });
    } else if (!isLoading && (!lesson || error)) {
      // Se a aula não foi encontrada, redireciona para a página de cursos
      setRedirectAttempted(true);
      navigate('/courses', { replace: true });
    }
  }, [lesson, isLoading, error, navigate, redirectAttempted]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-32 mb-4 bg-[#1a1a1a] mx-auto" />
          <p className="text-gray-400 text-sm">Carregando aula...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-4">Aula não encontrada</h1>
          <p className="text-gray-400 mb-6">A aula que você está procurando não existe ou foi removida.</p>
          <Button onClick={() => navigate('/courses')} variant="outline">
            Voltar para Aulas
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

