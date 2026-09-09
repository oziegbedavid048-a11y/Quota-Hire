import { DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { DeviceEventEmitter } from "react-native";
import * as SecureStore from "expo-secure-store";

import AppTabs from "@/components/app-tabs";
import BiometricLock from "@/components/biometric-lock";
import Onboarding from "@/components/onboarding";
import VideoSplash from "@/components/video-splash";
import AuthScreens from "@/components/auth-screens";
import { useKeepAlive } from "@/hooks/useKeepAlive";
import {
  getAccessToken,
  tryRefresh,
  SESSION_EXPIRED_EVENT,
} from "@/services/api";
import { cacheGet, cacheSet, CacheKeys } from "@/services/app-cache";
import { rememberUserRole } from "@/services/user-role";
import { clearLocalSession, registerSessionLogout } from "@/services/session";
import { useRouter } from "expo-router";
import {
  registerForPushNotificationsAsync,
  getNavigationPathFromPush,
  Notifications,
} from "@/services/notifications";
import * as ScreenOrientation from "expo-screen-orientation";

SplashScreen.preventAutoHideAsync().catch((_err) => {
  console.debug("[SplashScreen] preventAutoHideAsync skipped:", _err);
});

// The Android manifest no longer pins the orientation (Play flags that for
// large-screen devices on Android 16+). Lock to portrait at runtime instead:
// phones stay portrait exactly as before, while foldables and tablets on
// Android 16 are free to rotate, which is the behaviour Google wants.
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
  (_err) => console.debug("[ScreenOrientation] portrait lock skipped:", _err),
);

export default function TabLayout() {
  const router = useRouter();
  const [splashFinished, setSplashFinished] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const [userName, setUserName] = useState<string | undefined>();
  const [userRole, setUserRole] = useState<string | undefined>();

  useKeepAlive(isLoggedIn);

  const notifResponseListener = useRef<any>(null);
  const loggingOutRef = useRef(false);

  const handleLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    try {
      await clearLocalSession();
      setUserName(undefined);
      setUserRole(undefined);
      setIsLoggedIn(false);
    } finally {
      loggingOutRef.current = false;
    }
  }, []);

  useEffect(() => {
    registerSessionLogout(handleLogout);
  }, [handleLogout]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(SESSION_EXPIRED_EVENT, () => {
      handleLogout();
    });
    return () => sub.remove();
  }, [handleLogout]);

  useEffect(() => {
    (async () => {
      try {
        const [token, storedName, storedRole, onboardingDone] = await Promise.all([
          getAccessToken(),
          SecureStore.getItemAsync("user_name"),
          SecureStore.getItemAsync("user_role"),
          cacheGet<boolean | string>(CacheKeys.onboardingDone),
        ]);

        const seenOnboarding = onboardingDone === true || onboardingDone === "true";

        if (!token) {
          setShowOnboarding(!seenOnboarding);
          return;
        }

        if (storedName) setUserName(storedName);
        if (storedRole) {
          rememberUserRole(storedRole);
          setUserRole(storedRole);
        }
        setIsLoggedIn(true);
        setShowOnboarding(false);

        await tryRefresh();

        registerForPushNotificationsAsync().catch((_e) => {
          console.debug("[Push] Auto-login registration skipped:", _e);
        });
      } catch {
        // SecureStore error — show auth as fallback
      } finally {
        setBootstrapped(true);
      }
    })();
  }, []);

  useEffect(() => {
    notifResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data as Record<
          string,
          unknown
        >;
        const path = getNavigationPathFromPush(data);

        setTimeout(() => {
          try {
            router.push(path as any);
          } catch {
            // Navigator not ready yet
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
    if (role) {
      rememberUserRole(role);
      setUserRole(role);
    }
    setIsLoggedIn(true);
    cacheSet(CacheKeys.onboardingDone, true);

    registerForPushNotificationsAsync().catch((_e) => {
      console.debug("[Push] Login registration skipped:", _e);
    });
  };

  const finishOnboarding = () => {
    cacheSet(CacheKeys.onboardingDone, true);
    setShowOnboarding(false);
  };

  if (__DEV__) {
    (globalThis as any).resetOnboarding = () => {
      setSplashFinished(false);
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

  const showSplash = !splashFinished || !bootstrapped;

  return (
    <ThemeProvider value={CustomTheme}>
      {showSplash ? (
        <VideoSplash onFinish={() => setSplashFinished(true)} />
      ) : showOnboarding ? (
        <Onboarding onFinish={finishOnboarding} />
      ) : !isLoggedIn ? (
        <AuthScreens onLogin={handleLogin as any} />
      ) : (
        // QH-12: the biometric preference finally gates something. Only wraps
        // the signed-in tree — the login screen must stay reachable so a user
        // who cannot authenticate is never locked out of the app entirely.
        <BiometricLock>
          <AppTabs userRole={userRole} userName={userName} />
        </BiometricLock>
      )}
    </ThemeProvider>
  );
}
