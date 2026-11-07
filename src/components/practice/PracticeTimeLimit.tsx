import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_TIME_LIMIT_SECONDS,
  TIME_LIMIT_MAX_SECONDS,
  TIME_LIMIT_MIN_SECONDS,
  clampTimeLimit,
  isWithinTimeLimitRange,
} from '../../lib/practice';
import { ChoiceButton } from './PracticeSetupControls';

interface PracticeTimeLimitProps {
  value: number | null;
  onChange: (value: number | null) => void;
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
    </div>
  );
};

export const PracticeTimeLimit: React.FC<PracticeTimeLimitProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <ChoiceButton selected={value === null} onClick={() => onChange(null)}>
          {t('practice.timeLimitNone')}
        </ChoiceButton>
        <ChoiceButton
          selected={value !== null}
          onClick={() => onChange(value ?? DEFAULT_TIME_LIMIT_SECONDS)}
        >
          {t('practice.timeLimitOn')}
        </ChoiceButton>
      </div>
      {value !== null && <SecondsField value={value} onChange={onChange} />}
    </div>
  );
};
