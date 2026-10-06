import React from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  LegalPage,
  LegalSection,
  LEGAL_LINK_CLASS,
  LEGAL_TEXT_CLASS,
} from '../components/LegalPage';
import { LEGAL_IDENTITY } from '../lib/legalIdentity';

export const TermsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <LegalPage title={t('legal.terms.title')}>
      <LegalSection title={t('legal.terms.purpose.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.terms.purpose.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.terms.age.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.terms.age.body"
            components={{ privacy: <Link to="/privacy-policy" className={LEGAL_LINK_CLASS} /> }}
          />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.terms.account.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.terms.account.body"
            values={{ email: LEGAL_IDENTITY.email }}
            components={{
              mail: <a href={`mailto:${LEGAL_IDENTITY.email}`} className={LEGAL_LINK_CLASS} />,
            }}
          />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.terms.conduct.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.terms.conduct.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.terms.ip.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.terms.ip.body"
            components={{ notice: <Link to="/legal-notice" className={LEGAL_LINK_CLASS} /> }}
          />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.terms.availability.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.terms.availability.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.terms.liability.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.terms.liability.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.terms.termination.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.terms.termination.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.terms.law.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.terms.law.body" />
        </p>
      </LegalSection>
    </LegalPage>
  );
};
