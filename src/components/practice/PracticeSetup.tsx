import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Mascot } from '../Mascot';
import { cn } from '../../lib/utils';
import { LEVELS, isLevel, resolveLevelLabel } from '../../lib/grades';
import { resolvePromptTypeLabel, resolveQuestionCategoryLabel } from '../../lib/labels';
import {
  SERIES_LENGTHS,
  resolveCategorySymbol,
  resolvePracticeOptions,
  type PracticeChoice,
  type SeriesLength,
} from '../../lib/practice';
import type { PracticeCatalog, PracticeNotion } from '../../services/practice';

interface PracticeSetupProps {
  catalog: PracticeCatalog;
  choice: PracticeChoice;
  length: SeriesLength;
  onChoiceChange: (choice: PracticeChoice) => void;
  onLengthChange: (length: SeriesLength) => void;
  onStart: (notion: PracticeNotion) => void;
}

interface ChoiceButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ selected, onClick, children, className }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      'rounded-2xl border-2 px-3 py-3 font-bold transition-all active:scale-95',
      selected
        ? 'border-primary bg-primary/10 text-primary-dark shadow-md motion-safe:scale-[1.03]'
        : 'border-slate-200 bg-white text-slate-600 hover:border-primary-light',
      className
    )}
  >
    {children}
  </button>
);

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({
  number,
  title,
  children,
}) => (
  <section className="space-y-3 animate-pop-in">
    <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
        {number}
      </span>
      {title}
    </h2>
    {children}
  </section>
);

export const PracticeSetup: React.FC<PracticeSetupProps> = ({
  catalog,
  choice,
  length,
  onChoiceChange,
  onLengthChange,
  onStart,
}) => {
  const { t } = useTranslation();
  const options = resolvePracticeOptions(catalog, choice);
  const levels = LEVELS.filter((level) => catalog[level] !== undefined);
  const hasNotionStep = options.promptTypes.length > 1;

  const handleLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (isLevel(next)) onChoiceChange({ ...choice, level: next });
  };

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
        <Step number={1} title={t('practice.level')}>
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
        </Step>

        <Step number={2} title={t('practice.category')}>
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
            <p className="text-sm font-semibold text-slate-400">{t('practice.chooseCategory')}</p>
          )}
        </Step>

        {hasNotionStep && (
          <Step number={3} title={t('practice.notion')}>
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
              <p className="text-sm font-semibold text-slate-400">{t('practice.chooseNotion')}</p>
            )}
          </Step>
        )}

        <Step number={hasNotionStep ? 4 : 3} title={t('practice.length')}>
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
        </Step>

        <Button
          size="lg"
          className="w-full"
          disabled={options.notion === null}
          onClick={() => options.notion && onStart(options.notion)}
        >
          {t('practice.start')}
        </Button>
      </div>
    </div>
  );
};
