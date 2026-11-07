import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Mascot } from '../Mascot';
import { LEVELS, isLevel, resolveLevelLabel } from '../../lib/grades';
import { resolvePromptTypeLabel, resolveQuestionCategoryLabel } from '../../lib/labels';
import {
  SERIES_LENGTHS,
  resolveCategorySymbol,
  resolvePracticeOptions,
  type PracticeChoice,
  type PracticeMode,
  type SeriesLength,
} from '../../lib/practice';
import type { PracticeCatalog, PracticeNotion, PracticeTopic } from '../../services/practice';
import { ChoiceButton, Step } from './PracticeSetupControls';
import { PracticeTablesPicker } from './PracticeTablesPicker';
import { PracticeTimeLimit } from './PracticeTimeLimit';

interface PracticeSetupProps {
  catalog: PracticeCatalog;
  timesTables: number[];
  mode: PracticeMode;
  choice: PracticeChoice;
  selectedTables: number[];
  length: SeriesLength;
  timeLimitSeconds: number | null;
  onModeChange: (mode: PracticeMode) => void;
  onChoiceChange: (choice: PracticeChoice) => void;
  onTablesChange: (tables: number[]) => void;
  onLengthChange: (length: SeriesLength) => void;
  onTimeLimitChange: (seconds: number | null) => void;
  onStart: (topic: PracticeTopic) => void;
}

const resolveTopic = (
  mode: PracticeMode,
  notion: PracticeNotion | null,
  tables: number[]
): PracticeTopic | null => {
  if (mode === 'notion') return notion && { kind: 'notion', ...notion };
  return tables.length > 0 ? { kind: 'timesTables', tables } : null;
};

export const PracticeSetup: React.FC<PracticeSetupProps> = ({
  catalog,
  timesTables,
  mode,
  choice,
  selectedTables,
  length,
  timeLimitSeconds,
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
  const hasNotionStep = options.promptTypes.length > 1;
  const topic = resolveTopic(mode, options.notion, selectedTables);

  const handleLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (isLevel(next)) onChoiceChange({ ...choice, level: next });
  };

  const steps: { key: string; title: string; content: ReactNode }[] = [
    {
      key: 'mode',
      title: t('practice.mode'),
      content: (
        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton
            selected={mode === 'notion'}
            onClick={() => onModeChange('notion')}
            className="text-sm"
          >
            {t('practice.modeNotion')}
          </ChoiceButton>
          <ChoiceButton
            selected={mode === 'timesTables'}
            onClick={() => onModeChange('timesTables')}
            className="text-sm"
          >
            {t('practice.modeTimesTables')}
          </ChoiceButton>
        </div>
      ),
    },
    ...(mode === 'notion'
      ? [
          {
            key: 'level',
            title: t('practice.level'),
            content: (
              <select
                aria-label={t('practice.level')}
                className="w-full p-3 rounded-xl border-2 border-slate-300 outline-none font-bold text-slate-700 bg-white focus:border-primary"
                value={choice.level}
                onChange={handleLevelChange}
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {resolveLevelLabel(level, t, 'long')}
                  </option>
                ))}
              </select>
            ),
          },
          {
            key: 'category',
            title: t('practice.category'),
            content: (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {options.categories.map((category) => (
                    <ChoiceButton
                      key={category}
                      selected={category === options.category}
                      onClick={() => onChoiceChange({ ...choice, category, promptType: null })}
                      className="flex items-center gap-2 text-left text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/30 px-1 text-sm font-black text-yellow-900"
                      >
                        {resolveCategorySymbol(category)}
                      </span>
                      {resolveQuestionCategoryLabel(category, t)}
                    </ChoiceButton>
                  ))}
                </div>
                {options.category === null && (
                  <p className="text-sm font-semibold text-slate-400">
                    {t('practice.chooseCategory')}
                  </p>
                )}
              </>
            ),
          },
          ...(hasNotionStep
            ? [
                {
                  key: 'notion',
                  title: t('practice.notion'),
                  content: (
                    <>
                      <div className="flex flex-col gap-2">
                        {options.promptTypes.map((promptType) => (
                          <ChoiceButton
                            key={promptType}
                            selected={promptType === options.notion?.promptType}
                            onClick={() => onChoiceChange({ ...choice, promptType })}
                            className="text-left"
                          >
                            {resolvePromptTypeLabel(promptType, t)}
                          </ChoiceButton>
                        ))}
                      </div>
                      {options.notion === null && (
                        <p className="text-sm font-semibold text-slate-400">
                          {t('practice.chooseNotion')}
                        </p>
                      )}
                    </>
                  ),
                },
              ]
            : []),
        ]
      : [
          {
            key: 'tables',
            title: t('practice.tables'),
            content: (
              <PracticeTablesPicker
                tables={timesTables}
                selected={selectedTables}
                onChange={onTablesChange}
              />
            ),
          },
        ]),
    {
      key: 'length',
      title: t('practice.length'),
      content: (
        <div className="grid grid-cols-3 gap-2">
          {SERIES_LENGTHS.map((option) => (
            <ChoiceButton
              key={option}
              selected={option === length}
              onClick={() => onLengthChange(option)}
              className="text-2xl font-black"
            >
              {option}
            </ChoiceButton>
          ))}
        </div>
      ),
    },
    {
      key: 'timeLimit',
      title: t('practice.timeLimit'),
      content: <PracticeTimeLimit value={timeLimitSeconds} onChange={onTimeLimitChange} />,
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
