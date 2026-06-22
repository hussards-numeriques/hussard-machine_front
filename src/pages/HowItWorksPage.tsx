import React from 'react';
import { Link } from 'react-router-dom';
import { GradeGuide } from '../components/grade/GradeGuide';
import { StreakGuide } from '../components/streak/StreakGuide';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-primary-dark">Aide &amp; FAQ</h1>

      <GradeGuide />
      <StreakGuide />

      <div className="text-center pb-8">
        <Link
          to="/profile"
          className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
        >
          ← Retour au profil
        </Link>
      </div>
    </div>
  );
};
