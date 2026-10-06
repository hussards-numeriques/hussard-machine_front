import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';
import './index.css';
import './i18n';
import App from './App.tsx';

const sentryDsn: unknown = import.meta.env.VITE_SENTRY_DSN;
if (typeof sentryDsn === 'string' && sentryDsn) {
  Sentry.init({ dsn: sentryDsn, environment: import.meta.env.MODE });
}

const posthogKey: unknown = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost: unknown = import.meta.env.VITE_POSTHOG_HOST;
if (typeof posthogKey === 'string' && posthogKey) {
  posthog.init(posthogKey, {
    api_host:
      typeof posthogHost === 'string' && posthogHost ? posthogHost : 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
