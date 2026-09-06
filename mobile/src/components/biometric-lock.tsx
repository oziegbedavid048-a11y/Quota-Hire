/**
 * Biometric app lock (QH-12).
 *
 * The Settings screen has always offered a "biometric login" switch, but the
 * flag it wrote was never read by anything — no prompt on launch, none on
 * resume, and no screen gated behind it. Users who turned it on believed a
 * lost phone was protected; in fact anyone holding the unlocked handset
 * opened straight into a live session carrying a 30-day refresh token.
 *
 * This component makes the switch mean what it says. When the stored
 * preference is 'true' and the device actually has an enrolled biometric, the
 * app is covered by an opaque shield until the user authenticates — on cold
 * start, and again whenever the app returns from the background.
 *
 * Fails open by design: if the device has no enrolled biometric, or the
 * module is unavailable (Expo Go), the lock does not engage. Locking someone
 * out of an app they can no longer authenticate to would be worse than the
 * risk it mitigates.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Pressable, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";

let LocalAuthentication: any = null;
try {
  LocalAuthentication = require("expo-local-authentication");
} catch {
  LocalAuthentication = null;
}

/** Re-lock only after this long in the background, so a quick app switch
 *  (opening the camera, checking a code) does not demand a fingerprint. */
const RELOCK_AFTER_MS = 30_000;

async function biometricsAreUsable(): Promise<boolean> {
  if (!LocalAuthentication?.authenticateAsync) return false;
  try {
    const enabled = await SecureStore.getItemAsync("biometrics_enabled");
    if (enabled !== "true") return false;
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return Boolean(hasHardware && isEnrolled);
  } catch {
    return false;
  }
}

export default function BiometricLock({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const backgroundedAt = useRef<number | null>(null);
  const promptOpen = useRef(false);

  const promptForUnlock = useCallback(async () => {
    if (promptOpen.current) return;
    promptOpen.current = true;
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Quota Hire",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (res?.success) setLocked(false);
    } catch {
      // Leave the shield up; the user can retry with the button.
    } finally {
      promptOpen.current = false;
    }
  }, []);

  // Cold start: lock first, then prompt, so the UI is never briefly visible.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const usable = await biometricsAreUsable();
      if (cancelled) return;
      if (usable) {
        setLocked(true);
        setChecking(false);
        promptForUnlock();
      } else {
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [promptForUnlock]);

  // Resume: re-lock if the app spent long enough in the background.
  useEffect(() => {
    const onChange = async (state: AppStateStatus) => {
      if (state === "background" || state === "inactive") {
        if (backgroundedAt.current === null) backgroundedAt.current = Date.now();
        return;
      }
      if (state !== "active") return;

      const since = backgroundedAt.current;
      backgroundedAt.current = null;
      if (since === null || Date.now() - since < RELOCK_AFTER_MS) return;

      if (await biometricsAreUsable()) {
        setLocked(true);
        promptForUnlock();
      }
    };

    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [promptForUnlock]);

  return (
    <View style={styles.root}>
      <View style={styles.root} pointerEvents={locked ? "none" : "auto"}>
        {children}
      </View>

      {(locked || checking) && (
        <View style={styles.shield}>
          {locked && (
            <>
              <Text style={styles.title}>Quota Hire is locked</Text>
              <Text style={styles.subtitle}>
                Unlock with your fingerprint or face to continue.
              </Text>
              <Pressable
                onPress={promptForUnlock}
                style={styles.button}
                accessibilityRole="button"
                accessibilityLabel="Unlock Quota Hire"
              >
                <Text style={styles.buttonText}>Unlock</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shield: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#EDEEDE",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#15750a",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
});
