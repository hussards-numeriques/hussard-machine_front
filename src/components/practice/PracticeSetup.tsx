import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Mascot } from '../Mascot';
import { LEVELS } from '../../lib/grades';
import {
  SERIES_LENGTHS,
  resolvePracticeOptions,
  type PracticeChoice,
  type PracticeMode,
  type SeriesLength,
  type TimeLimitSetting,
} from '../../lib/practice';
import type { PracticeCatalog, PracticeNotion, PracticeTopic } from '../../services/practice';
import { CategoryPicker, LevelSelect, NotionPicker } from './PracticeNotionControls';
import { ChoiceButton, Step } from './PracticeSetupControls';
import { PracticeTablesPicker, type TimesTablesState } from './PracticeTablesPicker';
import { PracticeTimeLimit } from './PracticeTimeLimit';

interface SetupStep {
  key: string;
  title: string;
  content: ReactNode;
}

interface PracticeSetupProps {
  catalog: PracticeCatalog;
  timesTables: TimesTablesState;
  mode: PracticeMode;
  choice: PracticeChoice;
  selectedTables: number[];
  length: SeriesLength;
  timeLimit: TimeLimitSetting;
  onModeChange: (mode: PracticeMode) => void;
  onChoiceChange: (choice: PracticeChoice) => void;
  onTablesChange: (tables: number[]) => void;
  onLengthChange: (length: SeriesLength) => void;
  onTimeLimitChange: (setting: TimeLimitSetting) => void;
  onStart: (topic: PracticeTopic) => void;
}

const resolveTopic = (
  mode: PracticeMode,
  notion: PracticeNotion | null,
  tables: number[],
  tablesAvailable: boolean
): PracticeTopic | null => {
  if (mode === 'notion') return notion && { kind: 'notion', ...notion };
  return tablesAvailable && tables.length > 0 ? { kind: 'timesTables', tables } : null;
};

const ModePicker: React.FC<{ mode: PracticeMode; onChange: (mode: PracticeMode) => void }> = ({
  mode,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChoiceButton
        selected={mode === 'notion'}
        onClick={() => onChange('notion')}
        className="text-sm"
      >
        {t('practice.modeNotion')}
      </ChoiceButton>
      <ChoiceButton
        selected={mode === 'timesTables'}
        onClick={() => onChange('timesTables')}
        className="text-sm"
      >
        {t('practice.modeTimesTables')}
      </ChoiceButton>
    </div>
  );
};

const LengthPicker: React.FC<{
  length: SeriesLength;
  onChange: (length: SeriesLength) => void;
}> = ({ length, onChange }) => (
  <div className="grid grid-cols-3 gap-2">
    {SERIES_LENGTHS.map((option) => (
      <ChoiceButton
        key={option}
        selected={option === length}
        onClick={() => onChange(option)}
        className="text-2xl font-black"
      >
        {option}
      </ChoiceButton>
    ))}
  </div>
);

export const PracticeSetup: React.FC<PracticeSetupProps> = ({
  catalog,
  timesTables,
  mode,
  choice,
  selectedTables,
  length,
  timeLimit,
  onModeChange,
  onChoiceChange,
  onTablesChange,
  onLengthChange,
  onTimeLimitChange,
  onStart,
}) => {
  const { t } = useTranslation();
  const options = resolvePracticeOptions(catalog, choice);
  const levels = LEVELS.filter((level) => catalog[level] !== undefined);
  const topic = resolveTopic(mode, options.notion, selectedTables, timesTables.status === 'ready');

  const notionSteps: SetupStep[] = [
    {
      key: 'level',
      title: t('practice.level'),
      content: (
        <LevelSelect
          levels={levels}
          value={choice.level}
          onChange={(level) => onChoiceChange({ ...choice, level })}
        />
      ),
    },
    {
      key: 'category',
      title: t('practice.category'),
      content: (
        <CategoryPicker
          categories={options.categories}
          selected={options.category}
          onChange={(category) => onChoiceChange({ ...choice, category, promptType: null })}
        />
      ),
    },
  ];
  if (options.promptTypes.length > 1) {
    notionSteps.push({
      key: 'notion',
      title: t('practice.notion'),
      content: (
        <NotionPicker
          promptTypes={options.promptTypes}
          selected={options.notion?.promptType ?? null}
          onChange={(promptType) => onChoiceChange({ ...choice, promptType })}
        />
      ),
    });
  }

  const timesTablesStep: SetupStep = {
    key: 'tables',
    title: t('practice.tables'),
    content: (
      <PracticeTablesPicker
        state={timesTables}
        selected={selectedTables}
        onChange={onTablesChange}
      />
    ),
  };

  const steps: SetupStep[] = [
    {
      key: 'mode',
      title: t('practice.mode'),
      content: <ModePicker mode={mode} onChange={onModeChange} />,
    },
    ...(mode === 'notion' ? notionSteps : [timesTablesStep]),
    {
      key: 'length',
      title: t('practice.length'),
      content: <LengthPicker length={length} onChange={onLengthChange} />,
    },
    {
      key: 'timeLimit',
      title: t('practice.timeLimit'),
      content: <PracticeTimeLimit setting={timeLimit} onChange={onTimeLimitChange} />,
    },
  ];

  return (
    <div className="min-h-screen p-4 pt-20 max-w-md mx-auto w-full space-y-6">
      <header className="flex items-center gap-4">
        <Mascot pose="clindoeil" title="Rushy" className="w-20 h-20 shrink-0 drop-shadow" />
        <div>
          <h1 className="text-3xl font-black text-primary-dark">{t('practice.title')}</h1>
          <p className="text-sm font-semibold text-slate-500">{t('practice.subtitle')}</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-6 space-y-6">
        {steps.map((step, index) => (
          <Step key={step.key} number={index + 1} title={step.title}>
            {step.content}
          </Step>
        ))}

        <Button
          size="lg"
          className="w-full"
          disabled={topic === null}
          onClick={() => topic && onStart(topic)}
        >
          {t('practice.start')}
        </Button>
      </div>
    </div>
  );
};
