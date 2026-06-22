import React from 'react';
import { cn } from '../../lib/utils';

export type QuestState = 'secured' | 'soft-risk' | 'last-chance' | 'neutral';

interface DailyQuestIconProps {
  state: QuestState;
  size?: number;
  animated?: boolean;
}

const COLORS: Record<QuestState, string> = {
  secured: '#16a34a',
  'soft-risk': '#f59e0b',
  'last-chance': '#e11d48',
  neutral: '#cbd5e1',
};

export const DailyQuestIcon: React.FC<DailyQuestIconProps> = ({
  state,
  size = 18,
  animated = true,
}) => {
  const color = COLORS[state];
  return (
    <svg
      data-quest={state}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(state === 'last-chance' && animated && 'animate-quest-pulse')}
    >
      {state === 'secured' ? (
        <>
          <circle cx="12" cy="12" r="10" fill={color} />
          <path
            d="M7.5 12.3l3 3 6-6.2"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
          <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2.2" />
          <circle cx="12" cy="12" r="1.4" fill={color} />
        </>
      )}
    </svg>
  );
};
