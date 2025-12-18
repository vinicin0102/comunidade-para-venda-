import { useParams, useNavigate } from 'react-router-dom';
import { useLesson, useLessons, useModules, Lesson as LessonType } from '@/hooks/useCourses';
import { ArrowLeft, ArrowRight, ExternalLink, Clock, ChevronDown, ChevronUp, List, CheckCircle2, Circle, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { ModuleCompletionCelebration } from '@/components/courses/ModuleCompletionCelebration';
function VideoPlayer({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    // Limpar container
    containerRef.current.innerHTML = '';

    // Normalizar aspas curvas para aspas retas
    const normalizedCode = code
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/'/g, "'");

    // Detectar tipo de player
    const isPandaVideo = normalizedCode.includes('pandavideo.com') || normalizedCode.includes('panda-');
    const isVturb = normalizedCode.includes('vturb-smartplayer') || normalizedCode.includes('converteai.net');
    const isVoomly = normalizedCode.includes('voomly.com') || normalizedCode.includes('voomly-embed');
    const isIframe = normalizedCode.includes('<iframe');

    if (isPandaVideo) {
      // Panda Video - extrair e criar iframe com todos os atributos
      const iframeMatch = normalizedCode.match(/<iframe[^>]*>/i);
      
      if (iframeMatch) {
        // Extrair src do iframe
        const srcMatch = normalizedCode.match(/src="([^"]+)"/i) || normalizedCode.match(/src='([^']+)'/i);
        // Extrair id do iframe
        const idMatch = normalizedCode.match(/id="([^"]+)"/i) || normalizedCode.match(/id='([^']+)'/i);
        // Extrair allow
        const allowMatch = normalizedCode.match(/allow="([^"]+)"/i) || normalizedCode.match(/allow='([^']+)'/i);
        
        const iframe = document.createElement('iframe');
        
        if (srcMatch) {
          iframe.src = srcMatch[1];
        }
        
        if (idMatch) {
          iframe.id = idMatch[1];
        }
        
        if (allowMatch) {
          iframe.setAttribute('allow', allowMatch[1]);
        } else {
          iframe.setAttribute('allow', 'accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture');
        }
        
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        iframe.setAttribute('fetchpriority', 'high');
        
        containerRef.current.appendChild(iframe);
      } else {
        // Fallback: inserir código HTML diretamente
        containerRef.current.innerHTML = normalizedCode;
      }
    } else if (isVturb) {
      // Vturb player
      const scriptMatch = normalizedCode.match(/s\.src="([^"]+)"/);
      const playerIdMatch = normalizedCode.match(/id="([^"]+)"/);

      if (scriptMatch && playerIdMatch) {
        const scriptSrc = scriptMatch[1];
        const playerId = playerIdMatch[1];

        const player = document.createElement('vturb-smartplayer');
        player.id = playerId;
        player.style.cssText = 'display: block; margin: 0 auto; width: 100%;';
        containerRef.current.appendChild(player);

        const script = document.createElement('script');
        script.src = scriptSrc;
        script.async = true;
        document.head.appendChild(script);

        return () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        };
      }
    } else if (isVoomly) {
      // Voomly player - extrair iframe src
      const iframeSrcMatch = normalizedCode.match(/src="([^"]+voomly[^"]+)"/);
      
      if (iframeSrcMatch) {
        const iframe = document.createElement('iframe');
        iframe.src = iframeSrcMatch[1];
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        containerRef.current.appendChild(iframe);
      } else {
        // Fallback: inserir código HTML diretamente
        containerRef.current.innerHTML = normalizedCode;
      }
    } else if (isIframe) {
      // Iframe genérico - inserir código HTML diretamente
      containerRef.current.innerHTML = normalizedCode;
    } else {
      // Fallback: tentar inserir código diretamente
      containerRef.current.innerHTML = normalizedCode;
    }
  }, [code]);

  return (
    <div 
      ref={containerRef}
      className="w-full aspect-video bg-black rounded-lg overflow-hidden"
    />
  );
}

