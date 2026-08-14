import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GameConfig } from '../../types';
import type { XpProgress } from '../../hooks/useXpProgress';
import { hasJustUnlockedPromotion } from '../../hooks/useXpProgress';
import { computeGradeDiffSegments, computeGradeProgress } from '../../lib/gradeProgress';
import { resolveGradeBarColor, resolveGradeBarLightColor } from '../../lib/grades';
import { cn } from '../../lib/utils';
import { GradeLabelRow } from './GradeLabelRow';
import { XpBarFooter } from './XpBarFooter';

interface EndGameXpProgressProps {
  progress: XpProgress;
  config: GameConfig;
}

const ANIMATE_DELAY_MS = 300;
const TRANSITION_DURATION_MS = 700;
const GLOW_DURATION_MS = 2000;

export const EndGameXpProgress: React.FC<EndGameXpProgressProps> = ({ progress, config }) => {
  const { before, after } = progress;
  const [animated, setAnimated] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const firedEffectRef = useRef(false);

  useEffect(() => {
    if (!after) {
      return;
    }
    const timeout = window.setTimeout(() => setAnimated(true), ANIMATE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [after]);

  const beforeGradeIndex = computeGradeProgress(
    before.experience,
    before.canPromote,
    config
  ).gradeIndex;
  const afterGradeIndex = after
    ? computeGradeProgress(after.experience, after.canPromote, config).gradeIndex
    : beforeGradeIndex;

  const justUnlockedPromotion = hasJustUnlockedPromotion(progress);
  const justCrossedGrade =
    after != null && afterGradeIndex > beforeGradeIndex && !justUnlockedPromotion;

  useEffect(() => {
    if (!animated || !justCrossedGrade || firedEffectRef.current) {
      return;
    }
    firedEffectRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGlowing(true);

    const rect = barRef.current?.getBoundingClientRect();
    confetti({
      particleCount: 24,
      spread: 45,
      startVelocity: 20,
      gravity: 1.2,
      scalar: 0.7,
      origin: rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.5 },
    });

    const timeout = window.setTimeout(() => setGlowing(false), GLOW_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [animated, justCrossedGrade]);

  const currentGradeIndex = computeGradeProgress(
    (after ?? before).experience,
    (after ?? before).canPromote,
    config
  ).gradeIndex;

  if (!after) {
    const { nextGrade, xpToNextGrade, segments } = computeGradeProgress(
      before.experience,
      before.canPromote,
      config
    );

    return (
      <div
        ref={barRef}
        className="w-full max-w-md bg-white p-6 rounded-3xl shadow-lg border-2 border-slate-100 space-y-2"
      >
        <h3 className="text-sm font-bold text-slate-500">Progression</h3>

        <GradeLabelRow segments={segments} />

        <div className="flex gap-1">
          {segments.map((segment) => (
            <div
              key={segment.grade}
              className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200"
            >
              <div
                className={cn('h-full rounded-full', resolveGradeBarColor(segment.grade))}
                style={{ width: `${segment.fillPercent}%` }}
              />
            </div>
          ))}
        </div>

        <XpBarFooter
          experience={before.experience}
          canPromote={before.canPromote}
          nextGrade={nextGrade}
          xpToNextGrade={xpToNextGrade}
        />
      </div>
    );
  }

  const diffSegments = computeGradeDiffSegments(before, after, config);
  const gainedXp = after.experience - before.experience;
  const { nextGrade, xpToNextGrade } = computeGradeProgress(
    after.experience,
    after.canPromote,
    config
  );

  return (
    <div
      ref={barRef}
      className="w-full max-w-md bg-white p-6 rounded-3xl shadow-lg border-2 border-slate-100 space-y-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-500">Progression</h3>
        <span
          className={cn(
            'text-lg font-black animate-pop-in',
            gainedXp >= 0 ? 'text-primary' : 'text-red-500'
          )}
        >
          {gainedXp >= 0 ? '+' : ''}
          {gainedXp} XP
        </span>
      </div>

      <GradeLabelRow
        segments={diffSegments.map((segment, i) => ({
          grade: segment.grade,
          isCurrent: i === currentGradeIndex,
        }))}
      />

      <div className="flex gap-1">
        {diffSegments.map((segment) => {
          const floorPercent = Math.min(segment.beforeFillPercent, segment.afterFillPercent);
          const gainPercent = Math.max(0, segment.afterFillPercent - segment.beforeFillPercent);
          const lossPercent = Math.max(0, segment.beforeFillPercent - segment.afterFillPercent);
          const isCrossedSegment =
            justCrossedGrade && segment.afterFillPercent === 100 && segment.beforeFillPercent < 100;

          return (
            <div key={segment.grade} className="relative flex-1">
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    resolveGradeBarColor(segment.grade)
                  )}
                  style={{ width: `${floorPercent}%` }}
                />
                {gainPercent > 0 && (
                  <div
                    className={cn(
                      'absolute inset-y-0 rounded-full transition-all ease-out',
                      resolveGradeBarLightColor(segment.grade)
                    )}
                    style={{
                      left: `${floorPercent}%`,
                      width: animated ? `${gainPercent}%` : '0%',
                      transitionDuration: `${TRANSITION_DURATION_MS}ms`,
                    }}
                  />
                )}
                {lossPercent > 0 && (
                  <div
                    className="absolute inset-y-0 rounded-full bg-red-300 transition-all ease-out"
                    style={{
                      left: `${floorPercent}%`,
                      width: animated ? '0%' : `${lossPercent}%`,
                      transitionDuration: `${TRANSITION_DURATION_MS}ms`,
                    }}
                  />
                )}
              </div>
              {glowing && isCrossedSegment && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none rounded-full animate-glow-pulse shadow-[0_0_12px_4px_rgba(251,191,36,0.7)]"
                />
              )}
            </div>
          );
        })}
      </div>

      <XpBarFooter
        experience={after.experience}
        canPromote={after.canPromote}
        nextGrade={nextGrade}
        xpToNextGrade={xpToNextGrade}
      />
    </div>
  );
};
