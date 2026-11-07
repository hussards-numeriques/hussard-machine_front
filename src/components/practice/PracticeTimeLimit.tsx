import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResolvedAnswerInputMode } from '../../hooks/useAnswerInputMode';
import {
  HANDWRITING_COMFORTABLE_SECONDS,
  TIME_LIMIT_MAX_SECONDS,
  TIME_LIMIT_MIN_SECONDS,
  clampTimeLimit,
  isWithinTimeLimitRange,
  type TimeLimitSetting,
} from '../../lib/practice';
import { ChoiceButton } from './PracticeSetupControls';

interface PracticeTimeLimitProps {
  setting: TimeLimitSetting;
  onChange: (setting: TimeLimitSetting) => void;
}

const StepButton: React.FC<{
  label: string;
  symbol: string;
  disabled: boolean;
  onClick: () => void;
}> = ({ label, symbol, disabled, onClick }) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="h-12 w-12 rounded-2xl border-2 border-slate-200 bg-white text-2xl font-black text-slate-600 transition-all hover:border-primary-light active:scale-95 disabled:opacity-40"
  >
    {symbol}
  </button>
);

const SecondsField: React.FC<{ value: number; onChange: (value: number) => void }> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (typed: string) => {
    setDraft(typed);
    const parsed = parseFloat(typed);
    if (Number.isInteger(parsed) && isWithinTimeLimitRange(parsed)) onChange(parsed);
  };

  const commit = () => {
    if (draft === null) return;
    onChange(clampTimeLimit(parseFloat(draft)));
    setDraft(null);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <StepButton
        label={t('practice.timeLimitDecrease')}
        symbol="−"
        disabled={value <= TIME_LIMIT_MIN_SECONDS}
        onClick={() => onChange(clampTimeLimit(value - 1))}
      />
      <input
        type="number"
        inputMode="numeric"
        aria-label={t('practice.timeLimitSeconds')}
        value={draft ?? value}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
        className="w-20 rounded-xl border-2 border-slate-300 bg-white p-3 text-center text-2xl font-black text-slate-700 outline-none focus:border-primary"
      />
      <StepButton
        label={t('practice.timeLimitIncrease')}
        symbol="+"
        disabled={value >= TIME_LIMIT_MAX_SECONDS}
        onClick={() => onChange(clampTimeLimit(value + 1))}
      />
      <output aria-live="polite" className="sr-only">
        {value} s
      </output>
    </div>
  );
};

export const PracticeTimeLimit: React.FC<PracticeTimeLimitProps> = ({ setting, onChange }) => {
  const { t } = useTranslation();
  const inputMode = useResolvedAnswerInputMode();
  const { enabled, seconds } = setting;
  const isTightForHandwriting =
    enabled && inputMode === 'handwriting' && seconds < HANDWRITING_COMFORTABLE_SECONDS;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <ChoiceButton selected={!enabled} onClick={() => onChange({ ...setting, enabled: false })}>
          {t('practice.timeLimitNone')}
        </ChoiceButton>
        <ChoiceButton selected={enabled} onClick={() => onChange({ ...setting, enabled: true })}>
          {t('practice.timeLimitOn')}
        </ChoiceButton>
      </div>
      {enabled && (
        <SecondsField
          value={seconds}
          onChange={(next) => onChange({ enabled: true, seconds: next })}
        />
      )}
      {isTightForHandwriting && (
        <p className="text-sm font-semibold text-amber-700">
          {t('practice.timeLimitHandwritingHint')}
        </p>
      )}
    </div>
  );
};
