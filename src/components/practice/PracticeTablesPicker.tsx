import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { toggleTable } from '../../lib/practice';
import { ChoiceButton } from './PracticeSetupControls';

export type TimesTablesState =
  | { status: 'loading' }
  | { status: 'error'; onRetry: () => void }
  | { status: 'ready'; tables: number[] };

interface PracticeTablesPickerProps {
  state: TimesTablesState;
  selected: number[];
  onChange: (selected: number[]) => void;
}

export const PracticeTablesPicker: React.FC<PracticeTablesPickerProps> = ({
  state,
  selected,
  onChange,
}) => {
  const { t } = useTranslation();

  if (state.status === 'loading') {
    return <p className="text-sm font-semibold text-slate-400">{t('common.loading')}</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-600">{t('practice.catalogFailed')}</p>
        <Button onClick={state.onRetry}>{t('practice.retry')}</Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        {state.tables.map((table) => (
          <ChoiceButton
            key={table}
            selected={selected.includes(table)}
            ariaLabel={t('practice.tableOption', { table })}
            onClick={() => onChange(toggleTable(selected, table))}
            className="px-0 text-xl font-black"
          >
            {table}
          </ChoiceButton>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-sm font-semibold text-slate-400">{t('practice.chooseTable')}</p>
      )}
    </>
  );
};
