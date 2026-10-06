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

export const TermsOfSalePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <LegalPage title={t('legal.sale.title')}>
      <LegalSection title={t('legal.sale.purpose.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.sale.purpose.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.sale.subscriber.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.sale.subscriber.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.sale.price.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.sale.price.body"
            components={{ subscription: <Link to="/subscription" className={LEGAL_LINK_CLASS} /> }}
          />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.sale.payment.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.sale.payment.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.sale.noRenewal.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.sale.noRenewal.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.sale.withdrawal.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.sale.withdrawal.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.sale.refund.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.sale.refund.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.sale.claims.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.sale.claims.body"
            values={{ email: LEGAL_IDENTITY.email }}
            components={{
              mail: <a href={`mailto:${LEGAL_IDENTITY.email}`} className={LEGAL_LINK_CLASS} />,
            }}
          />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.sale.law.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.sale.law.body" />
        </p>
      </LegalSection>
    </LegalPage>
  );
};
