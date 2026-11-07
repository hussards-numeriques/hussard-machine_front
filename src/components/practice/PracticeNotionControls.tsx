import React from 'react';
import { useTranslation } from 'react-i18next';
import { isLevel, resolveLevelLabel, type Level } from '../../lib/grades';
import {
  resolvePromptTypeLabel,
  resolveQuestionCategoryLabel,
  type PromptType,
} from '../../lib/labels';
import { resolveCategorySymbol } from '../../lib/practice';
import { ChoiceButton } from './PracticeSetupControls';

export const LevelSelect: React.FC<{
  levels: readonly Level[];
  value: Level;
  onChange: (level: Level) => void;
}> = ({ levels, value, onChange }) => {
  const { t } = useTranslation();
  return (
    <select
      aria-label={t('practice.level')}
      className="w-full p-3 rounded-xl border-2 border-slate-300 outline-none font-bold text-slate-700 bg-white focus:border-primary"
      value={value}
      onChange={(event) => {
        const next = event.target.value;
        if (isLevel(next)) onChange(next);
      }}
    >
      {levels.map((level) => (
        <option key={level} value={level}>
          {resolveLevelLabel(level, t, 'long')}
        </option>
      ))}
    </select>
  );
};

export const CategoryPicker: React.FC<{
  categories: string[];
  selected: string | null;
  onChange: (category: string) => void;
}> = ({ categories, selected, onChange }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category) => (
          <ChoiceButton
            key={category}
            selected={category === selected}
            onClick={() => onChange(category)}
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
      {selected === null && (
        <p className="text-sm font-semibold text-slate-400">{t('practice.chooseCategory')}</p>
      )}
    </>
  );
};

export const NotionPicker: React.FC<{
  promptTypes: PromptType[];
  selected: PromptType | null;
  onChange: (promptType: PromptType) => void;
}> = ({ promptTypes, selected, onChange }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col gap-2">
        {promptTypes.map((promptType) => (
          <ChoiceButton
            key={promptType}
            selected={promptType === selected}
            onClick={() => onChange(promptType)}
            className="text-left"
          >
            {resolvePromptTypeLabel(promptType, t)}
          </ChoiceButton>
        ))}
      </div>
      {selected === null && (
        <p className="text-sm font-semibold text-slate-400">{t('practice.chooseNotion')}</p>
      )}
    </>
  );
};
