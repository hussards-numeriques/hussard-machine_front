import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth';
import { useAnswerInputMode } from '../hooks/useAnswerInputMode';
import { useLocalePreference } from '../hooks/useLocalePreference';
import { ANSWER_INPUT_MODES } from '../components/AnswerInput/mode';
import { LOCALES, LOCALE_NAMES, type LocalePreference } from '../i18n/locale';

const LANGUAGE_OPTIONS: readonly LocalePreference[] = ['auto', ...LOCALES];

const SettingsNotice: React.FC<{ message: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('settings.title')}</h1>
        <p className="text-slate-600">{message}</p>
        <Link to="/" className="inline-block text-primary font-bold hover:underline">
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
};

const OptionButton: React.FC<{
  isActive: boolean;
  label: string;
  description?: string;
  onClick: () => void;
}> = ({ isActive, label, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isActive}
    className={`w-full text-left rounded-2xl border-2 p-4 transition-colors ${
      isActive ? 'border-primary bg-primary/10' : 'border-slate-100 bg-slate-50 hover:bg-white'
    }`}
  >
    <div className="font-black text-slate-800">{label}</div>
    {description && <div className="text-sm text-slate-500 mt-0.5">{description}</div>}
  </button>
);

const InputModeCard: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useAnswerInputMode();
  return (
    <section
      aria-labelledby="settings-input-mode"
      className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-6 space-y-4"
    >
      <div>
        <h1 id="settings-input-mode" className="text-2xl font-black text-slate-700">
          {t('settings.inputMode.title')}
        </h1>
        <p className="text-sm text-slate-400">{t('settings.deviceOnly')}</p>
      </div>
      <div className="space-y-3">
        {ANSWER_INPUT_MODES.map((option) => (
          <OptionButton
            key={option}
            isActive={option === mode}
            label={t(`settings.inputMode.labels.${option}`)}
            description={t(`settings.inputMode.descriptions.${option}`)}
            onClick={() => setMode(option)}
          />
        ))}
      </div>
    </section>
  );
};

const LanguageCard: React.FC = () => {
  const { t } = useTranslation();
  const [preference, setPreference] = useLocalePreference();
  return (
    <section
      aria-labelledby="settings-language"
      className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-6 space-y-4"
    >
      <div>
        <h2 id="settings-language" className="text-2xl font-black text-slate-700">
          {t('settings.language.title')}
        </h2>
        <p className="text-sm text-slate-400">{t('settings.deviceOnly')}</p>
      </div>
      <div className="space-y-3">
        {LANGUAGE_OPTIONS.map((option) => (
          <OptionButton
            key={option}
            isActive={option === preference}
            label={option === 'auto' ? t('locale.auto') : LOCALE_NAMES[option]}
            description={option === 'auto' ? t('settings.language.autoDescription') : undefined}
            onClick={() => setPreference(option)}
          />
        ))}
      </div>
    </section>
  );
};

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SettingsNotice message={t('settings.loginRequired')} />;
  }

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <InputModeCard />
      <LanguageCard />
    </div>
  );
};
