import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { STREAK_TIERS } from './StreakFlame';
import { DailyQuestIcon, type QuestState } from './DailyQuestIcon';

const QUEST_STATES: QuestState[] = ['secured', 'soft-risk', 'last-chance', 'neutral'];

export const StreakGuide: React.FC = () => {
  const { t } = useTranslation();
  const tiers = [...STREAK_TIERS].sort((a, b) => a.min - b.min);

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
      <h2 className="text-2xl font-black text-primary-dark">{t('streak.guide.title')}</h2>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-700">{t('streak.guide.principleTitle')}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          <Trans i18nKey="streak.guide.principleText" components={{ strong: <strong /> }} />
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-700">{t('streak.guide.tiersTitle')}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{t('streak.guide.tiersText')}</p>
        <div className="flex flex-wrap gap-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50"
            >
              <tier.Flame size={28} />
              <span className={`text-sm font-black ${tier.valueColorClass}`}>
                {t('streak.guide.fromDays', { count: tier.min })}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-700">{t('streak.guide.questTitle')}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{t('streak.guide.questText')}</p>
        <ul className="space-y-2">
          {QUEST_STATES.map((state) => (
            <li key={state} className="flex items-center gap-3">
              <DailyQuestIcon state={state} animated={false} />
              <span className="text-slate-600 text-sm leading-relaxed">
                {t(`streak.guide.states.${state}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-700">{t('streak.guide.safetyTitle')}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{t('streak.guide.safetyText1')}</p>
        <p className="text-slate-600 text-sm leading-relaxed">{t('streak.guide.safetyText2')}</p>
      </section>
    </div>
  );
};
