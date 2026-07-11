import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

// Polyfill for Promise.withResolvers required by newer pdfjs-dist versions
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
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
    enableLogs: true,
    ignoreErrors: [
      // iOS in-app browser (Instagram/Facebook) webkit tracking injection error
      "undefined is not an object (evaluating 'window.webkit.messageHandlers')",
      // Android in-app browser (Facebook/Instagram) Java WebView bridge errors
      "Error invoking postMessage: Java object is gone",
      "Java object is gone",
      "postMessage",
    ],
    beforeSend(event) {
      // Drop any error originating from Facebook/Instagram in-app browser
      // injected scripts (iabjs://, fbios://, etc.) — these are not our code.
      const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
      const isInjectedScript = frames.some(
        (f) =>
          f.filename?.startsWith('iabjs://') ||
          f.filename?.startsWith('fbios://') ||
          f.filename?.includes('navigation_performance_logger')
      );
      if (isInjectedScript) return null;
      return event;
    },
  });
}

// Initialize PostHog
if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    person_profiles: 'identified_only',
    // Do not track anything until the user accepts via the cookie banner.
    // The CookieBanner component calls posthog.opt_in_capturing() on accept.
    opt_out_capturing_by_default: true,
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