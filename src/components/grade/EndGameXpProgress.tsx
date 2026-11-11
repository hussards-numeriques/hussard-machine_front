import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { GameConfig } from '../../types';
import type { XpProgress } from '../../hooks/useXpProgress';
import { computeGradeDiffSegments, computeGradeProgress } from '../../lib/gradeProgress';
import {
  resolveGradeBarColor,
  resolveGradeBarLightColor,
  resolveGradeConfettiColors,
  resolveGradeMetal,
} from '../../lib/grades';
import { cn } from '../../lib/utils';
import { useSound } from '../../hooks/useSound';
import { xpBlopCount, xpFillNotes } from '../../lib/sounds';
import { PlayerLevel } from '../PlayerLevel';
import { GradeLabelRow } from './GradeLabelRow';
import { XpBarFooter } from './XpBarFooter';
import { GradeUpCelebration } from './GradeUpCelebration';

interface EndGameXpProgressProps {
  progress: XpProgress;
  config: GameConfig;
  level?: string;
}

const TRANSITION_DURATION_MS = 700;
const REVEAL_DELAY_MS = TRANSITION_DURATION_MS + 150;
const GLOW_DURATION_MS = 2500;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PromoteLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Link to="/profile" className="block text-sm font-bold text-primary underline">
      {t('grade.promoteLink')}
    </Link>
  );
};

export const EndGameXpProgress: React.FC<EndGameXpProgressProps> = ({
  progress,
  config,
  level,
}) => {
  const { t } = useTranslation();
  const play = useSound();
  const { before, after } = progress;
  const [animated, setAnimated] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const medalRef = useRef<HTMLDivElement>(null);
  const firedEffectRef = useRef(false);

  useEffect(() => {
    if (!after) {
      return;
    }
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setAnimated(true));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [after]);

  const beforeGradeIndex = computeGradeProgress(
    before.experience,
    before.canPromote,
    config
  ).gradeIndex;
  const afterGradeIndex = after
    ? computeGradeProgress(after.experience, after.canPromote, config).gradeIndex
    : beforeGradeIndex;

  const justCrossedGrade = after != null && afterGradeIndex > beforeGradeIndex;
  const newGrade = config.grades[afterGradeIndex];
  const gainedXp = after != null ? after.experience - before.experience : 0;
  const hasGainedXp = gainedXp > 0;
  const experiencePerGrade = config.experience_per_grade;

  useEffect(() => {
    if (!animated || !hasGainedXp) return;
    play(xpFillNotes(xpBlopCount(gainedXp, experiencePerGrade)));
  }, [animated, hasGainedXp, gainedXp, experiencePerGrade, play]);

  useEffect(() => {
    if (!animated || !justCrossedGrade || revealed) {
      return;
    }
    const revealTimeout = window.setTimeout(() => {
      setRevealed(true);
      setGlowing(true);
      play('gradeUp');
    }, REVEAL_DELAY_MS);
    return () => window.clearTimeout(revealTimeout);
  }, [animated, justCrossedGrade, revealed, play]);

  useEffect(() => {
    if (!revealed) {
      return;
    }
    if (!firedEffectRef.current && !prefersReducedMotion()) {
      firedEffectRef.current = true;
      const rect = (medalRef.current ?? barRef.current)?.getBoundingClientRect();
      confetti({
        particleCount: 120,
        spread: 100,
        startVelocity: 38,
        gravity: 0.9,
        ticks: 260,
        scalar: 1,
        colors: resolveGradeConfettiColors(newGrade),
        origin: rect
          ? {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            }
          : { x: 0.5, y: 0.5 },
      });
    }
    const glowTimeout = window.setTimeout(() => setGlowing(false), GLOW_DURATION_MS);
    return () => window.clearTimeout(glowTimeout);
  }, [revealed, newGrade]);

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
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-500">{t('grade.progression')}</h3>
          {level && <PlayerLevel level={level} />}
        </div>

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
        {before.canPromote && <PromoteLink />}
      </div>
    );
  }

  const diffSegments = computeGradeDiffSegments(before, after, config);
  const { nextGrade, xpToNextGrade } = computeGradeProgress(
    after.experience,
    after.canPromote,
    config
  );

  const highlightedGradeIndex =
    justCrossedGrade && !revealed ? beforeGradeIndex : currentGradeIndex;

  return (
    <div
      ref={barRef}
      className={cn(
        'w-full max-w-md bg-white p-6 rounded-3xl shadow-lg border-2 border-slate-100 space-y-2 transition-shadow duration-500',
        justCrossedGrade && resolveGradeMetal(newGrade)
      )}
      style={
        glowing
          ? {
              borderColor: 'var(--metal-mid)',
              boxShadow: '0 0 0 3px var(--metal-light), 0 0 32px 4px var(--metal-mid)',
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-500">{t('grade.progression')}</h3>
          {level && <PlayerLevel level={level} />}
        </div>
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

      {justCrossedGrade && (
        <GradeUpCelebration grade={newGrade} revealed={revealed} medalRef={medalRef} />
      )}

      <GradeLabelRow
        segments={diffSegments.map((segment, i) => ({
          grade: segment.grade,
          isCurrent: i === highlightedGradeIndex,
        }))}
        poppedGrade={revealed ? newGrade : undefined}
      />

      <div className="flex gap-1">
        {diffSegments.map((segment, i) => {
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
                      transitionDelay:
                        justCrossedGrade && i > beforeGradeIndex ? `${REVEAL_DELAY_MS}ms` : '0ms',
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
                  className="absolute inset-0 pointer-events-none rounded-full motion-safe:animate-glow-pulse"
                  style={{ boxShadow: '0 0 12px 4px var(--metal-mid)' }}
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
      {after.canPromote && <PromoteLink />}
    </div>
  );
};
