import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BadgeData {
  badge_id: string;
  badges: {
    name: string;
    icon: string;
    points_required: number | null;
  };
}

interface PostBadgesProps {
  badges: BadgeData[];
  maxDisplay?: number;
}

export function PostBadges({ badges, maxDisplay = 3 }: PostBadgesProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  // Sort by points_required descending to show highest achievements first
  const sortedBadges = [...badges].sort(
    (a, b) => (b.badges.points_required || 0) - (a.badges.points_required || 0)
  );

  const displayBadges = sortedBadges.slice(0, maxDisplay);
  const remainingCount = sortedBadges.length - maxDisplay;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5 flex-wrap">
        {displayBadges.map((badge) => (
          <Tooltip key={badge.badge_id}>
            <TooltipTrigger asChild>
              <span className="text-[8px] cursor-pointer hover:scale-110 transition-transform leading-none">
                {badge.badges.icon}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">{badge.badges.icon} {badge.badges.name}</p>
              {badge.badges.points_required && (
                <p className="text-muted-foreground text-[10px] mt-0.5">
                  {badge.badges.points_required} pontos necessários
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                +{remainingCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>+{remainingCount} conquistas adicionais</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
