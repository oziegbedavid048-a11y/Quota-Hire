// Polyfills required by pdfjs-dist 6.x (Map.getOrInsertComputed, Promise.try,
// Math.sumPrecise, Promise.withResolvers). Imported first so they are installed
// before any other module runs. This replaces the inline Promise.withResolvers
// polyfill that used to live below — same purpose, same library, now complete.
import './utils/pdfjsPolyfills';

// Register PDF fonts first — fixes @react-pdf/renderer v4 'unitsPerEm' crash in browser
import './lib/cv/pdfFonts';
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
      // PRIVACY (QH-48): this is a recruitment product. Session Replay records
      // the DOM of pages showing CVs, phone numbers, home addresses and
      // application history, and replaysOnErrorSampleRate: 1.0 means every
      // error session is captured. Masking is on by default in recent SDKs, but
      // relying on a default for this category of data is not good enough — the
      // options are set explicitly so a future SDK upgrade cannot quietly
      // change what leaves users' browsers.
      Sentry.replayIntegration({
        maskAllText: true,      // never transmit rendered text
        maskAllInputs: true,    // never transmit what people type
        blockAllMedia: true,    // no images: avatars, uploaded CVs, ID photos
      })
    ],
    // Performance tracing at 100% is also a lot of data for a free-tier quota;
    // 20% is plenty to spot a slow endpoint and leaves headroom for the error
    // events that actually matter.
    tracesSampleRate: 0.2,
    // No routine recording of healthy sessions — only sessions that errored,
    // which is what is diagnostically useful.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // Strip anything that could carry a credential or personal data out with
    // the event, regardless of where in the app it originated.
    sendDefaultPii: false,
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

      // PRIVACY (QH-48): redact anything credential-shaped from URLs before the
      // event leaves the browser. Sentry records the page URL and the URLs of
      // failed requests, and some of those carry single-use tokens — a resume
      // ticket, a CV download token, a password-reset or verification link. An
      // error report is not a place for any of them.
      const redact = (value?: string) =>
        typeof value === 'string'
          ? value.replace(/([?&](?:token|ticket|code|key|secret|password)=)[^&#\s]*/gi, '$1[redacted]')
          : value;

      if (event.request?.url) event.request.url = redact(event.request.url);
      if (event.request?.query_string && typeof event.request.query_string === 'string') {
        event.request.query_string = redact(event.request.query_string) as string;
      }
      event.breadcrumbs = event.breadcrumbs?.map((crumb) => {
        if (crumb.data?.url) crumb.data.url = redact(crumb.data.url);
        return crumb;
      });

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


// Chrome restores a remembered scroll offset once the document is tall enough,
// which for this app is after a lazily loaded route arrives. That happens well
// after App's own scroll-to-top has run against a still-short page, so the
// restore wins and a reload lands partway down. The app decides where the page
// starts, not the browser.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}


const root = createRoot(document.getElementById("root")!);
root.render(
  <PostHogProvider client={posthog}>
    <SmoothScroll>
      <App />
    </SmoothScroll>
  </PostHogProvider>
);