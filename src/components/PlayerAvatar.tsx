import React from 'react';
import { cn } from '../lib/utils';
import { resolveGradeRingColor } from '../lib/grades';

type AvatarSize = 'sm' | 'md' | 'lg';

interface PlayerAvatarProps {
  name: string;
  grade: string;
  isBot: boolean;
  size?: AvatarSize;
  showGradeRing?: boolean;
}

const SIZE_CLASSES: Record<AvatarSize, { circle: string; text: string; ring: string }> = {
  sm: { circle: 'w-9 h-9', text: 'text-sm', ring: 'ring-2 ring-offset-1' },
  md: { circle: 'w-12 h-12', text: 'text-xl', ring: 'ring-4 ring-offset-2' },
  lg: { circle: 'w-16 h-16', text: 'text-2xl', ring: 'ring-4 ring-offset-2' },
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  grade,
  isBot,
  size = 'md',
  showGradeRing = true,
}) => {
  const initials = name.substring(0, 2).toUpperCase();
  const { circle, text, ring } = SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        'shrink-0 rounded-full flex items-center justify-center font-bold text-white',
        circle,
        text,
        showGradeRing && ['ring-offset-white', ring, resolveGradeRingColor(grade)],
        isBot ? 'bg-slate-400' : 'bg-primary'
      )}
    >
      {initials}
    </div>
  );
};
