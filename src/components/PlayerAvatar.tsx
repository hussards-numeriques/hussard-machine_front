import React from 'react';
import { cn } from '../lib/utils';
import { resolveGradeFrame } from '../lib/grades';

type AvatarSize = 'sm' | 'md' | 'lg';

interface PlayerAvatarProps {
  name: string;
  grade: string;
  isBot: boolean;
  size?: AvatarSize;
  showGradeRing?: boolean;
}

const SIZE_CLASSES: Record<AvatarSize, { circle: string; text: string; frame: string }> = {
  sm: { circle: 'w-9 h-9 border-2', text: 'text-sm', frame: 'p-[3px]' },
  md: { circle: 'w-12 h-12 border-[3px]', text: 'text-xl', frame: 'p-1' },
  lg: { circle: 'w-16 h-16 border-4', text: 'text-2xl', frame: 'p-[5px]' },
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  grade,
  isBot,
  size = 'md',
  showGradeRing = true,
}) => {
  const initials = name.substring(0, 2).toUpperCase();
  const { circle, text, frame } = SIZE_CLASSES[size];

  return (
    <div
      data-testid="player-avatar"
      className={cn(
        'shrink-0 rounded-full',
        showGradeRing && ['grade-frame', frame, resolveGradeFrame(grade)]
      )}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white border-white',
          circle,
          text,
          !showGradeRing && 'border-0',
          isBot ? 'bg-slate-400' : 'bg-primary'
        )}
      >
        {initials}
      </div>
    </div>
  );
};
