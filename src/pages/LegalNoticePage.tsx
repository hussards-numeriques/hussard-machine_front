import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  LegalPage,
  LegalSection,
  LEGAL_LINK_CLASS,
  LEGAL_TEXT_CLASS,
} from '../components/LegalPage';
import { LEGAL_IDENTITY } from '../lib/legalIdentity';

export const LegalNoticePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <LegalPage title={t('legal.notice.title')}>
      <LegalSection title={t('legal.notice.publisher.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          {t('legal.notice.publisher.body', {
            site: LEGAL_IDENTITY.site,
            name: LEGAL_IDENTITY.name,
          })}
        </p>
        <ul className={`${LEGAL_TEXT_CLASS} list-none space-y-1`}>
          <li>{t('legal.notice.publisher.siret', { siret: LEGAL_IDENTITY.siret })}</li>
          <li>{t('legal.notice.publisher.address', { address: LEGAL_IDENTITY.address })}</li>
          <li>
            <Trans
              i18nKey="legal.notice.publisher.email"
              values={{ email: LEGAL_IDENTITY.email }}
              components={{
                mail: <a href={`mailto:${LEGAL_IDENTITY.email}`} className={LEGAL_LINK_CLASS} />,
              }}
            />
          </li>
        </ul>
      </LegalSection>
      <LegalSection title={t('legal.notice.hosting.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          {t('legal.notice.hosting.body', {
            host: LEGAL_IDENTITY.host,
            address: LEGAL_IDENTITY.hostAddress,
          })}
        </p>
      </LegalSection>
      <LegalSection title={t('legal.notice.payment.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          {t('legal.notice.payment.body', {
            processor: LEGAL_IDENTITY.paymentProcessor,
            address: LEGAL_IDENTITY.paymentProcessorAddress,
          })}
        </p>
      </LegalSection>
      <LegalSection title={t('legal.notice.ip.title')}>
        <p className={LEGAL_TEXT_CLASS}>{t('legal.notice.ip.body')}</p>
      </LegalSection>
      <LegalSection title={t('legal.notice.contact.title')}>
        <p className={LEGAL_TEXT_CLASS}>
          <Trans
            i18nKey="legal.notice.contact.body"
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
