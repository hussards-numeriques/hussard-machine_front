import React from 'react';
import { useTranslation } from 'react-i18next';
import { toggleTable } from '../../lib/practice';
import { ChoiceButton } from './PracticeSetupControls';

interface PracticeTablesPickerProps {
  tables: number[];
  selected: number[];
  onChange: (selected: number[]) => void;
}

export const PracticeTablesPicker: React.FC<PracticeTablesPickerProps> = ({
  tables,
  selected,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        {tables.map((table) => (
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
