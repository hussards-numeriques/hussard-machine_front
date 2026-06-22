import React from 'react';
import { STREAK_TIERS } from './StreakFlame';
import { DailyQuestIcon, type QuestState } from './DailyQuestIcon';

const QUEST_STATES: { state: QuestState; label: string }[] = [
  { state: 'secured', label: 'Déjà jouée aujourd’hui : ta série est sécurisée.' },
  { state: 'soft-risk', label: 'Pas encore jouée aujourd’hui, mais tu es encore protégé.' },
  {
    state: 'last-chance',
    label: 'Jouer aujourd’hui est le seul moyen de garder ta série.',
  },
  { state: 'neutral', label: 'Aucune série en cours.' },
];

export const StreakGuide: React.FC = () => {
  const tiers = [...STREAK_TIERS].sort((a, b) => a.min - b.min);

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
      <h2 className="text-2xl font-black text-primary-dark">Les séries quotidiennes</h2>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-700">Le principe</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Réponds à au moins une question chaque jour pour entretenir ta <strong>série</strong> : le
          nombre de jours consécutifs où tu as joué. La série est liée à ton compte, pas à ton
          appareil — il faut donc être connecté pour qu’elle compte.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-700">Les paliers</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Plus ta série grandit, plus ta flamme évolue.
        </p>
        <div className="flex flex-wrap gap-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50"
            >
              <tier.Flame size={28} />
              <span className={`text-sm font-black ${tier.valueColorClass}`}>
                dès {tier.min} jour{tier.min > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-700">La quête du jour</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Une pastille indique l’état de ta série pour aujourd’hui :
        </p>
        <ul className="space-y-2">
          {QUEST_STATES.map(({ state, label }) => (
            <li key={state} className="flex items-center gap-3">
              <DailyQuestIcon state={state} animated={false} />
              <span className="text-slate-600 text-sm leading-relaxed">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-700">Le filet de sécurité</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Le gel est un filet de sécurité : rater une journée ne casse pas forcément ta série, mais
          il part alors en recharge.
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">
          Tant que le filet est en recharge, tu es en dernière chance — il faut jouer aujourd’hui
          pour conserver ta série.
        </p>
      </section>
    </div>
  );
};
