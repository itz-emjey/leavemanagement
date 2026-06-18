import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ── Sentry Initialization ─────────────────────────────────
import * as Sentry from '@sentry/react';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 0.5,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  console.info('[Sentry] Error tracking initialized.');
} else {
  console.warn('[Sentry] VITE_SENTRY_DSN not configured. Error tracking disabled.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

