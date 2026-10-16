import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnswerInput } from '../AnswerInput';
import { Button } from '../Button';
import { Mascot } from '../Mascot';
import { QuestionPrompt } from '../QuestionPrompt/QuestionPrompt';
import { cn } from '../../lib/utils';
import { formatInteger } from '../../lib/mathFormat';
import {
  resolveApiErrorMessage,
  resolvePromptTypeLabel,
  resolveQuestionCategoryLabel,
} from '../../lib/labels';
import {
  cheerFor,
  currentQuestionIndex,
  isLastQuestion,
  type PracticeSeries,
} from '../../lib/practice';
import { isSubscriptionRequiredError, usePracticeQuestion } from '../../hooks/usePractice';

const CORRECT_AUTO_ADVANCE_MS = 1400;

interface PracticeRunProps {
  series: PracticeSeries;
  onAnswer: (given: number, expected: number) => void;
  onNext: () => void;
  onQuit: () => void;
}

const ProgressSteps: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const { t } = useTranslation();
  const label = t('practice.progress', { current: current + 1, total });
  return (
    <div className="space-y-2">
      <p className="text-center text-sm font-black text-slate-500">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        className="flex gap-1"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-2.5 flex-1 rounded-full transition-colors duration-500',
              index < current && 'bg-gradient-to-r from-primary to-violet-500',
              index === current && 'bg-primary-light motion-safe:animate-pulse',
              index > current && 'bg-slate-200'
            )}
          />
        ))}
      </div>
    </div>
  );
};

const CorrectFeedback: React.FC<{
  questionIndex: number;
  nextLabel: string;
  onNext: () => void;
}> = ({ questionIndex, nextLabel, onNext }) => {
  const { t } = useTranslation();

  useEffect(() => {
    confetti({
      particleCount: 40,
      spread: 60,
      startVelocity: 25,
      origin: { y: 0.45 },
      disableForReducedMotion: true,
    });
    const timeout = window.setTimeout(onNext, CORRECT_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timeout);
  }, [onNext]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 animate-pop-in">
        <Mascot pose="champion" size={72} title="Rushy" />
        <p role="status" className="text-4xl font-black text-emerald-500">
          {t(`practice.cheers.${cheerFor(questionIndex)}`)}
        </p>
      </div>
      <Button variant="success" size="lg" className="w-full" onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
};

const WrongFeedback: React.FC<{
  given: number;
  answer: number;
  nextLabel: string;
  onNext: () => void;
}> = ({ given, answer, nextLabel, onNext }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 animate-pop-in">
      <p role="status" className="text-2xl font-black text-amber-600">
        {t('practice.wrongTitle')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3 space-y-1">
          <span className="block text-xs font-bold uppercase text-slate-400">
            {t('practice.yourAnswer')}
          </span>
          <span className="block text-3xl font-black text-slate-400 line-through tabular-nums">
            {formatInteger(given)}
          </span>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3 space-y-1">
          <span className="block text-xs font-bold uppercase text-emerald-700">
            {t('practice.rightAnswer')}
          </span>
          <span
            data-testid="practice-correction"
            className="block text-3xl font-black text-emerald-600 tabular-nums"
          >
            {formatInteger(answer)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Mascot pose="clindoeil" size={40} title="Rushy" />
        <p className="text-sm font-semibold text-slate-500">{t('practice.wrongEncouragement')}</p>
      </div>
      <Button size="lg" className="w-full" autoFocus onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
};

export const PracticeRun: React.FC<PracticeRunProps> = ({ series, onAnswer, onNext, onQuit }) => {
  const { t } = useTranslation();
  const question = usePracticeQuestion(series);
  const index = currentQuestionIndex(series);
  const nextLabel = isLastQuestion(series) ? t('practice.seeResult') : t('practice.next');
  const { notion, pending } = series;

  if (isSubscriptionRequiredError(question.error)) {
    return <Navigate to="/subscription" replace />;
  }

  const renderBody = () => {
    if (question.isError) {
      return (
        <div className="space-y-4">
          <p className="font-bold text-rose-600">
            {resolveApiErrorMessage(question.error, t('practice.questionFailed'), t)}
          </p>
          <Button onClick={() => void question.refetch()}>{t('practice.retry')}</Button>
        </div>
      );
    }
    if (!question.data) {
      return (
        <div className="py-10 text-slate-400 text-lg font-bold animate-pulse">
          {t('common.loading')}
        </div>
      );
    }
    const { prompt, answer } = question.data;
    return (
      <>
        <QuestionPrompt
          key={`prompt-${index}`}
          prompt={prompt}
          className="text-[clamp(2.25rem,12vw,3.75rem)] animate-pop-in"
        />
        {pending === null && (
          <AnswerInput
            key={`input-${index}`}
            onSubmit={(given) => onAnswer(given, answer)}
            disabled={false}
          />
        )}
        {pending?.outcome === 'correct' && (
          <CorrectFeedback questionIndex={index} nextLabel={nextLabel} onNext={onNext} />
        )}
        {pending?.outcome === 'incorrect' && (
          <WrongFeedback
            given={pending.given}
            answer={answer}
            nextLabel={nextLabel}
            onNext={onNext}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen p-4 pt-20 max-w-md mx-auto w-full space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate rounded-full bg-primary/10 px-3 py-1 text-sm font-black text-primary-dark">
          {resolveQuestionCategoryLabel(notion.category, t)} ·{' '}
          {resolvePromptTypeLabel(notion.promptType, t)}
        </span>
        <button
          type="button"
          onClick={onQuit}
          className="shrink-0 text-sm font-bold text-slate-400 hover:text-primary transition-colors"
        >
          {t('practice.quit')}
        </button>
      </div>

      <ProgressSteps current={index} total={series.length} />

      <section
        className={cn(
          'bg-white rounded-3xl shadow-xl border-2 p-6 text-center space-y-6 transition-colors duration-300',
          pending === null && 'border-slate-100',
          pending?.outcome === 'correct' && 'border-emerald-300 bg-emerald-50/40',
          pending?.outcome === 'incorrect' && 'border-amber-300'
        )}
      >
        {renderBody()}
      </section>
    </div>
  );
};
