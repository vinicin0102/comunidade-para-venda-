import { useProfile } from '@/hooks/useProfile';
import { GraduationCap, PlayCircle, Trophy, Flame } from 'lucide-react';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useModulesWithLessons } from '@/hooks/useCourses';

export function HeroBanner() {
  const { data: profile } = useProfile();
  const { completedLessons } = useLessonProgress();
  const { data: modules } = useModulesWithLessons();
  
  const totalLessons = modules?.reduce((acc, m) => acc + (m.lessons?.filter(l => l.is_published)?.length || 0), 0) || 0;
  const completedCount = completedLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#1a1a1a] border border-[#2a2a2a]">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Avatar e saudação */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-primary object-cover"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
            )}
            
            <div className="flex-1">
              <p className="text-gray-400 text-xs sm:text-sm">Bem-vindo de volta,</p>
              <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-[180px] sm:max-w-none">
                {profile?.full_name || profile?.username || 'Aluno'}
              </h2>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 sm:gap-4 sm:ml-auto w-full sm:w-auto">
            <div className="flex-1 sm:flex-none bg-[#1a1a1a]/80 rounded-xl p-2.5 sm:p-3 text-center min-w-[80px] sm:min-w-[90px]">
              <div className="flex items-center justify-center gap-1.5 text-primary mb-0.5">
                <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-base sm:text-lg font-bold">{completedCount}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">Aulas</p>
            </div>
            
            <div className="flex-1 sm:flex-none bg-[#1a1a1a]/80 rounded-xl p-2.5 sm:p-3 text-center min-w-[80px] sm:min-w-[90px]">
              <div className="flex items-center justify-center gap-1.5 text-green-500 mb-0.5">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-base sm:text-lg font-bold">{progressPercent}%</span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">Progresso</p>
            </div>
            
            <div className="flex-1 sm:flex-none bg-[#1a1a1a]/80 rounded-xl p-2.5 sm:p-3 text-center min-w-[80px] sm:min-w-[90px]">
              <div className="flex items-center justify-center gap-1.5 text-orange-500 mb-0.5">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-base sm:text-lg font-bold">{profile?.points || 0}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">Pontos</p>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs text-gray-400">Progresso geral</span>
            <span className="text-xs text-primary font-medium">{completedCount}/{totalLessons} aulas</span>
          </div>
          <div className="h-2 sm:h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
