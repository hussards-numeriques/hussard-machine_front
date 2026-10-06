import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  LegalPage,
  LegalSection,
  LEGAL_LINK_CLASS,
  LEGAL_TEXT_CLASS,
} from '../components/LegalPage';
import { LEGAL_IDENTITY } from '../lib/legalIdentity';

export const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <LegalPage title={t('legal.privacy.title')}>
      <LegalSection title={t('legal.privacy.controller.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.privacy.controller.body"
            values={{ name: LEGAL_IDENTITY.name, address: LEGAL_IDENTITY.address }}
          />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.privacy.data.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.privacy.data.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.privacy.purpose.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.privacy.purpose.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.privacy.storage.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.privacy.storage.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.privacy.cookies.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.privacy.cookies.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.privacy.payment.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.privacy.payment.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.privacy.minors.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.privacy.minors.body"
            values={{ email: LEGAL_IDENTITY.email }}
            components={{
              mail: <a href={`mailto:${LEGAL_IDENTITY.email}`} className={LEGAL_LINK_CLASS} />,
            }}
          />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.privacy.retention.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans i18nKey="legal.privacy.retention.body" />
        </p>
      </LegalSection>
      <LegalSection title={t('legal.privacy.rights.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.privacy.rights.body"
            values={{ email: LEGAL_IDENTITY.email }}
            components={{
              mail: <a href={`mailto:${LEGAL_IDENTITY.email}`} className={LEGAL_LINK_CLASS} />,
            }}
          />
        </p>
      </LegalSection>
    </LegalPage>
  );
};
