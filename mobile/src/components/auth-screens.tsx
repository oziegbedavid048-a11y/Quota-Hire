import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
const API_BASE = "https://quotahire-backend.onrender.com/api";
import { prefetchCache } from "@/services/prefetch-cache";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { GlassView } from "expo-glass-effect";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";

interface AuthScreensProps {
  onLogin: (name?: string, role?: string) => void;
}

// ─── Exact GLSL from ShaderAnimation.tsx ───────────────────────────────────
// time += 0.05 per frame (requestAnimationFrame ~60fps)
// Light-mode: mix toward white where intensity is low → iridescent on white bg
// Blended with opacity: 0.5 (mimics mix-blend-multiply opacity-50)
const SHADER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body,html{width:100%;height:100%;overflow:hidden;background:transparent}
canvas{display:block;width:100%;height:100%;position:absolute;top:0;left:0}
</style>
</head>
<body><canvas id="c"></canvas>
<script>
var canvas=document.getElementById('c');
var gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false});
var vsSource='attribute vec2 pos;void main(){gl_Position=vec4(pos,0.,1.);}';
var fsSource=[
  'precision highp float;',
  'uniform vec2 res;uniform float t;',
  'void main(){',
  '  vec2 uv=(gl_FragCoord.xy*2.-res)/min(res.x,res.y);',
  '  float tm=t*0.05;float lw=0.002;',
  '  vec3 c=vec3(0.);',
  '  for(int j=0;j<3;j++){',
  '    for(int i=0;i<5;i++){',
  '      float fi=float(i);float fj=float(j);',
  '      c[j]+=lw*fi*fi/abs(fract(tm-0.01*fj+fi*0.01)*5.-length(uv)+mod(uv.x+uv.y,0.2));',
  '    }',
  '  }',
  '  float intens=min(1.,length(c));',
  '  vec3 fc=mix(vec3(1.),c,intens);',
  '  gl_FragColor=vec4(fc,0.5);',
  '}',
].join('');
function mkS(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
var prog=gl.createProgram();
gl.attachShader(prog,mkS(gl.VERTEX_SHADER,vsSource));
gl.attachShader(prog,mkS(gl.FRAGMENT_SHADER,fsSource));
gl.linkProgram(prog);gl.useProgram(prog);
var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
var posLoc=gl.getAttribLocation(prog,'pos');
gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);
var resLoc=gl.getUniformLocation(prog,'res');
var tLoc=gl.getUniformLocation(prog,'t');
gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
function resize(){var w=window.innerWidth,h=window.innerHeight;canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);gl.uniform2f(resLoc,w,h);}
window.addEventListener('resize',resize);resize();
var time=1.0;
function loop(){time+=0.05;gl.uniform1f(tLoc,time);gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(loop);}
loop();
</script></body></html>`;

// ─── Design tokens (exact from web source) ─────────────────────────────────
// From tailwind.config.js:
const ACCENT_600 = "#116108"; // from-accent-600
const ACCENT_500 = "#15750a"; // to-accent-500
const ACCENT_400 = "#72dd15"; // accent-400 (focus border)

// From index.css body::before:
// background: linear-gradient(135deg, #fffbeb 0%, #f4fbf2 100%)
const BG_FROM = "#fffbeb";
const BG_TO = "#f4fbf2";

// From Login.tsx overlay: from-accent-500/10 via-transparent to-warm-500/10
// warm-500 = #f59e0b
const OVERLAY_TOP = "rgba(21,117,10,0.10)";
const OVERLAY_BOT = "rgba(245,158,11,0.10)";

// From Login.tsx card: bg-white/40 border border-white/60
const CARD_BG = "rgba(255,255,255,0.40)";
const CARD_BORDER = "rgba(255,255,255,0.60)";

// From Login.tsx shine: from-white/40 to-transparent
const SHINE_TOP = "rgba(255,255,255,0.40)";

// From GlassInput.tsx: bg-white/40 border-2 border-white/50
const INPUT_BG = "rgba(255,255,255,0.40)";
const INPUT_BORDER_DEFAULT = "rgba(255,255,255,0.50)";
// Focus: border-accent-400 shadow-[0_0_15px_rgba(249,115,22,0.2)] — warm glow kept from web
const INPUT_BORDER_FOCUS = "#a3df9b"; // accent-300 (close to accent-400 on mobile)
const INPUT_FOCUS_GLOW = "rgba(114,221,21,0.20)";

// Text from Login.tsx: text-neutral-700 labels, text-neutral-900 values, text-neutral-600 muted
const TEXT_900 = "#0f172a";
const TEXT_700 = "#334155";
const TEXT_600 = "#475569";
const TEXT_400 = "#9ca3af"; // placeholder

// ─── Glass Input — exact replica of GlassInput.tsx ──────────────────────
const GInput = ({
  label,
  icon,
  value,
  onChange,
  secret,
  showSecret,
  onToggleSecret,
  kb,
  cap,
  ph,
  fk,
  err,
  focusSet,
  focusCur,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  secret?: boolean;
  showSecret?: boolean;
  onToggleSecret?: () => void;
  kb?: any;
  cap?: any;
  ph?: string;
  fk: string;
  err?: boolean;
  focusSet: (k: string) => void;
  focusCur: string;
}) => {
  const focused = focusCur === fk;
  const borderColor = err
    ? "#f87171"
    : focused
      ? INPUT_BORDER_FOCUS
      : INPUT_BORDER_DEFAULT;
  const iconColor = err ? "#f87171" : focused ? ACCENT_500 : "#6b7280";

  return (
    <View style={gs.inputBlock}>
      <Text style={gs.inputLabel}>{label}</Text>
      <View style={[gs.inputWrap, { borderColor }]}>
        <View style={gs.inputIconSlot}>
          <Feather name={icon as any} size={20} color={iconColor} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={ph ?? label}
          placeholderTextColor={TEXT_400}
          autoCapitalize={cap ?? "none"}
          keyboardType={kb}
          secureTextEntry={secret && !showSecret}
          onFocus={() => focusSet(fk)}
          onBlur={() => focusSet("")}
          style={gs.inputField}
        />
        {secret && (
          <Pressable onPress={onToggleSecret} style={gs.inputEye}>
            <Feather
              name={showSecret ? "eye-off" : "eye"}
              size={18}
              color="#9ca3af"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const ShaderBackground = React.memo(() => {
  return (
    <View style={stylesShader.shaderWrap} pointerEvents="none">
      <WebView
        source={{ html: SHADER_HTML }}
        style={stylesShader.shaderView}
        transparent={true}
        opaque={false}
        scrollEnabled={false}
        pointerEvents="none"
      />
    </View>
  );
});

const stylesShader = StyleSheet.create({
  shaderWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.5,
  },
  shaderView: { flex: 1, backgroundColor: "transparent" },
});

export default function AuthScreens({ onLogin }: AuthScreensProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  // ── Login state
  const [lEmail, setLEmail] = useState("");
  const [lPass, setLPass] = useState("");
  const [lRemember, setLRemember] = useState(false);
  const [lShowPass, setLShowPass] = useState(false);
  const [lError, setLError] = useState("");
  const [lFocus, setLFocus] = useState("");
  const [lSubmitting, setLSubmitting] = useState(false);

  // ── Signup state
  const [role, setRole] = useState<"employee" | "company">("employee");
  const [sFirst, setSFirst] = useState("");
  const [sLast, setSLast] = useState("");
  const [sCompany, setSCompany] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sCity, setSCity] = useState("");
  const [sCountry, setSCountry] = useState("");
  const [sPass, setSPass] = useState("");
  const [sPassConf, setSPassConf] = useState("");
  const [sShowPass, setSShowPass] = useState(false);
  const [sShowPassConf, setSShowPassConf] = useState(false);
  const [sError, setSError] = useState("");
  const [sFocus, setSFocus] = useState("");
  const [sSubmitting, setSSubmitting] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  // ── Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotFocus, setForgotFocus] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // ── Role switcher animation — CSS transition-all duration-300 in Signup.tsx
  const sliderX = useSharedValue(0);
  const [switcherWidth, setSwitcherWidth] = useState(0);

  useEffect(() => {
    setLError("");
    setSError("");
    setForgotError("");
    setForgotSuccess("");
    setForgotEmail("");
  }, [mode]);

  const switchRole = (r: "employee" | "company") => {
    setRole(r);
    sliderX.value = withTiming(r === "employee" ? 0 : 1, { duration: 300 });
  };

  // Exact translation: translateX(calc(100% + 0.25rem)) where 0.25rem = 4px
  // Pill width = calc(50% - 0.25rem) of container
  const sliderStyle = useAnimatedStyle(() => {
    const pillW = switcherWidth / 2 - 4;
    const offset = interpolate(sliderX.value, [0, 1], [0, pillW + 4]);
    return {
      width: pillW > 0 ? pillW : 0,
      transform: [{ translateX: offset }],
    };
  });

  const handleForgot = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address.");
      return;
    }
    setForgotError("");
    setForgotSuccess("");
    setForgotSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setForgotError(
          data?.error ||
            data?.detail ||
            "Could not send reset email. Please try again.",
        );
      } else {
        setForgotSuccess(
          "Reset link sent! Check your email inbox (and spam folder) for a link to reset your password on the web app.",
        );
      }
    } catch {
      setForgotError(
        "Could not connect to the server. Please check your internet connection.",
      );
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!lEmail.trim() || !lPass.trim()) {
      setLError("Email and Password are required.");
      return;
    }
    setLError("");
    setLSubmitting(true);
    try {
      // ── Fire login AND public jobs fetch in parallel ───────────────────────
      // /jobs/ is public (no auth) so we can fetch it while the login is in
      // flight. By the time login succeeds the jobs list is already in memory.
      const [res, jobsRes] = await Promise.all([
        fetch(`${API_BASE}/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: lEmail.trim(), password: lPass }),
        }),
        fetch(`${API_BASE}/jobs/`).catch(() => null), // best-effort — public endpoint
      ]);

      const data = await res.json();
      if (!res.ok) {
        setLError(
          data?.detail ||
            data?.error ||
            data?.non_field_errors?.[0] ||
            "Invalid email or password.",
        );
        setLSubmitting(false);
        return;
      }

      // Parse the jobs that arrived in parallel (may be null if network hiccup)
      let rawJobs: any[] = [];
      if (jobsRes?.ok) {
        const jobsData = await jobsRes.json().catch(() => null);
        rawJobs = Array.isArray(jobsData)
          ? jobsData
          : (jobsData?.results ?? []);
      }

      // ── Populate the prefetch cache immediately ────────────────────────────
      // The login response already contains the user object — that is enough for
      // Phase 1 of useLocalDashboardData. Profile/apps/analytics arrive via the
      // background fetch below and are patched into the cache as they resolve.
      prefetchCache.set({
        user: data.user ?? null,
        jobs: rawJobs,
        profile: null,
        applications: [],
        analytics: null,
      });

      // ── Store JWT tokens securely ──────────────────────────────────────────
      if (data.access)
        await SecureStore.setItemAsync("access_token", data.access);
      if (data.refresh)
        await SecureStore.setItemAsync("refresh_token", data.refresh);

      // ── Fire private background prefetches (non-blocking) ─────────────────
      // These fill in the rest of the cache WHILE the user is looking at the
      // dashboard. By the time they scroll to profile / applications, data is there.
      if (data.access && data.user?.role === "employee") {
        _backgroundPrefetchEmployee(data.access);
      }

      // Store user info for auto-login on next app open
      const uName =
        data.user?.full_name || data.user?.name || data.user?.email || "";
      const uRole = data.user?.role || "employee";
      await SecureStore.setItemAsync("user_name", uName);
      await SecureStore.setItemAsync("user_role", uRole);

      setLSubmitting(false);
      onLogin(uName, uRole); // ← dashboard mounts here; cache is already populated
    } catch (e: any) {
      setLError(
        "Could not connect to the server. Please check your internet connection.",
      );
      setLSubmitting(false);
    }
  };

  /**
   * Fires parallel private API calls immediately after login, patching the
   * prefetch cache as each one resolves. The dashboard hook picks these up the
   * moment it first reads the cache, making Phase-2 data appear without a second
   * loading state.
   */
  function _backgroundPrefetchEmployee(token: string) {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/profile/employee/`, { headers: h })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${API_BASE}/applications/`, { headers: h })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${API_BASE}/dashboard/analytics/`, { headers: h })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([profile, appsRaw, analytics]) => {
        const apps = Array.isArray(appsRaw)
          ? appsRaw
          : (appsRaw?.results ?? []);
        prefetchCache.patch({ profile, applications: apps, analytics });
      })
      .catch(() => {
        /* silently swallow — dashboard will fetch normally if cache is gone */
      });
  }

  const handleSignup = async () => {
    if (role === "employee" && (!sFirst.trim() || !sLast.trim())) {
      setSError("First and Last names are required.");
      return;
    }
    if (role === "company" && !sCompany.trim()) {
      setSError("Company name is required.");
      return;
    }
    if (!sEmail.trim() || !sPass.trim() || !sPassConf.trim()) {
      setSError("All required fields must be filled.");
      return;
    }
    if (sPass !== sPassConf) {
      setSError("Passwords do not match.");
      return;
    }
    setSError("");
    setSSubmitting(true);
    try {
      const body: any = {
        email: sEmail.trim(),
        password: sPass,
        password_confirm: sPassConf,
        role,
        phone: sPhone,
        city: sCity,
        country: sCountry,
      };
      if (role === "employee") {
        body.first_name = sFirst.trim();
        body.last_name = sLast.trim();
      } else {
        body.company_name = sCompany.trim();
      }
      const res = await fetch(`${API_BASE}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.detail ||
          data?.error ||
          Object.values(data as Record<string, string[]>).flat()?.[0] ||
          "Registration failed. Please try again.";
        setSError(msg);
        setSSubmitting(false);
        return;
      }
      // Store JWT tokens after registration
      if (data.access)
        await SecureStore.setItemAsync("access_token", data.access);
      if (data.refresh)
        await SecureStore.setItemAsync("refresh_token", data.refresh);
      const uName =
        data.user?.full_name ||
        data.user?.name ||
        `${sFirst} ${sLast}` ||
        sCompany;
      const uRole = data.user?.role || role;
      await SecureStore.setItemAsync("user_name", uName);
      await SecureStore.setItemAsync("user_role", uRole);
      // Show verify email screen for employee, or proceed for company
      setSSubmitting(false);
      if (uRole === "employee") {
        setShowVerify(true);
      } else {
        onLogin(uName, uRole);
      }
    } catch (e: any) {
      setSError(
        "Could not connect to the server. Please check your internet connection.",
      );
      setSSubmitting(false);
    }
  };

  const getStrength = (p: string) => {
    if (!p) return { score: 0, label: "", color: "#d1d5db" };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const map: Record<number, { label: string; color: string }> = {
      1: { label: "Weak", color: "#ef4444" },
      2: { label: "Fair", color: "#f97316" },
      3: { label: "Good", color: "#eab308" },
      4: { label: "Strong", color: "#22c55e" },
    };
    return { score: s, ...(map[s] ?? { label: "", color: "#d1d5db" }) };
  };

  const strength = getStrength(sPass);

  return (
    <View style={gs.root}>
      {/* Body::before: linear-gradient(135deg, #fffbeb 0%, #f4fbf2 100%) */}
      <LinearGradient
        colors={[BG_FROM, BG_TO]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.135, y: 0 }}
        end={{ x: 0.865, y: 1 }}
      />

      {/* Shader background (opacity-50 mix-blend-multiply) */}
      <ShaderBackground />

      {/* Ambient overlay: from-accent-500/10 via-transparent to-warm-500/10 */}
      <LinearGradient
        colors={[OVERLAY_TOP, "transparent", OVERLAY_BOT]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />

      <SafeAreaView style={gs.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={gs.flex}
        >
          <ScrollView
            contentContainerStyle={gs.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header ── */}
            <View style={gs.header}>
              {/* w-16 h-16 drop-shadow-md */}
              <View style={gs.logoWrap}>
                <Image
                  source={require("@/assets/images/expo-logo.png")}
                  style={gs.logo}
                  contentFit="contain"
                />
              </View>
              {/* text-2xl font-display font-bold text-neutral-900 tracking-tight mb-2 */}
              <Text style={gs.cardTitle}>
                {mode === "login"
                  ? "Secure Login"
                  : mode === "forgot"
                    ? "Reset Password"
                    : "Create an account"}
              </Text>
              {/* text-sm text-neutral-600 font-medium */}
              <Text style={gs.cardSub}>
                {mode === "login"
                  ? "Enter your credentials to access your portal."
                  : mode === "forgot"
                    ? "Enter your email and we'll send you a reset link."
                    : "Join the premier network for sales professionals."}
              </Text>
            </View>

            <View style={gs.cardShadow}>
              <View style={gs.glassCard}>
                {mode === "forgot" ? (
                  <View>
                    {/* Error banner */}
                    {!!forgotError && (
                      <View style={gs.errorBanner}>
                        <Feather
                          name="alert-triangle"
                          size={16}
                          color="#dc2626"
                        />
                        <Text style={gs.errorText}>{forgotError}</Text>
                      </View>
                    )}

                    {/* Success banner */}
                    {!!forgotSuccess && (
                      <View
                        style={[
                          gs.errorBanner,
                          {
                            backgroundColor: "rgba(16,185,129,0.08)",
                            borderColor: "rgba(16,185,129,0.20)",
                          },
                        ]}
                      >
                        <Feather
                          name="check-circle"
                          size={16}
                          color="#059669"
                        />
                        <Text style={[gs.errorText, { color: "#059669" }]}>
                          {forgotSuccess}
                        </Text>
                      </View>
                    )}

                    <View style={[gs.formGap, { marginBottom: 20 }]}>
                      <GInput
                        label="Email Address"
                        icon="mail"
                        value={forgotEmail}
                        onChange={setForgotEmail}
                        kb="email-address"
                        fk="fe"
                        focusSet={setForgotFocus}
                        focusCur={forgotFocus}
                      />
                    </View>

                    {/* Send reset link button */}
                    <Pressable
                      onPress={handleForgot}
                      disabled={forgotSubmitting || !!forgotSuccess}
                      style={({ pressed }) => ({
                        opacity:
                          pressed || forgotSubmitting || !!forgotSuccess
                            ? 0.75
                            : 1,
                      })}
                    >
                      <LinearGradient
                        colors={[ACCENT_600, ACCENT_500]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={gs.submitBtn}
                      >
                        {forgotSubmitting ? (
                          <View style={gs.btnRow}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={gs.btnText}>Sending...</Text>
                          </View>
                        ) : forgotSuccess ? (
                          <View style={gs.btnRow}>
                            <Feather name="check" size={16} color="#fff" />
                            <Text style={gs.btnText}>Link Sent</Text>
                          </View>
                        ) : (
                          <Text style={gs.btnText}>Send Reset Link</Text>
                        )}
                      </LinearGradient>
                    </Pressable>

                    <View style={gs.divider} />
                    <View style={gs.switchRow}>
                      <Pressable onPress={() => setMode("login")}>
                        <Text style={[gs.switchLink, { fontSize: 14 }]}>
                          Back to Login
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : mode === "login" ? (
                  <View>
                    {/* Error: bg-red-500/10 border border-red-500/20 rounded-xl p-4 font-bold */}
                    {!!lError && (
                      <View style={gs.errorBanner}>
                        <Feather
                          name="alert-triangle"
                          size={16}
                          color="#dc2626"
                        />
                        <Text style={gs.errorText}>{lError}</Text>
                      </View>
                    )}

                    {/* space-y-6 */}
                    <View style={gs.formGap}>
                      <GInput
                        label="Email or Username"
                        icon="mail"
                        value={lEmail}
                        onChange={setLEmail}
                        kb="default"
                        fk="le"
                        focusSet={setLFocus}
                        focusCur={lFocus}
                      />
                      <GInput
                        label="Password"
                        icon="lock"
                        value={lPass}
                        onChange={setLPass}
                        secret
                        showSecret={lShowPass}
                        onToggleSecret={() => setLShowPass(!lShowPass)}
                        fk="lp"
                        focusSet={setLFocus}
                        focusCur={lFocus}
                      />
                    </View>

                    {/* flex items-center justify-between: remember + forgot */}
                    <View style={gs.rememberRow}>
                      <Pressable
                        onPress={() => setLRemember(!lRemember)}
                        style={gs.checkRow}
                      >
                        {/* w-5 h-5 border-2 border-neutral-300 rounded checked:bg-accent-500 */}
                        <View
                          style={[gs.checkbox, lRemember && gs.checkboxActive]}
                        >
                          {lRemember && (
                            <Feather name="check" size={11} color="#fff" />
                          )}
                        </View>
                        <Text style={gs.rememberText}>Remember me</Text>
                      </Pressable>
                      <Pressable onPress={() => setMode("forgot")}>
                        <Text style={gs.forgotText}>Forgot password?</Text>
                      </Pressable>
                    </View>

                    {/* Main submit button */}
                    <Pressable
                      onPress={handleLogin}
                      disabled={lSubmitting}
                      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
                    >
                      <LinearGradient
                        colors={[ACCENT_600, ACCENT_500]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={gs.submitBtn}
                      >
                        {lSubmitting ? (
                          <View style={gs.btnRow}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={gs.btnText}>Authenticating...</Text>
                          </View>
                        ) : (
                          <Text style={gs.btnText}>Secure Sign In</Text>
                        )}
                      </LinearGradient>
                    </Pressable>

                    {/* OR divider */}
                    <View style={gs.orRow}>
                      <View style={gs.orLine} />
                      <Text style={gs.orText}>or</Text>
                      <View style={gs.orLine} />
                    </View>

                    {/* Sign in with Google */}
                    <Pressable
                      style={({ pressed }) => [
                        gs.googleBtn,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <GoogleG />
                      <Text style={gs.googleBtnText}>Continue with Google</Text>
                    </Pressable>

                    {/* mt-8 pt-6 border-t border-white/20 */}
                    <View style={gs.divider} />
                    <View style={gs.switchRow}>
                      <Text style={gs.switchText}>Don't have an account? </Text>
                      <Pressable onPress={() => setMode("signup")}>
                        <Text style={gs.switchLink}>Create one now</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View>
                    {!!sError && (
                      <View style={gs.errorBanner}>
                        <Feather
                          name="alert-triangle"
                          size={16}
                          color="#dc2626"
                        />
                        <Text style={gs.errorText}>{sError}</Text>
                      </View>
                    )}

                    {/* Role Switcher — flex p-1 bg-white/50 rounded-2xl border border-white/50 */}
                    <View
                      style={gs.switcher}
                      onLayout={(e) =>
                        setSwitcherWidth(e.nativeEvent.layout.width)
                      }
                    >
                      {/* absolute top-1 bottom-1 bg-white rounded-xl shadow-md — the sliding pill */}
                      <Animated.View style={[gs.switcherPill, sliderStyle]} />
                      <Pressable
                        onPress={() => switchRole("employee")}
                        style={gs.switcherTab}
                      >
                        <Feather
                          name="user"
                          size={15}
                          color={role === "employee" ? ACCENT_600 : "#6b7280"}
                        />
                        <Text
                          style={[
                            gs.switcherLabel,
                            {
                              color:
                                role === "employee" ? ACCENT_600 : "#6b7280",
                            },
                          ]}
                        >
                          Job Seeker
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => switchRole("company")}
                        style={gs.switcherTab}
                      >
                        <Feather
                          name="briefcase"
                          size={15}
                          color={role === "company" ? ACCENT_600 : "#6b7280"}
                        />
                        <Text
                          style={[
                            gs.switcherLabel,
                            {
                              color:
                                role === "company" ? ACCENT_600 : "#6b7280",
                            },
                          ]}
                        >
                          I'm Hiring
                        </Text>
                      </Pressable>
                    </View>

                    <View style={gs.formGap}>
                      {/* Stacked input fields for sales professionals */}
                      {role === "company" ? (
                        <GInput
                          label="Company Name"
                          icon="briefcase"
                          value={sCompany}
                          onChange={setSCompany}
                          cap="words"
                          fk="sc"
                          focusSet={setSFocus}
                          focusCur={sFocus}
                        />
                      ) : (
                        <>
                          <GInput
                            label="First Name"
                            icon="user"
                            value={sFirst}
                            onChange={setSFirst}
                            cap="words"
                            fk="sf"
                            focusSet={setSFocus}
                            focusCur={sFocus}
                          />
                          <GInput
                            label="Last Name"
                            icon="user"
                            value={sLast}
                            onChange={setSLast}
                            cap="words"
                            fk="sl"
                            focusSet={setSFocus}
                            focusCur={sFocus}
                          />
                        </>
                      )}

                      <GInput
                        label="Email or Username"
                        icon="mail"
                        value={sEmail}
                        onChange={setSEmail}
                        kb="default"
                        fk="se"
                        focusSet={setSFocus}
                        focusCur={sFocus}
                      />

                      <GInput
                        label="Phone Number"
                        icon="phone"
                        value={sPhone}
                        onChange={setSPhone}
                        kb="phone-pad"
                        ph="+1 (555) 000-0000"
                        fk="sp"
                        focusSet={setSFocus}
                        focusCur={sFocus}
                      />

                      <GInput
                        label="Country"
                        icon="map-pin"
                        value={sCountry}
                        onChange={setSCountry}
                        cap="words"
                        ph="e.g. United States"
                        fk="sco"
                        focusSet={setSFocus}
                        focusCur={sFocus}
                      />

                      <GInput
                        label="City"
                        icon="map-pin"
                        value={sCity}
                        onChange={setSCity}
                        cap="words"
                        ph="e.g. New York"
                        fk="sct"
                        focusSet={setSFocus}
                        focusCur={sFocus}
                      />

                      <GInput
                        label="Password"
                        icon="lock"
                        value={sPass}
                        onChange={setSPass}
                        secret
                        showSecret={sShowPass}
                        onToggleSecret={() => setSShowPass(!sShowPass)}
                        fk="spw"
                        focusSet={setSFocus}
                        focusCur={sFocus}
                      />

                      <GInput
                        label="Confirm Password"
                        icon="lock"
                        value={sPassConf}
                        onChange={setSPassConf}
                        secret
                        showSecret={sShowPassConf}
                        onToggleSecret={() => setSShowPassConf(!sShowPassConf)}
                        fk="spc"
                        focusSet={setSFocus}
                        focusCur={sFocus}
                      />

                      {/* PasswordStrengthMeter */}
                      {sPass.length > 0 && (
                        <View style={gs.strengthWrap}>
                          <View style={gs.strengthTrack}>
                            <View
                              style={[
                                gs.strengthFill,
                                {
                                  width:
                                    `${(strength.score / 4) * 100}%` as any,
                                  backgroundColor: strength.color,
                                },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              gs.strengthLabel,
                              { color: strength.color },
                            ]}
                          >
                            {strength.label}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Signup submit button */}
                    <Pressable
                      onPress={handleSignup}
                      disabled={sSubmitting}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.88 : 1,
                        marginTop: 20,
                      })}
                    >
                      <LinearGradient
                        colors={[ACCENT_600, ACCENT_500]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={gs.submitBtn}
                      >
                        {sSubmitting ? (
                          <View style={gs.btnRow}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={gs.btnText}>Creating account...</Text>
                          </View>
                        ) : (
                          <Text style={gs.btnText}>Create Secure Account</Text>
                        )}
                      </LinearGradient>
                    </Pressable>

                    {/* OR divider */}
                    <View style={gs.orRow}>
                      <View style={gs.orLine} />
                      <Text style={gs.orText}>or</Text>
                      <View style={gs.orLine} />
                    </View>

                    {/* Sign up with Google */}
                    <Pressable
                      style={({ pressed }) => [
                        gs.googleBtn,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <GoogleG />
                      <Text style={gs.googleBtnText}>Sign up with Google</Text>
                    </Pressable>

                    <View style={gs.divider} />
                    <View style={gs.switchRow}>
                      <Text style={gs.switchText}>
                        Already have an account?{" "}
                      </Text>
                      <Pressable onPress={() => setMode("login")}>
                        <Text style={gs.switchLink}>Log in</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Verification Modal ── */}
      {/* fixed inset-0 flex items-center justify-center p-4 */}
      {showVerify && (
        <View style={gs.modalOverlay}>
          {/* bg-neutral-900/60 backdrop-blur-sm */}
          <Pressable
            style={gs.modalBackdrop}
            onPress={() => {
              setShowVerify(false);
              setMode("login");
            }}
          />
          <Animated.View entering={FadeIn.duration(350)} style={gs.modalCard}>
            {/* w-20 h-20 bg-accent-100 rounded-full */}
            <View style={gs.modalIcon}>
              <Feather name="mail" size={40} color={ACCENT_600} />
            </View>
            {/* text-2xl sm:text-3xl font-display font-bold mb-3 */}
            <Text style={gs.modalTitle}>Check your email</Text>
            {/* text-sm text-neutral-600 mb-8 leading-relaxed */}
            <Text style={gs.modalBody}>
              We've sent a confirmation link to your email address. Please click
              the link to verify your account before logging in.{"\n\n"}
              <Text style={gs.modalWarn}>
                Please check your spam folder if it is not in your inbox.
              </Text>
            </Text>
            <Pressable
              onPress={() => {
                setShowVerify(false);
                setMode("login");
              }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.88 : 1,
                width: "100%",
              })}
            >
              <LinearGradient
                colors={[ACCENT_600, ACCENT_500]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={gs.submitBtn}
              >
                <Text style={gs.btnText}>Go to Login</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ─── Google G Logo — real official multicolour logo ──────────────────────────

const GoogleG = () => (
  <Image
    source={require("../../assets/images/google-logo.png")}
    style={{ width: 18, height: 18 }}
    contentFit="contain"
  />
);

// ─── Styles — precise mobile translation of the web CSS ────────────────────
const gs = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },

  // Shader layer — opacity: 0.5 (mix-blend-multiply opacity-50)
  shaderWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
    zIndex: 1,
  },
  shaderView: { flex: 1, backgroundColor: "transparent" },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  // ── Header ──────────────────────────────────────────────────────────
  header: { alignItems: "center", marginBottom: 24, zIndex: 10 },
  logoWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    // drop-shadow-md
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: { width: 64, height: 64 },

  // text-2xl font-display font-bold tracking-tight
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: TEXT_900,
    marginBottom: 6,
    textAlign: "center",
  },
  // text-sm font-medium text-neutral-600
  cardSub: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_600,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // ── Liquid Glass Card (two-layer approach)
  // cardShadow: outer container, no overflow:hidden, holds the iOS drop-shadow
  // glassCard: inner GlassView, overflow:hidden clips it to rounded corners
  //            NO borderWidth here — that was the cause of the thick black frame
  cardShadow: {
    borderRadius: 28,
    // iOS drop-shadow only (no elevation — Android elevation = dark halo)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  glassCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },

  // ── Google Button
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#dadce0", // Google's exact border colour
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3c4043", // Google's text colour
    letterSpacing: 0.1,
  },

  // ── OR divider
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 14,
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  orText: { fontSize: 13, fontWeight: "500", color: "#94a3b8" },

  // ── GlassInput ──────────────────────────────────────────────────────
  // relative (with bottom spacing between inputs: space-y-6 = 24px)
  inputBlock: { position: "relative" },
  // block text-sm font-bold text-neutral-700 mb-1.5 ml-1
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_700,
    marginBottom: 6,
    marginLeft: 4,
  },
  // Input container — clean border on white card
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc", // very light grey
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0", // neutral-200
  },
  // pl-4 pr-2 icon slot
  inputIconSlot: { paddingLeft: 16, paddingRight: 8 },
  // w-full bg-transparent py-3.5 text-neutral-900 font-medium
  inputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: TEXT_900,
    paddingVertical: 14, // py-3.5 = 14px
  },
  // absolute right-3 p-1
  inputEye: { paddingHorizontal: 12, paddingVertical: 14 },

  // space-y-4 sm:space-y-5 → gap: 20
  formGap: { gap: 20 },
  // flex flex-col sm:flex-row gap-5
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },

  // ── Remember row ──────────────────────────────────────────────────
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 20,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // w-5 h-5 border-2 border-neutral-300 rounded
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: ACCENT_500, borderColor: ACCENT_500 },
  rememberText: { fontSize: 14, fontWeight: "500", color: TEXT_600 },
  // text-accent-600
  forgotText: { fontSize: 14, fontWeight: "600", color: ACCENT_600 },

  // ── Submit Button ─────────────────────────────────────────────────
  // w-full py-4 rounded-xl text-base font-bold text-white shadow-xl
  submitBtn: {
    height: 52,
    borderRadius: 12, // rounded-xl = 12px
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT_500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // text-base font-bold text-white
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Divider on white card — use a proper visible grey line
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: 24,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: { fontSize: 14, fontWeight: "500", color: TEXT_600 },
  switchLink: { fontSize: 14, fontWeight: "700", color: ACCENT_600 },

  // ── Error Banner ──────────────────────────────────────────────────
  // bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm flex items-start gap-3
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { flex: 1, color: "#dc2626", fontSize: 14, fontWeight: "700" },

  // ── Role Switcher ─────────────────────────────────────────────────
  // Role Switcher — light grey pill on white card
  switcher: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9", // neutral-100
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 4,
    height: 50,
    position: "relative",
    overflow: "hidden",
    marginBottom: 20,
  },
  // Active sliding pill — white on light grey
  switcherPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  // flex-1 flex justify-center items-center gap-1 sm:gap-2
  switcherTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 10,
  },
  // text-xs sm:text-sm font-bold
  switcherLabel: { fontSize: 14, fontWeight: "700" },

  // ── Password Strength ─────────────────────────────────────────────
  strengthWrap: { gap: 6 },
  strengthTrack: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700" },

  // ── Modal ─────────────────────────────────────────────────────────
  // fixed inset-0 z-[100] flex items-center justify-center p-4
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  // bg-neutral-900/60 backdrop-blur-sm absolute inset-0
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15,23,42,0.60)",
  },
  // bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-neutral-200 text-center
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 32,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  // w-20 h-20 bg-accent-100 rounded-full
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e5f6e2", // accent-100
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  // text-2xl sm:text-3xl font-bold mb-3
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: TEXT_900,
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  // text-sm text-neutral-600 mb-8 leading-relaxed
  modalBody: {
    fontSize: 14,
    color: TEXT_600,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  // font-bold text-red-500
  modalWarn: { fontWeight: "700", color: "#ef4444" },
});
