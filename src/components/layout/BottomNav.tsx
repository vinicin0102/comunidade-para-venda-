import { Home, MessageCircle, Trophy, Gift, BookOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: BookOpen, label: 'Aulas', path: '/courses' },
  { icon: MessageCircle, label: 'Chat', path: '/chat' },
  { icon: Trophy, label: 'Ranking', path: '/ranking' },
  { icon: Gift, label: 'Prêmios', path: '/rewards' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2a2a2a] bg-[#1a1a1a]/95 backdrop-blur-md bottom-nav" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="container flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative rounded-full p-1.5 transition-all duration-200',
                isActive && 'bg-accent'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-all duration-200',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
