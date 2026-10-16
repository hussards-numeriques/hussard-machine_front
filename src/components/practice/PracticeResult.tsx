import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Mascot } from '../Mascot';
import { cn } from '../../lib/utils';
import { resolvePromptTypeLabel } from '../../lib/labels';
import { correctCount, ratePractice, type PracticeSeries } from '../../lib/practice';

interface PracticeResultProps {
  series: PracticeSeries;
  onReplay: () => void;
  onChangeNotion: () => void;
}

const OutcomeStars: React.FC<{ series: PracticeSeries }> = ({ series }) => {
  const { t } = useTranslation();
  return (
    <ul aria-label={t('answerDots.label')} className="flex flex-wrap justify-center gap-1">
      {series.outcomes.map((outcome, index) => (
        <li
          key={index}
          aria-label={t(`answerDots.${outcome}`)}
          style={{ animationDelay: `${index * 60}ms` }}
          className={cn(
            'text-2xl leading-none motion-safe:animate-pop-in [animation-fill-mode:both]',
            outcome === 'correct' ? 'text-secondary drop-shadow-sm' : 'text-slate-200'
          )}
        >
          ★
        </li>
      ))}
    </ul>
  );
};

export const PracticeResult: React.FC<PracticeResultProps> = ({
  series,
  onReplay,
  onChangeNotion,
}) => {
  const { t } = useTranslation();
  const correct = correctCount(series);
  const rating = ratePractice(correct, series.length);
  const isGreat = rating === 'perfect' || rating === 'great';

  useEffect(() => {
    confetti({
      particleCount: rating === 'perfect' ? 160 : 80,
      spread: 80,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
    });
  }, [rating]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-20">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-5">
        <Mascot
          pose={isGreat ? 'champion' : 'joyeux'}
          title="Rushy"
          className="w-24 h-24 mx-auto drop-shadow animate-pop-in"
        />
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary-dark">{t('practice.finishedTitle')}</h1>
          <p className="text-sm font-bold text-slate-400">
            {resolvePromptTypeLabel(series.notion.promptType, t)}
          </p>
        </div>
        <p
          aria-label={t('practice.score', { correct, total: series.length })}
          className="text-7xl font-black tabular-nums animate-pop-in"
        >
          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            {correct}
          </span>
          <span className="text-slate-300">/{series.length}</span>
        </p>
        <OutcomeStars series={series} />
        <p className="text-lg font-bold text-slate-600">{t(`practice.ratings.${rating}`)}</p>
        <div className="space-y-3 pt-2">
          <Button size="lg" className="w-full" onClick={onReplay}>
            {t('practice.replay')}
          </Button>
          <Button variant="secondary" className="w-full" onClick={onChangeNotion}>
            {t('practice.changeNotion')}
          </Button>
        </div>
        <Link
          to="/"
          className="inline-block text-sm font-bold text-slate-400 hover:text-primary transition-colors"
        >
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
};
