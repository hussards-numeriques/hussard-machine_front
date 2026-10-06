import React from 'react';
import { LegalTranslationNotice } from './LegalTranslationNotice';

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
}

export const LegalPage: React.FC<LegalPageProps> = ({ title, children }) => (
  <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
    <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
      <LegalTranslationNotice />
      <h1 className="text-3xl font-black text-primary-dark">{title}</h1>
      {children}
    </div>
  </div>
);

interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

export const LegalSection: React.FC<LegalSectionProps> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-black text-slate-700">{title}</h2>
    {children}
  </section>
);

export const LEGAL_TEXT_CLASS = 'text-slate-600 text-sm leading-relaxed';
export const LEGAL_LINK_CLASS = 'font-bold text-primary hover:underline';
