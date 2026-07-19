import { DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import Onboarding from "@/components/onboarding";
import VideoSplash from "@/components/video-splash";
import AuthScreens from "@/components/auth-screens";
import { Palette } from "@/constants/theme";
import { useKeepAlive } from "@/hooks/useKeepAlive";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  API_BASE,
} from "@/services/api";
import { useRouter } from "expo-router";
import {
  registerForPushNotificationsAsync,
  getNavigationPathFromPush,
  Notifications,
} from "@/services/notifications";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const router = useRouter();
  const [splashFinished, setSplashFinished] = useState(false);
  const [startSplashAnim, setStartSplashAnim] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ── Stored user info for AppTabs ──────────────────────────────────────────
  const [userName, setUserName] = useState<string | undefined>();
  const [userRole, setUserRole] = useState<string | undefined>();

  // ── Keep Render dyno warm while user is logged in ─────────────────────────
  useKeepAlive(isLoggedIn);

  // ── Notification tap listener ref (cleaned up on unmount) ─────────────────
  const notifResponseListener = useRef<any>(null);

  // ── On app start: validate stored token → auto-login or clear ────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        const storedName = await SecureStore.getItemAsync("user_name");
        const storedRole = await SecureStore.getItemAsync("user_role");

        if (!token) {
          setCheckingAuth(false);
          return;
        }

        // ── Try a silent token refresh before mounting the dashboard ──────
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          try {
            const res = await fetch(`${API_BASE}/auth/refresh/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.access) {
                await setAccessToken(data.access);
                if (data.refresh) await setRefreshToken(data.refresh);
              }
            } else if (res.status === 401) {
              await clearTokens();
              await SecureStore.deleteItemAsync("user_name");
              await SecureStore.deleteItemAsync("user_role");
              setCheckingAuth(false);
              return;
            }
          } catch {
            // Network unavailable — proceed with existing token
          }
        }

        if (storedName) setUserName(storedName);
        if (storedRole) setUserRole(storedRole);
        setIsLoggedIn(true);
        setShowOnboarding(false);

        // ── Register push token for returning (auto-login) users ──────────
        // Fire-and-forget — never block the UI
        registerForPushNotificationsAsync().catch((_e) => {
          console.debug("[Push] Auto-login registration skipped:", _e);
        });
      } catch {
        // SecureStore error — show auth as fallback
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, []);

  // ── Notification tap handler ──────────────────────────────────────────────
  // Runs once after the component mounts. Listens for the user tapping a
  // push notification banner and navigates them to the correct screen.
  useEffect(() => {
    // Listen for taps on notifications (app is open or in background)
    notifResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data as Record<
          string,
          unknown
        >;
        const path = getNavigationPathFromPush(data);

        // Small delay to ensure the navigator is mounted before pushing
        setTimeout(() => {
          try {
            router.push(path as any);
          } catch {
            // Navigator not ready yet — skip navigation gracefully
          }
        }, 300);
      });

    return () => {
      if (notifResponseListener.current) {
        notifResponseListener.current.remove();
      }
    };
  }, [router]);

  const handleLogin = (name?: string, role?: string) => {
    if (name) setUserName(name);
    if (role) setUserRole(role);
    setIsLoggedIn(true);

    // ── Register push token right after login ─────────────────────────────
    // Fire-and-forget — auth flow must not be blocked by push registration
    registerForPushNotificationsAsync().catch((_e) => {
      console.debug("[Push] Login registration skipped:", _e);
    });
  };

  const handleLogout = async () => {
    await clearTokens();
    await SecureStore.deleteItemAsync("user_name");
    await SecureStore.deleteItemAsync("user_role");
    setUserName(undefined);
    setUserRole(undefined);
    setIsLoggedIn(false);
  };

  // Expose for dev testing
  if (typeof globalThis !== "undefined") {
    (globalThis as any).resetOnboarding = () => {
      setSplashFinished(false);
      setStartSplashAnim(false);
      setShowOnboarding(true);
      setIsLoggedIn(false);
    };
    (globalThis as any).logout = handleLogout;
  }

  const CustomTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#FFFBEB",
    },
  };

  if (checkingAuth) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFBEB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={Palette.accent500} />
      </View>
    );
  }

  return (
    <ThemeProvider value={CustomTheme}>
      <AnimatedSplashOverlay onDismiss={() => setStartSplashAnim(true)} />
      {!splashFinished ? (
        <VideoSplash
          start={startSplashAnim}
          onFinish={() => setSplashFinished(true)}
        />
      ) : showOnboarding ? (
        <Onboarding onFinish={() => setShowOnboarding(false)} />
      ) : !isLoggedIn ? (
        <AuthScreens onLogin={handleLogin as any} />
      ) : (
        <AppTabs userRole={userRole} userName={userName} />
      )}
    </ThemeProvider>
  );
}
