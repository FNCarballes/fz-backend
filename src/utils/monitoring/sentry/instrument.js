//~/src/utils/monitoring/instrument.js
import * as Sentry from "@sentry/node"
import '@sentry/tracing';

Sentry.init({
  dsn: "https://988cb6b184284f361288573f7f00bbfe@o4509872191963136.ingest.us.sentry.io/4509872197206016",
  tracesSampleRate: 1.0, // Ajusta según tus necesidades

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});