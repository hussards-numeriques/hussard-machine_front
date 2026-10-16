import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { isSubscriptionRequiredError, usePracticeCatalog } from '../hooks/usePractice';
import { useResolvedAnswerInputMode } from '../hooks/useAnswerInputMode';
import { digitRecognitionPort } from '../services/digit-recognition';
import type { PracticeNotion } from '../services/practice';
import { Button } from '../components/Button';
import { PracticeSetup } from '../components/practice/PracticeSetup';
import { PracticeRun } from '../components/practice/PracticeRun';
import { PracticeResult } from '../components/practice/PracticeResult';
import { isLevel, type Level } from '../lib/grades';
import {
  DEFAULT_SERIES_LENGTH,
  answerQuestion,
  isSeriesFinished,
  nextQuestion,
  startSeries,
  type PracticeChoice,
  type PracticeSeries,
  type SeriesLength,
} from '../lib/practice';

type DraftChoice = Omit<PracticeChoice, 'level'> & { level: Level | null };

const PracticeLoading: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
    </div>
  );
};

const PracticeCatalogError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('practice.title')}</h1>
        <p className="text-slate-600">{t('practice.catalogFailed')}</p>
        <Button onClick={onRetry}>{t('practice.retry')}</Button>
      </div>
    </div>
  );
};

export const PracticePage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const status = useSubscriptionStatus();
  const catalog = usePracticeCatalog();
  const profileLevel = usePlayerProfile().data?.level;
  const inputMode = useResolvedAnswerInputMode();
  const [draft, setDraft] = useState<DraftChoice>({
    level: null,
    category: null,
    promptType: null,
  });
  const [length, setLength] = useState<SeriesLength>(DEFAULT_SERIES_LENGTH);
  const [series, setSeries] = useState<PracticeSeries | null>(null);

  useEffect(() => {
    if (inputMode === 'handwriting') digitRecognitionPort.preload().catch(() => {});
  }, [inputMode]);

  const handleAnswer = useCallback(
    (given: number, expected: number) =>
      setSeries((current) => current && answerQuestion(current, given, expected)),
    []
  );
  const handleNext = useCallback(
    () => setSeries((current) => current && nextQuestion(current)),
    []
  );
  const handleStart = (notion: PracticeNotion) =>
    setSeries(startSeries(notion, length, Date.now()));
  const handleReplay = () =>
    setSeries((current) => current && startSeries(current.notion, current.length, Date.now()));
  const handleBackToSetup = () => setSeries(null);

  if (authLoading || status.isLoading) return <PracticeLoading />;

  if (
    !isAuthenticated ||
    status.data?.active !== true ||
    isSubscriptionRequiredError(catalog.error)
  ) {
    return <Navigate to="/subscription" replace />;
  }

  if (series !== null) {
    return isSeriesFinished(series) ? (
      <PracticeResult series={series} onReplay={handleReplay} onChangeNotion={handleBackToSetup} />
    ) : (
      <PracticeRun
        series={series}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onQuit={handleBackToSetup}
      />
    );
  }

  if (catalog.isError) return <PracticeCatalogError onRetry={() => void catalog.refetch()} />;
  if (!catalog.data) return <PracticeLoading />;

  const choice: PracticeChoice = {
    ...draft,
    level:
      draft.level ?? (profileLevel !== undefined && isLevel(profileLevel) ? profileLevel : 'CP'),
  };

  return (
    <PracticeSetup
      catalog={catalog.data}
      choice={choice}
      length={length}
      onChoiceChange={setDraft}
      onLengthChange={setLength}
      onStart={handleStart}
    />
  );
};
