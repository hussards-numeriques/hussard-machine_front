import React from 'react';
import { LEVELS, isLevel, resolveLevelLabel } from '../../lib/grades';
import type { Level } from '../../lib/grades';
import { useTranslation } from 'react-i18next';

interface LevelSelectorProps {
  level: Level;
  currentLevel: Level;
  onChange: (level: Level | null) => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({ level, currentLevel, onChange }) => {
  const { t } = useTranslation();
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (!isLevel(next)) return;
    onChange(next === currentLevel ? null : next);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="quests-level" className="font-bold text-slate-600 text-sm">
        Niveau affiché
      </label>
      <select
        id="quests-level"
        className="w-full p-3 rounded-xl border-2 border-slate-300 outline-none font-bold text-slate-700 bg-white"
        value={level}
        onChange={handleChange}
      >
        {LEVELS.map((option) => (
          <option key={option} value={option}>
            {resolveLevelLabel(option, t, 'long')}
            {option === currentLevel ? ' (actuel)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
