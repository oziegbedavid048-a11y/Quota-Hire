/**
 * useKeepAlive — Prevent Render cold starts
 *
 * Silently pings the backend every 10 minutes while the app is in the foreground.
 * When the app moves to the background, pinging stops to preserve battery.
 * When it returns to the foreground, pinging resumes immediately.
 *
 * This keeps the Render web service warm so users never experience
 * the 10-30 second cold-start delay when they open the app.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { pingBackend } from '../services/api';

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function useKeepAlive(enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const startPinging = () => {
    if (intervalRef.current) return; // Already running
    // Ping immediately on (re-)activation to pre-warm the dyno right away
    pingBackend();
    intervalRef.current = setInterval(() => {
      pingBackend();
    }, PING_INTERVAL_MS);
  };

  const stopPinging = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled) {
      stopPinging();
      return;
    }

    // Start pinging when hook mounts (user is logged in & app is active)
    if (appStateRef.current === 'active') {
      startPinging();
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && prev !== 'active') {
        // App came to foreground — resume keep-alive
        startPinging();
      } else if (nextState !== 'active' && prev === 'active') {
        // App went to background/inactive — pause keep-alive
        stopPinging();
      }
    });

    return () => {
      stopPinging();
      subscription.remove();
    };
  }, [enabled]);
}
