import React from 'react';
import { useTranslation } from 'react-i18next';
import { resolveGradeLabel, resolveGradeMetal } from '../../lib/grades';
import { cn } from '../../lib/utils';

interface GradeUpCelebrationProps {
  grade: string;
  revealed: boolean;
  medalRef?: React.Ref<HTMLDivElement>;
}

const Star: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden="true">
    <path
      d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
      fill="var(--metal-ink)"
      opacity="0.85"
    />
  </svg>
);

export const GradeUpCelebration: React.FC<GradeUpCelebrationProps> = ({
  grade,
  revealed,
  medalRef,
}) => {
  const { t } = useTranslation();
  const metal = resolveGradeMetal(grade);

  return (
    <div
      data-testid="grade-up-celebration"
      aria-live="polite"
      className={cn('flex items-center gap-4 py-2', metal, !revealed && 'invisible')}
    >
      {revealed && (
        <>
          <div ref={medalRef} className="relative shrink-0 motion-safe:animate-medal-drop">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-4 motion-safe:animate-grade-burst motion-reduce:hidden"
              style={{ borderColor: 'var(--metal-mid)' }}
            />
            <div className="relative grade-ring rounded-full p-1.5 shadow-lg">
              <div
                className="relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, var(--metal-light), var(--metal-mid) 60%, var(--metal-dark))',
                }}
              >
                <Star />
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-1/3 bg-white/70 blur-[2px] motion-safe:animate-medal-shine motion-reduce:hidden"
                />
              </div>
            </div>
          </div>
          <div className="min-w-0 motion-safe:animate-rise-in [animation-delay:250ms]">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">
              {t('grade.newGrade')}
            </div>
            <div
              className="text-3xl font-black leading-tight"
              style={{ color: 'var(--metal-dark)' }}
            >
              {resolveGradeLabel(grade, t)}
            </div>
          </div>
        </>
      )}
      {!revealed && <div className="h-[4.25rem]" />}
    </div>
  );
};