// Função para detectar e converter URLs em links clicáveis
function linkifyText(text: string): (string | { url: string; text: string })[] {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  
  const parts: (string | { url: string; text: string })[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    let url = match[0];
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    parts.push({ url, text: match[0] });
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

function LessonSidebar({ 
  lessons, 
  currentLessonId, 
  moduleId,
  isOpen,
  onToggle,
  isCompleted,
  completedCount
}: { 
  lessons: LessonType[]; 
  currentLessonId: string;
  moduleId: string;
  isOpen: boolean;
  onToggle: () => void;
  isCompleted: (lessonId: string) => boolean;
  completedCount: number;
}) {
  const navigate = useNavigate();
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[#222] transition-colors"
      >
        <span className="font-medium text-white flex items-center gap-2">
          <List className="w-4 h-4" />
          Aulas do módulo
          <span className="text-xs text-gray-400 font-normal">
            ({completedCount}/{lessons.length})
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary font-medium">{progressPercent}%</span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {/* Progress bar */}
      <div className="h-1 bg-[#2a2a2a]">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {isOpen && (
        <div className="border-t border-[#2a2a2a] max-h-64 overflow-y-auto">
          {lessons.map((lesson, index) => {
            const completed = isCompleted(lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => navigate(`/courses/${moduleId}/${lesson.id}`)}
                className={cn(
                  'w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left transition-colors',
                  lesson.id === currentLessonId
                    ? 'bg-primary/20 border-l-2 border-primary'
                    : 'hover:bg-[#222]'
                )}
              >
                {completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                ) : (
                  <span className={cn(
                    'w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-medium border shrink-0',
                    lesson.id === currentLessonId
                      ? 'border-primary text-primary'
                      : 'border-gray-600 text-gray-400'
                  )}>
                    {index + 1}
                  </span>
                )}
                <span className={cn(
                  'text-xs sm:text-sm truncate flex-1',
                  completed ? 'text-green-400' : lesson.id === currentLessonId ? 'text-white font-medium' : 'text-gray-300'
                )}>
                  {lesson.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Lesson() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { data: lesson, isLoading: lessonLoading } = useLesson(lessonId || '');
  const { data: lessons, isLoading: lessonsLoading } = useLessons(moduleId);
  const { data: modules } = useModules();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { isCompleted, toggleComplete, completedLessons } = useLessonProgress();
  const currentModule = modules?.find(m => m.id === moduleId);
  const currentIndex = lessons?.findIndex(l => l.id === lessonId) ?? -1;
  const prevLesson = currentIndex > 0 ? lessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex < (lessons?.length ?? 0) - 1 ? lessons?.[currentIndex + 1] : null;

  // Verificar se o módulo foi completado
  useEffect(() => {
    if (!moduleId || !lessons || lessons.length === 0) return;

    const publishedLessons = lessons.filter(l => l.is_published);
    if (publishedLessons.length === 0) return;

    const allCompleted = publishedLessons.every(l => completedLessons.includes(l.id));
    
    if (allCompleted) {
      // Verificar se já mostramos a celebração para este módulo
      const celebrationKey = `module_completed_${moduleId}`;
      const alreadyShown = localStorage.getItem(celebrationKey);
      
      if (!alreadyShown && currentModule) {
        setShowCelebration(true);
        localStorage.setItem(celebrationKey, 'true');
      }
    }
  }, [completedLessons, lessons, moduleId, currentModule]);

  if (lessonLoading || lessonsLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6 bg-[#1a1a1a]" />
          <Skeleton className="aspect-video w-full bg-[#1a1a1a] rounded-lg mb-6" />
          <Skeleton className="h-8 w-3/4 bg-[#1a1a1a] mb-4" />
          <Skeleton className="h-20 w-full bg-[#1a1a1a]" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-4">Aula não encontrada</h1>
          <Button onClick={() => navigate('/courses')} variant="outline">
            Voltar para Aulas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ModuleCompletionCelebration
        moduleTitle={currentModule?.title || 'Módulo'}
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/courses')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-primary font-medium truncate">
              {currentModule?.title || 'Módulo'}
            </p>
            <h1 className="text-lg font-bold text-white truncate">{lesson.title}</h1>
          </div>
        </div>

        {/* Video Player ou PDF */}
        {lesson.pdf_url ? (
          <div className="w-full bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 rounded-lg p-3">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Material em PDF</h3>
                    <p className="text-sm text-gray-400">Documento da aula</p>
                  </div>
                </div>
                <Button
                  onClick={() => window.open(lesson.pdf_url || '', '_blank')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Abrir PDF
                </Button>
              </div>
              <div className="aspect-[4/3] bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#2a2a2a]">
                <iframe
                  src={`${lesson.pdf_url}#toolbar=0`}
                  className="w-full h-full"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </div>
        ) : lesson.vturb_code ? (
          <VideoPlayer code={lesson.vturb_code} />
        ) : (
          <div className="w-full aspect-video bg-[#1a1a1a] rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Vídeo não disponível</p>
          </div>
        )}

        {/* Lesson Info */}
        <div className="mt-6 space-y-4">
          {/* Mark as complete button */}
          <Button
            onClick={() => toggleComplete(lessonId || '')}
            variant={isCompleted(lessonId || '') ? "secondary" : "default"}
            className={cn(
              "w-full",
              isCompleted(lessonId || '') && "bg-green-600/20 text-green-400 hover:bg-green-600/30 border-green-600/50"
            )}
          >
            {isCompleted(lessonId || '') ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Concluída
              </>
            ) : (
              <>
                <Circle className="w-5 h-5 mr-2" />
                Marcar como concluída
              </>
            )}
          </Button>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            {lesson.duration_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {lesson.duration_minutes} minutos
              </span>
            )}
          </div>

          {lesson.description && (
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
              <h3 className="font-medium text-white mb-2">Descrição</h3>
              <p className="text-gray-400 text-sm whitespace-pre-wrap">
                {linkifyText(lesson.description).map((part, i) => 
                  typeof part === 'string' ? part : (
                    <a 
                      key={i}
                      href={part.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {part.text}
                    </a>
                  )
                )}
              </p>
            </div>
          )}

          {/* External Links */}
          {lesson.external_links && lesson.external_links.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
              <h3 className="font-medium text-white mb-3">Materiais</h3>
              <div className="space-y-2">
                {lesson.external_links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Lesson Sidebar */}
          {lessons && lessons.length > 1 && (
            <LessonSidebar
              lessons={lessons}
              currentLessonId={lessonId || ''}
              moduleId={moduleId || ''}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              isCompleted={isCompleted}
              completedCount={lessons.filter(l => completedLessons.includes(l.id)).length}
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => prevLesson && navigate(`/courses/${moduleId}/${prevLesson.id}`)}
              disabled={!prevLesson}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button
              onClick={() => nextLesson && navigate(`/courses/${moduleId}/${nextLesson.id}`)}
              disabled={!nextLesson}
              className="flex-1"
            >
              Próxima
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
