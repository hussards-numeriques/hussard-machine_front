import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import {
  isSubscriptionRequiredError,
  usePracticeCatalog,
  usePracticeTimesTables,
} from '../hooks/usePractice';
import { useResolvedAnswerInputMode } from '../hooks/useAnswerInputMode';
import { digitRecognitionPort } from '../services/digit-recognition';
import { LoadingScreen } from '../components/LoadingScreen';
import type { PracticeTopic } from '../services/practice';
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
  timeOutQuestion,
  type PracticeChoice,
  type PracticeMode,
  type PracticeSeries,
  type SeriesLength,
} from '../lib/practice';

type DraftChoice = Omit<PracticeChoice, 'level'> & { level: Level | null };

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
  const timesTables = usePracticeTimesTables();
  const profileLevel = usePlayerProfile().data?.level;
  const inputMode = useResolvedAnswerInputMode();
  const [draft, setDraft] = useState<DraftChoice>({
    level: null,
    category: null,
    promptType: null,
  });
  const [mode, setMode] = useState<PracticeMode>('notion');
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
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
  const handleTimeOut = useCallback(
    () => setSeries((current) => current && timeOutQuestion(current)),
    []
  );
  const handleStart = (topic: PracticeTopic) =>
    setSeries(startSeries(topic, length, Date.now(), timeLimitSeconds));
  const handleReplay = () =>
    setSeries(
      (current) =>
        current && startSeries(current.topic, current.length, Date.now(), current.timeLimitSeconds)
    );
  const handleBackToSetup = () => setSeries(null);

  if (authLoading || status.isLoading) return <LoadingScreen />;

  if (
    !isAuthenticated ||
    status.data?.active !== true ||
    isSubscriptionRequiredError(catalog.error) ||
    isSubscriptionRequiredError(timesTables.error)
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
        onTimeOut={handleTimeOut}
      />
    );
  }

  if (catalog.isError || timesTables.isError) {
    return (
      <PracticeCatalogError
        onRetry={() => {
          void catalog.refetch();
          void timesTables.refetch();
        }}
      />
    );
  }
  if (!catalog.data || !timesTables.data) return <LoadingScreen />;

  const choice: PracticeChoice = {
    ...draft,
    level:
      draft.level ?? (profileLevel !== undefined && isLevel(profileLevel) ? profileLevel : 'CP'),
  };

  return (
    <PracticeSetup
      catalog={catalog.data}
      timesTables={timesTables.data}
      mode={mode}
      choice={choice}
      selectedTables={selectedTables}
      length={length}
      timeLimitSeconds={timeLimitSeconds}
      onModeChange={setMode}
      onChoiceChange={setDraft}
      onTablesChange={setSelectedTables}
      onLengthChange={setLength}
      onTimeLimitChange={setTimeLimitSeconds}
      onStart={handleStart}
    />
  );
};
