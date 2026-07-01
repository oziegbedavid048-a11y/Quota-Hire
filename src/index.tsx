import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;
import "./index.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true
  });
}

// Initialize PostHog
if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    person_profiles: 'identified_only'
  });
}

import { SmoothScroll } from "./components/ui/SmoothScroll";

const root = createRoot(document.getElementById("root")!);
root.render(
  <PostHogProvider client={posthog}>
    <SmoothScroll>
      <App />
    </SmoothScroll>
  </PostHogProvider>
);