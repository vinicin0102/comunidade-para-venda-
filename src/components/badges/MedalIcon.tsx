import { Medal, Award, Trophy, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedalIconProps {
  type: 'beginner' | 'active' | 'engaged' | 'influencer' | 'legend';
  className?: string;
  size?: number;
}

const medalConfig = {
  beginner: {
    icon: Star,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
  },
  active: {
    icon: Medal,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
  },
  engaged: {
    icon: Award,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
  },
  influencer: {
    icon: Trophy,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
  },
  legend: {
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
  },
};

export function MedalIcon({ type, className, size = 32 }: MedalIconProps) {
  const config = medalConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-full p-2 flex items-center justify-center',
        config.bgColor,
        config.borderColor,
        'border-2',
        className
      )}
    >
      <Icon className={cn(config.color)} size={size} />
    </div>
  );
}

// Função helper para mapear pontos para tipo de medalha
export function getMedalTypeByPoints(points: number): MedalIconProps['type'] {
  if (points >= 500) return 'legend';
  if (points >= 300) return 'influencer';
  if (points >= 150) return 'engaged';
  if (points >= 50) return 'active';
  return 'beginner';
}

// Função helper para mapear nome do badge para tipo de medalha
export function getMedalTypeByName(name: string): MedalIconProps['type'] {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('lenda') || nameLower.includes('legend')) return 'legend';
  if (nameLower.includes('influenciador') || nameLower.includes('influencer')) return 'influencer';
  if (nameLower.includes('engajado') || nameLower.includes('engaged')) return 'engaged';
  if (nameLower.includes('ativo') || nameLower.includes('active')) return 'active';
  return 'beginner';
}

