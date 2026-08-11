/**
 * Quota Hire — Employee Dashboard (Mobile)
 * EXACT visual clone of src/pages/employee/EmployeeDashboard.tsx
 *
 * Sections (in order, matching web):
 *  1. Hero banner  — gradient + 3D employee_welcome.png + CTA buttons
 *  2. KPI stat cards (horizontal scroll on mobile)
 *  3. Application Activity line/area chart (touch-enabled, responsive)
 *  4. Pipeline Breakdown donut chart
 *  5. Market Salary Trends area chart
 *  6. Recent Applications list
 *  7. Profile Completion card (only shown if score < 100)
 *  8. Recommended Roles (horizontal scroll)
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import Svg, { Polygon, Line, Circle, Text as SvgText, G, Path, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

import {
  Colors, Palette, Shadow, BorderRadius,
  FontSize, FontWeight, Spacing, TabBarHeight,
} from '@/constants/theme';
import { useEmployeeDashboardData } from '@/hooks/useEmployeeDashboardData';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 16;
const CHART_W = SCREEN_W - H_PAD * 2 - 32;
const LINE_CHART_W = SCREEN_W - H_PAD * 2 - 48; // slightly narrower for line charts

function Skeleton({ width, height, borderRadius, style }: { width?: any; height?: any; borderRadius?: number; style?: any }) {
  const opacity = useRef(new RNAnimated.Value(0.3)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 0.8,
          duration: 850,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 0.3,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <RNAnimated.View
      style={[
        {
          width: width ?? '100%',
          height: height ?? 20,
          backgroundColor: '#e2e8f0',
          borderRadius: borderRadius ?? 8,
          opacity: opacity,
        },
        style,
      ]}
    />
  );
}

function RadarChartSvg({ data, width, height }: { data: any[]; width: number; height: number }) {
  const colors = Colors.light;
  if (!data || data.length === 0) return null;

  const padding = 35;
  const radius = Math.min(width, height) / 2 - padding;
  const cx = width / 2;
  const cy = height / 2;
  const levels = 3;

  const getPoint = (index: number, total: number, value: number, max: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const total = data.length;
  const maxVal = 150;

  const levelRings = [];
  for (let i = 1; i <= levels; i++) {
    const r = (radius / levels) * i;
    const points = [];
    for (let j = 0; j < total; j++) {
      const angle = (Math.PI * 2 / total) * j - Math.PI / 2;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    levelRings.push(points.join(' '));
  }

  const axisLines = [];
  for (let j = 0; j < total; j++) {
    const outerPoint = getPoint(j, total, maxVal, maxVal);
    axisLines.push(
      <Line
        key={`axis-${j}`}
        x1={cx}
        y1={cy}
        x2={outerPoint.x}
        y2={outerPoint.y}
        stroke={colors.borderMid}
        strokeWidth={1.5}
      />
    );
  }

  const pointsA = data.map((d, j) => {
    const pt = getPoint(j, total, d.A || 0, maxVal);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const pointsB = data.map((d, j) => {
    const pt = getPoint(j, total, d.B || 0, maxVal);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const labelOffset = 14;
  const labels = data.map((d, j) => {
    const angle = (Math.PI * 2 / total) * j - Math.PI / 2;
    const labelRadius = radius + labelOffset;
    const x = cx + labelRadius * Math.cos(angle);
    const y = cy + labelRadius * Math.sin(angle);
    
    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    if (Math.cos(angle) > 0.1) textAnchor = 'start';
    if (Math.cos(angle) < -0.1) textAnchor = 'end';

    return (
      <SvgText
        key={`label-${j}`}
        x={x}
        y={y + 4}
        fill={colors.textSecondary}
        fontSize={10}
        fontWeight="600"
        textAnchor={textAnchor}
      >
        {d.subject}
      </SvgText>
    );
  });

  return (
    <Svg width={width} height={height}>
      <G>
        {levelRings.map((points, idx) => (
          <Polygon
            key={`ring-${idx}`}
            points={points}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {axisLines}
        {pointsB && (
          <Polygon
            points={pointsB}
            fill="rgba(99,102,241,0.12)"
            stroke={Palette.indigo500}
            strokeWidth={2}
          />
        )}
        {pointsA && (
          <Polygon
            points={pointsA}
            fill="rgba(245,158,11,0.25)"
            stroke={Palette.warm500}
            strokeWidth={2}
          />
        )}
        {labels}
      </G>
    </Svg>
  );
}

function LiquidGlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const {
    padding,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    width,
    height,
    margin,
    marginHorizontal,
    marginVertical,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    flex,
    ...otherStyle
  } = flattenedStyle as any;

  return (
    <View style={[
      {
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
      },
      { width, height, margin, marginHorizontal, marginVertical, marginTop, marginBottom, marginLeft, marginRight, flex }
    ]}>
      <View style={[{
        flex: flex ?? 1,
        height: height ? '100%' : undefined,
        width: width ? '100%' : undefined,
        padding: padding ?? 16,
        paddingHorizontal,
        paddingVertical,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }, otherStyle]}>
        {children}
      </View>
    </View>
  );
}

function StatCard({
  label, value, iconName, iconBg, iconColor, sub, onPress, delay = 0, style,
}: {
  label: string;
  value: React.ReactNode;
  iconName: any;
  iconBg: string;
  iconColor: string;
  sub?: React.ReactNode;
  onPress?: () => void;
  delay?: number;
  style?: any;
}) {
  const colors = Colors.light;
  const scale  = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(() => {
    if (!onPress) return;
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 14 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={style}>
      <Animated.View style={animStyle}>
        <Pressable onPress={handlePress}>
          <LiquidGlassCard style={styles.statCard}>
            <View style={styles.statCardTop}>
              <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
                <Feather name={iconName} size={18} color={iconColor} />
              </View>
              {onPress && <Feather name="chevron-right" size={13} color={colors.textMuted} />}
            </View>
            {React.isValidElement(value) ? (
              <View style={{ height: 32, justifyContent: 'center', marginBottom: 4 }}>{value}</View>
            ) : (
              <Text style={[styles.kpiValue, { color: colors.text }]}>
                {value}
              </Text>
            )}
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
            {React.isValidElement(sub) ? (
              sub
            ) : (
              sub && <Text style={[styles.statSub, { color: colors.textMuted }]}>{sub}</Text>
            )}
          </LiquidGlassCard>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Section card (custom gradient translucent glass card) ───────────────────
function SectionCard({ children, delay = 0, style }: {
  children: React.ReactNode; delay?: number; style?: any;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={style}>
      <LiquidGlassCard style={styles.sectionCard}>
        {children}
      </LiquidGlassCard>
    </Animated.View>
  );
}

// ─── Application Activity — Custom SVG Area Chart ────────────────────────────
function ApplicationActivitySection({
  analytics, colors,
}: { analytics: any; colors: any }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const weeks: { week: string; apps: number; interviews: number }[] =
    analytics.applicationActivityData || [];

  // ── Dimensions ─────────────────────────────────────────────────────────────
  const PAD = { top: 28, right: 12, bottom: 36, left: 34 };
  const CHART_H = 210;
  const CHART_W_SVG = SCREEN_W - H_PAD * 2 - 32; // full card width minus card padding
  const plotW = CHART_W_SVG - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  // ── Derived values ──────────────────────────────────────────────────────────
  const allVals = weeks.flatMap(w => [w.apps, w.interviews]);
  const rawMax  = Math.max(...allVals, 1);
  const niceMax = Math.ceil(rawMax * 1.2); // 20% headroom

  const totalApps       = weeks.reduce((s, w) => s + w.apps, 0);
  const totalInterviews = weeks.reduce((s, w) => s + w.interviews, 0);
  const convRate        = totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0;

  // WoW change for apps (last week vs previous week)
  const wowChange = weeks.length >= 2
    ? weeks[weeks.length - 1].apps - weeks[weeks.length - 2].apps
    : null;

  // ── Coordinate helpers ──────────────────────────────────────────────────────
  const getX = (i: number) =>
    PAD.left + (weeks.length <= 1 ? plotW / 2 : (i / (weeks.length - 1)) * plotW);
  const getY = (v: number) =>
    PAD.top + plotH - (v / niceMax) * plotH;

  // ── Cubic bezier path builder ────────────────────────────────────────────────
  const buildPath = (vals: number[]): string => {
    if (!vals.length) return '';
    if (vals.length === 1) return `M ${getX(0)} ${getY(vals[0])}`;
    let d = `M ${getX(0)} ${getY(vals[0])}`;
    for (let i = 1; i < vals.length; i++) {
      const x0 = getX(i - 1), y0 = getY(vals[i - 1]);
      const x1 = getX(i),     y1 = getY(vals[i]);
      const cpx = (x0 + x1) / 2;
      d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };

  const buildArea = (vals: number[]): string => {
    const line = buildPath(vals);
    if (!line) return '';
    const baseY = PAD.top + plotH;
    return `${line} L ${getX(vals.length - 1)} ${baseY} L ${getX(0)} ${baseY} Z`;
  };

  const appVals = weeks.map(w => w.apps);
  const intVals = weeks.map(w => w.interviews);
  const appLinePath  = buildPath(appVals);
  const appAreaPath  = buildArea(appVals);
  const intLinePath  = buildPath(intVals);
  const intAreaPath  = buildArea(intVals);

  // ── Grid ────────────────────────────────────────────────────────────────────
  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y:     PAD.top + plotH * (1 - pct),
    label: pct === 0 ? '0' : String(Math.round(niceMax * pct)),
  }));

  const hasData = weeks.length > 0;
  const sel     = selectedIdx !== null ? weeks[selectedIdx] : null;

  // ── Tooltip position — clamp so it never clips card edge ───────────────────
  const tooltipW = 150;
  const rawTipX  = selectedIdx !== null ? getX(selectedIdx) - tooltipW / 2 : 0;
  const tipX     = Math.max(0, Math.min(rawTipX, CHART_W_SVG - tooltipW));
  const tipY     = selectedIdx !== null
    ? Math.min(getY(Math.max(weeks[selectedIdx].apps, weeks[selectedIdx].interviews)) - 70, PAD.top - 4)
    : 0;

  return (
    <SectionCard delay={300} style={{ marginBottom: 16 }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.chartHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Application Activity</Text>
          <Text style={[styles.chartSub, { color: colors.textMuted }]}>
            Tap any week for a breakdown
          </Text>
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          <View style={[styles.chip, { backgroundColor: Palette.accent50 }]}>
            <Feather name="trending-up" size={11} color={Palette.indigo500} />
            <Text style={[styles.chipText, { color: Palette.indigo500 }]}>4-Week</Text>
          </View>
          {wowChange !== null && (
            <View style={[styles.chip, {
              backgroundColor: wowChange >= 0 ? Palette.emerald50 : Palette.red50,
              paddingHorizontal: 7,
            }]}>
              <Feather
                name={wowChange >= 0 ? 'arrow-up' : 'arrow-down'}
                size={9}
                color={wowChange >= 0 ? Palette.emerald500 : Palette.red500}
              />
              <Text style={[styles.chipText, {
                color: wowChange >= 0 ? Palette.emerald500 : Palette.red500,
                fontSize: 9,
              }]}>
                {Math.abs(wowChange)} vs last wk
              </Text>
            </View>
          )}
        </View>
      </View>

      {hasData ? (
        <>
          {/* ── SVG chart ────────────────────────────────────────────────── */}
          <View style={{ position: 'relative' }}>
            <Svg width={CHART_W_SVG} height={CHART_H} style={{ overflow: 'visible' }}>
              <Defs>
                {/* Gradient fills */}
                <SvgLinearGradient id="actAppGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={Palette.indigo500} stopOpacity="0.28" />
                  <Stop offset="1" stopColor={Palette.indigo500} stopOpacity="0.00" />
                </SvgLinearGradient>
                <SvgLinearGradient id="actIntGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={Palette.emerald500} stopOpacity="0.18" />
                  <Stop offset="1" stopColor={Palette.emerald500} stopOpacity="0.00" />
                </SvgLinearGradient>
              </Defs>

              {/* ── Grid lines + Y labels ─────────────────────────────────── */}
              {gridTicks.map((gt, i) => (
                <G key={`grid-${i}`}>
                  <Line
                    x1={PAD.left} y1={gt.y}
                    x2={CHART_W_SVG - PAD.right} y2={gt.y}
                    stroke={i === gridTicks.length - 1 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth={1}
                    strokeDasharray={i === 0 ? undefined : '4 3'}
                  />
                  <SvgText
                    x={PAD.left - 6} y={gt.y + 4}
                    fontSize={9} fill={colors.textMuted}
                    textAnchor="end" fontWeight="600"
                  >
                    {gt.label}
                  </SvgText>
                </G>
              ))}

              {/* ── X axis baseline ───────────────────────────────────────── */}
              <Line
                x1={PAD.left} y1={PAD.top + plotH}
                x2={CHART_W_SVG - PAD.right} y2={PAD.top + plotH}
                stroke="rgba(0,0,0,0.10)" strokeWidth={1}
              />

              {/* ── Selected-week vertical rule ───────────────────────────── */}
              {selectedIdx !== null && (
                <Line
                  x1={getX(selectedIdx)} y1={PAD.top}
                  x2={getX(selectedIdx)} y2={PAD.top + plotH}
                  stroke={Palette.indigo500}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  strokeOpacity={0.45}
                />
              )}

              {/* ── Area fills ───────────────────────────────────────────── */}
              <Path d={appAreaPath}  fill="url(#actAppGrad)" />
              <Path d={intAreaPath}  fill="url(#actIntGrad)" />

              {/* ── Stroke lines ──────────────────────────────────────────── */}
              <Path
                d={appLinePath}
                fill="none"
                stroke={Palette.indigo500}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={intLinePath}
                fill="none"
                stroke={Palette.emerald500}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* ── Data points ───────────────────────────────────────────── */}
              {weeks.map((w, i) => {
                const isActive = selectedIdx === i;
                return (
                  <G key={`pts-${i}`}>
                    {/* Halo rings on active */}
                    {isActive && (
                      <>
                        <Circle cx={getX(i)} cy={getY(w.apps)} r={11} fill={Palette.indigo500} fillOpacity={0.1} />
                        <Circle cx={getX(i)} cy={getY(w.interviews)} r={11} fill={Palette.emerald500} fillOpacity={0.1} />
                      </>
                    )}
                    {/* Apps point */}
                    <Circle
                      cx={getX(i)} cy={getY(w.apps)}
                      r={isActive ? 6 : 4}
                      fill="#ffffff"
                      stroke={Palette.indigo500}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {/* Interviews point */}
                    <Circle
                      cx={getX(i)} cy={getY(w.interviews)}
                      r={isActive ? 6 : 4}
                      fill="#ffffff"
                      stroke={Palette.emerald500}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {/* Value labels on active week */}
                    {isActive && w.apps > 0 && (
                      <SvgText
                        x={getX(i)} y={getY(w.apps) - 10}
                        fontSize={10} fill={Palette.indigo700}
                        textAnchor="middle" fontWeight="800"
                      >
                        {w.apps}
                      </SvgText>
                    )}
                    {isActive && w.interviews > 0 && (
                      <SvgText
                        x={getX(i)} y={getY(w.interviews) - 10}
                        fontSize={10} fill="#047857"
                        textAnchor="middle" fontWeight="800"
                      >
                        {w.interviews}
                      </SvgText>
                    )}
                    {/* X-axis label */}
                    <SvgText
                      x={getX(i)} y={CHART_H - 6}
                      fontSize={10} fill={isActive ? Palette.indigo500 : colors.textMuted}
                      textAnchor="middle" fontWeight={isActive ? '800' : '600'}
                    >
                      {w.week}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>

            {/* ── Floating tooltip ─────────────────────────────────────── */}
            {sel !== null && selectedIdx !== null && (
              <Animated.View
                entering={FadeInDown.duration(180).springify()}
                style={{
                  position: 'absolute',
                  left: tipX,
                  top: Math.max(2, getY(Math.max(sel.apps, sel.interviews)) - 62),
                  width: tooltipW,
                  backgroundColor: '#1e293b',
                  borderRadius: 10,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 6,
                }}
              >
                {/* Tooltip header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700' }}>
                    {sel.week}
                  </Text>
                  <Pressable onPress={() => setSelectedIdx(null)} hitSlop={8}>
                    <Feather name="x" size={11} color="#64748b" />
                  </Pressable>
                </View>
                {/* Apps row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.indigo500 }} />
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>Applications</Text>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginLeft: 'auto' as any }}>
                    {sel.apps}
                  </Text>
                </View>
                {/* Interviews row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.emerald500 }} />
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>Interviews</Text>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginLeft: 'auto' as any }}>
                    {sel.interviews}
                  </Text>
                </View>
                {/* Rate */}
                {sel.apps > 0 && (
                  <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                    <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '600' }}>
                      Success rate: {Math.round((sel.interviews / sel.apps) * 100)}%
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* ── Touch column zones (transparent, over SVG) ─────────────── */}
            <View style={{
              position: 'absolute',
              top: PAD.top,
              left: PAD.left,
              width: plotW,
              height: plotH,
              flexDirection: 'row',
            }}>
              {weeks.map((_, i) => (
                <Pressable
                  key={`zone-${i}`}
                  style={{ flex: 1, height: '100%' }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedIdx(prev => prev === i ? null : i);
                  }}
                />
              ))}
            </View>
          </View>

          {/* ── Horizontal summary metrics (inline, no card layout) ─────────────── */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0,0.06)',
          }}>
            {/* Total Applications */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.indigo500 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{totalApps}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>Total Apps</Text>
            </View>

            {/* Total Interviews */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.emerald500 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{totalInterviews}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>Interviews</Text>
            </View>

            {/* Conversion Rate */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Feather name="zap" size={13} color={Palette.violet500} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{convRate}%</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>Conv. Rate</Text>
            </View>
          </View>
        </>
      ) : (
        /* ── Empty state ──────────────────────────────────────────────────── */
        <View style={styles.emptyChart}>
          <View style={[styles.emptyIconWrap, { backgroundColor: Palette.accent50 }]}>
            <Feather name="trending-up" size={28} color={Palette.accent500} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No activity yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Submit your first application and your trend will appear here
          </Text>
        </View>
      )}
    </SectionCard>
  );
}

// ─── Pipeline Breakdown — Donut Chart Section (Touch-enabled) ──────────────────
function PipelineDonutSection({
  pieData, applications, colors,
}: { pieData: any[]; applications: any[]; colors: any }) {
  const [selectedSlice, setSelectedSlice] = useState<any>(null);
  const enhancedPieData = pieData.map(d => ({
    ...d,
    onPress: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedSlice((prev: any) => prev?.label === d.label ? null : d);
    },
    shiftX: selectedSlice?.label === d.label ? 4 : 0,
    shiftY: selectedSlice?.label === d.label ? -4 : 0,
  }));

  return (
    <SectionCard delay={360} style={{ marginBottom: 16 }}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Pipeline Breakdown</Text>
          <Text style={[styles.chartSub, { color: colors.textMuted }]}>Tap a segment to see details</Text>
        </View>
      </View>

      {pieData.length > 0 ? (
        <View style={styles.pieContainer}>
          <PieChart
            data={enhancedPieData}
            donut
            showText
            textColor="white"
            textSize={10}
            radius={80}
            innerRadius={50}
            centerLabelComponent={() => (
              <Pressable
                onPress={() => setSelectedSlice(null)}
                style={{ alignItems: 'center', padding: 8 }}
              >
                {selectedSlice ? (
                  <>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: selectedSlice.color }}>{selectedSlice.value}</Text>
                    <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600', textAlign: 'center' }}>{selectedSlice.label}</Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{applications.length}</Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>Total</Text>
                  </>
                )}
              </Pressable>
            )}
            isAnimated
            animationDuration={600}
          />
          <View style={styles.pieLegend}>
            {pieData.map(d => (
              <Pressable
                key={d.label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedSlice((prev: any) => prev?.label === d.label ? null : d);
                }}
                style={[styles.legendItem, {
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                  backgroundColor: selectedSlice?.label === d.label ? d.color + '22' : 'transparent',
                }]}
              >
                <View style={[styles.legendDot, { backgroundColor: d.color, width: 10, height: 10 }]} />
                <Text style={[styles.legendText, { color: selectedSlice?.label === d.label ? d.color : colors.textSecondary }]}>
                  {d.label}: {d.value}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Feather name="pie-chart" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No applications yet</Text>
        </View>
      )}
    </SectionCard>
  );
}

// ─── Skill Match Analysis Section — Radar + real skill data ─────────────────────
function SkillMatchSection({
  skillMatchData, userSkills, colors,
}: { skillMatchData: any[]; userSkills: string[]; colors: any }) {
  const derivedData = React.useMemo(() => {
    if (skillMatchData && skillMatchData.length > 0) {
      return skillMatchData.map(d => ({
        ...d,
        subject: d.subject || d.skill || 'Unknown',
        A: d.A ?? d.yourScore ?? 50,
        B: d.B ?? d.marketDemand ?? 80,
      }));
    }

    const fallbackSkills = [
      'Enterprise Sales', 'SDR / BDR', 'Closing', 'Cold Outreach', 'CRM Tools', 'Presentation',
    ];
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    return fallbackSkills.map((skill, i) => {
      const hasSkill = userSkillsLower.some(us =>
        us.includes(skill.toLowerCase().split(' ')[0]) ||
        skill.toLowerCase().includes(us.split(' ')[0])
      );
      return {
        subject: skill.length > 12 ? skill.slice(0, 11) + '…' : skill,
        A: hasSkill ? 110 + Math.round(Math.random() * 20) : 45 + Math.round(Math.random() * 25),
        B: 85 + Math.round(Math.random() * 40),
      };
    });
  }, [skillMatchData, userSkills]);

  const hasRealSkills = userSkills.length > 0;
  const matchedCount = skillMatchData.filter(d => d.A >= d.B).length;
  const totalSkills = skillMatchData.length;

  return (
    <SectionCard delay={390} style={{ marginBottom: 16 }}>
      <View style={styles.chartHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Skill Match Analysis</Text>
          <Text style={[styles.chartSub, { color: colors.textMuted }]}>
            {hasRealSkills
              ? `${userSkills.length} skills on your profile vs. market demand`
              : 'Add skills to your profile to personalise this chart'}
          </Text>
        </View>
        {skillMatchData.length > 0 && (
          <View style={[styles.chip, {
            backgroundColor: matchedCount >= totalSkills * 0.5 ? Palette.emerald50 : Palette.amber50,
          }]}>
            <Feather
              name={matchedCount >= totalSkills * 0.5 ? 'check-circle' : 'alert-circle'}
              size={11}
              color={matchedCount >= totalSkills * 0.5 ? Palette.emerald600 : Palette.amber700}
            />
            <Text style={[styles.chipText, {
              color: matchedCount >= totalSkills * 0.5 ? Palette.emerald600 : Palette.amber700,
            }]}>
              {matchedCount}/{totalSkills} match
            </Text>
          </View>
        )}
      </View>

      {!hasRealSkills && skillMatchData.length === 0 ? (
        <View style={styles.emptyChart}>
          <View style={[styles.emptyIconWrap, { backgroundColor: Palette.violet50 || '#f5f3ff' }]}>
            <Feather name="target" size={28} color={Palette.violet600 || '#7c3aed'} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No skills added yet</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>Add skills to your profile to see your match vs. market demand</Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <RadarChartSvg
            data={derivedData}
            width={CHART_W}
            height={240}
          />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Palette.warm500 }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Your Skills</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Palette.indigo500 }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Market Demand</Text>
            </View>
          </View>
          {skillMatchData.length === 0 && userSkills.length > 0 && (
            <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>
              Showing estimated match based on your {userSkills.length} profile skill{userSkills.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}
    </SectionCard>
  );
}

// ─── Market Salary Trends — Area Chart Section (Touch-enabled) ─────────────────
function MarketSalarySection({
  salaryData1, salaryData2, colors,
}: { salaryData1: any[]; salaryData2: any[]; colors: any }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const touchData1 = salaryData1.map((d, i) => ({
    ...d,
    onPress: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIdx(prev => prev === i ? null : i);
    },
  }));
  const touchData2 = salaryData2.map((d, i) => ({
    ...d,
    onPress: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIdx(prev => prev === i ? null : i);
    },
  }));

  const hasData = salaryData1.length > 0;
  const selOTE = selectedIdx !== null ? salaryData1[selectedIdx] : null;
  const selBase = selectedIdx !== null ? salaryData2[selectedIdx] : null;

  return (
    <SectionCard delay={420} style={{ marginBottom: 16 }}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Market Salary Trends</Text>
          <Text style={[styles.chartSub, { color: colors.textMuted }]}>Tap any point for details · 6 months</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: Palette.emerald50 }]}>
          <Feather name="trending-up" size={11} color={Palette.emerald500} />
          <Text style={[styles.chipText, { color: Palette.emerald500 }]}>Live</Text>
        </View>
      </View>

      {hasData ? (
        <>
          {selOTE && (
            <View style={{
              backgroundColor: '#1e293b', borderRadius: 10, padding: 10,
              marginBottom: 10, flexDirection: 'row', gap: 16, alignItems: 'center',
              shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
            }}>
              <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>{selOTE.label}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.indigo500 }} />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>${selOTE.value.toFixed(0)}k OTE</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.emerald500 }} />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>${selBase?.value.toFixed(0)}k Base</Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedIdx(null)} hitSlop={8}>
                <Feather name="x" size={14} color="#64748b" />
              </Pressable>
            </View>
          )}
          <LineChart
            data={touchData1}
            data2={touchData2}
            width={LINE_CHART_W}
            height={160}
            areaChart
            curved
            color1={Palette.indigo500}
            color2={Palette.emerald500}
            startFillColor1={Palette.indigo500}
            startFillColor2={Palette.emerald500}
            startOpacity1={0.2}
            startOpacity2={0.15}
            endOpacity1={0}
            endOpacity2={0}
            thickness1={2.5}
            thickness2={2.5}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            rulesColor="rgba(0,0,0,0.06)"
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}
            formatYLabel={(v) => `${Number(v).toFixed(0)}k`}
            isAnimated
            animationDuration={800}
            hideDataPoints={false}
            dataPointsRadius1={5}
            dataPointsRadius2={5}
            dataPointsColor1={Palette.indigo500}
            dataPointsColor2={Palette.emerald500}
            focusEnabled
            showStripOnFocus
            stripColor="rgba(0,0,0,0.08)"
            stripWidth={2}
          />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Palette.indigo500 }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>OTE</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Palette.emerald500 }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Base Salary</Text>
            </View>
          </View>
          <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>
            Tap any data point to see details
          </Text>
        </>
      ) : (
        <View style={styles.emptyChart}>
          <Feather name="trending-up" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No salary data yet</Text>
        </View>
      )}
    </SectionCard>
  );
}

// ─── Status chip config (mirrors web statusConfig exactly) ───────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; chip: string; chipText: string }> = {
  pending:      { label: 'Applied',          dot: Palette.neutral400,  chip: Palette.neutral100,  chipText: Palette.neutral600 },
  under_review: { label: 'Under Review',     dot: Palette.amber500,    chip: Palette.amber50,     chipText: Palette.amber700   },
  interview:    { label: 'Interview',        dot: Palette.purple500,   chip: Palette.purple50,    chipText: Palette.purple700  },
  decision:     { label: 'Decision Pending', dot: Palette.blue500,     chip: Palette.blue50,      chipText: Palette.blue600    },
  accepted:     { label: 'Offer Received',   dot: Palette.emerald500,  chip: Palette.emerald50,   chipText: Palette.emerald600 },
  rejected:     { label: 'Not Selected',     dot: Palette.red400,      chip: Palette.red50,       chipText: Palette.red700     },
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function EmployeeDashboardScreen() {
  const colors = Colors.light;
  const router = useRouter();

  const recommendedScrollRef = useRef<ScrollView>(null);
  const scrollXRef = useRef(0);
  const maxScrollXRef = useRef(0);
  const scrollWidthRef = useRef(0);
  const layoutWidthRef = useRef(0);
  const isInteractingRef = useRef(false);
  const hasBeenManuallyScrolledRef = useRef(false);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = useCallback(() => {
    if (intervalIdRef.current) return;
    intervalIdRef.current = setInterval(() => {
      if (isInteractingRef.current) return;
      if (maxScrollXRef.current <= 0) return;

      scrollXRef.current += 0.5; // smooth slow scroll speed
      if (scrollXRef.current >= maxScrollXRef.current) {
        scrollXRef.current = 0;
      }
      recommendedScrollRef.current?.scrollTo({ x: scrollXRef.current, animated: false });
    }, 20);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  const handleScroll = useCallback((event: any) => {
    if (isInteractingRef.current) {
      scrollXRef.current = event.nativeEvent.contentOffset.x;
    }
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    isInteractingRef.current = true;
  }, []);

  const handleScrollEndDrag = useCallback((event: any) => {
    scrollXRef.current = event.nativeEvent.contentOffset.x;
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  }, []);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    scrollXRef.current = event.nativeEvent.contentOffset.x;
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  }, []);

  const handleTouchStart = useCallback(() => {
    isInteractingRef.current = true;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  }, []);

  const handleContentSizeChange = useCallback((w: number) => {
    scrollWidthRef.current = w;
    maxScrollXRef.current = Math.max(0, w - layoutWidthRef.current);
  }, []);

  const handleLayout = useCallback((event: any) => {
    const w = event.nativeEvent.layout.width;
  layoutWidthRef.current = w;
    maxScrollXRef.current = Math.max(0, scrollWidthRef.current - w);
  }, []);

  const {
    user, jobs, applications, savedJobs, analytics,
    profileScore, profileItems, toggleSavedJob, refreshData, isLoading,
    isFetching, hasError, isNetworkError,
  } = useEmployeeDashboardData();

  const firstName    = user.name.split(' ')[0];
  const approvedJobs = jobs.filter(j => j.status === 'approved').slice(0, 4);
  const infiniteApprovedJobs = Array.from({ length: 50 }, () => approvedJobs).flat();
  const skillMatchData  = analytics?.skillMatchData || [];

  const pendingApps     = applications.filter(a => a.status === 'pending').length;
  const underReviewApps = applications.filter(a => a.status === 'under_review').length;
  const interviewApps   = applications.filter(a => a.status === 'interview').length;
  const acceptedApps    = applications.filter(a => a.status === 'accepted').length;
  const rejectedApps    = applications.filter(a => a.status === 'rejected').length;
  const decisionApps    = applications.filter(a => a.status === 'decision').length;

  // ── Charts data ──────────────────────────────────────────────────────────
  const pieData = [
    { value: pendingApps,     color: Palette.neutral400,  label: 'Applied',   text: String(pendingApps) },
    { value: underReviewApps, color: Palette.amber500,    label: 'Reviewing', text: String(underReviewApps) },
    { value: interviewApps,   color: Palette.purple500,   label: 'Interview', text: String(interviewApps) },
    { value: decisionApps,    color: Palette.blue500,     label: 'Decision',  text: String(decisionApps) },
    { value: acceptedApps,    color: Palette.emerald500,  label: 'Offer',     text: String(acceptedApps) },
    { value: rejectedApps,    color: Palette.red400,      label: 'Rejected',  text: String(rejectedApps) },
  ].filter(d => d.value > 0);

  const salaryData1 = analytics.marketInsightsData.map((m: { month: string; ote: number; base: number }) => ({
    value: m.ote / 1000, label: m.month, dataPointColor: Palette.indigo500,
  }));
  const salaryData2 = analytics.marketInsightsData.map((m: { month: string; ote: number; base: number }) => ({
    value: m.base / 1000, dataPointColor: Palette.emerald500,
  }));

  const handleSaveJob = useCallback((jobId: string) => {
    toggleSavedJob(jobId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [toggleSavedJob]);

  return (
    <View style={styles.root}>
      {/* Visual background gradient */}
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: TabBarHeight + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refreshData}
            tintColor={Palette.accent500}
            colors={[Palette.accent500]}
          />
        }
      >
        {/* ── Network Error Banner ── */}
        {isNetworkError && (
          <Animated.View entering={FadeInDown.springify()} style={{
            marginBottom: 12, backgroundColor: '#fff3cd', borderRadius: 12,
            borderWidth: 1, borderColor: '#ffc107', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Feather name="wifi-off" size={18} color="#856404" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#856404' }}>Failed to Connect</Text>
              <Text style={{ fontSize: 11, color: '#856404', marginTop: 2 }}>Check your network connection and try again.</Text>
            </View>
            <Pressable
              onPress={refreshData}
              style={{ backgroundColor: '#856404', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Retry</Text>
            </Pressable>
          </Animated.View>
        )}
        {/* ── API Error Banner ── */}
        {hasError && !isNetworkError && (
          <Animated.View entering={FadeInDown.springify()} style={{
            marginBottom: 12, backgroundColor: '#fee2e2', borderRadius: 12,
            borderWidth: 1, borderColor: '#fca5a5', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Feather name="alert-circle" size={18} color="#b91c1c" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#b91c1c' }}>Something Went Wrong</Text>
              <Text style={{ fontSize: 11, color: '#b91c1c', marginTop: 2 }}>We couldn't load the latest data. Tap to refresh.</Text>
            </View>
            <Pressable
              onPress={refreshData}
              style={{ backgroundColor: '#b91c1c', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Try Again</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1 — HERO BANNER
            Matches web: gradient from-accent-500/10 via-white to-warm-500/10
            3D image on top (mobile) | text + CTAs below
            ════════════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ marginBottom: 16 }}>
          <LinearGradient
            colors={[
              '#FCEFCF',
              '#E1F6DD',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, { borderColor: colors.borderMid }]}
          >

            {/* 3D Illustration — employee_welcome.png */}
            <Image
              source={require('@/assets/images/employee_welcome.webp')}
              style={styles.heroImage}
              contentFit="contain"
              transition={300}
            />

            {/* Pills row (My Dashboard + Verified) */}
            <View style={styles.pillsRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: colors.borderMid }]}>
                <Feather name="activity" size={11} color={Palette.indigo500} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>My Dashboard</Text>
              </View>
              {user.isVerified && (
                <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: colors.borderMid }]}>
                  <Feather name="check-circle" size={11} color={Palette.blue500} />
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Verified</Text>
                </View>
              )}
            </View>

            {/* Heading — "Ready to crush it, {name}!" */}
            <Text style={[styles.heroH1, { color: colors.text }]}>
              Ready to crush it,{' '}
              <Text style={{ color: Palette.indigo500 }}>{firstName}!</Text>
            </Text>

            {/* Sub-text — active apps + saved roles count */}
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              You have{' '}
              <Text style={{ color: colors.text, fontWeight: FontWeight.bold }}>
                {analytics.activeApps} active application{analytics.activeApps !== 1 ? 's' : ''}
              </Text>
              {' '}and{' '}
              <Text style={{ color: colors.text, fontWeight: FontWeight.bold }}>
                {savedJobs.length} saved role{savedJobs.length !== 1 ? 's' : ''}
              </Text>
              {'. '}Keep pushing! Your next role is waiting.
            </Text>

            {/* CTA Buttons — Browse Jobs + CV Generator */}
            <View style={styles.ctaRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/explore' as any);
                }}
                style={({ pressed }) => [
                  styles.ctaPrimary,
                  { backgroundColor: Palette.accent500, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="search" size={15} color="#fff" />
                <Text style={styles.ctaPrimaryText}>Browse Jobs</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/cv' as any);
                }}
                style={({ pressed }) => [
                  styles.ctaSecondary,
                  { backgroundColor: '#ffffff', borderColor: colors.borderMid, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="star" size={15} color={Palette.warm500} />
                <Text style={[styles.ctaSecondaryText, { color: colors.text }]}>CV Generator</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2 — KPI STAT CARDS (vertical 2-column grid layout)
            Matches web grid-cols-4 layout logic, but wrapped vertically as a 2x2 grid
            ════════════════════════════════════════════════════════════════════ */}
        <View style={styles.kpiGrid}>
          <StatCard
            label="Active Applications" 
            value={analytics.activeApps ?? 0}
            iconName="briefcase" iconBg={Palette.accent50} iconColor={Palette.accent600}
            sub={`${pendingApps} pending review`}
            onPress={() => router.push('/tracker' as any)} delay={60}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Saved Roles" 
            value={savedJobs.length}
            iconName="bookmark" iconBg={Palette.warm50} iconColor={Palette.warm600}
            sub="Jobs bookmarked"
            onPress={() => router.push('/explore' as any)} delay={120}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Profile Views" 
            value={analytics.profileViews ?? 28}
            iconName="eye" iconBg={Palette.indigo50} iconColor={Palette.indigo600}
            sub="Recruiter views this month"
            onPress={() => router.push('/tracker' as any)} delay={180}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Interviews Won" 
            value={acceptedApps}
            iconName="check-circle" iconBg={Palette.violet50} iconColor={Palette.violet600}
            sub="Applications accepted"
            delay={240}
            style={styles.kpiGridItem}
          />
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3 — APPLICATION ACTIVITY (Line / Area Chart)
            Touch-enabled, responsive line chart showing apps & interviews per week
            ════════════════════════════════════════════════════════════════════ */}
        <ApplicationActivitySection
          analytics={analytics}
          colors={colors}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4 — PIPELINE BREAKDOWN (Donut / Pie chart) — Touch enabled
            ════════════════════════════════════════════════════════════════════ */}
        <PipelineDonutSection
          pieData={pieData}
          applications={applications}
          colors={colors}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4.5 — SKILL MATCH ANALYSIS (Radar) — real profile data
            ════════════════════════════════════════════════════════════════════ */}
        <SkillMatchSection
          skillMatchData={skillMatchData}
          userSkills={user.skills || []}
          colors={colors}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 5 — MARKET SALARY TRENDS (Area Chart) — Touch enabled
            ════════════════════════════════════════════════════════════════════ */}
        <MarketSalarySection
          salaryData1={salaryData1}
          salaryData2={salaryData2}
          colors={colors}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 6 — RECENT APPLICATIONS
            Matches web: list of last 5 apps with status chips + View all link
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={480} style={{ marginBottom: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Recent Applications</Text>
            <Pressable onPress={() => router.push('/tracker' as any)}>
              <Text style={[styles.viewAllText, { color: Palette.accent500 }]}>View all →</Text>
            </Pressable>
          </View>

          {applications.length === 0 ? (
            <View style={styles.emptyChart}>
              <View style={[styles.emptyIconWrap, { backgroundColor: Palette.accent50 }]}>
                <Feather name="briefcase" size={28} color={Palette.accent400} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No applications yet</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Start applying to land your next sales role</Text>
              <Pressable
                onPress={() => router.push('/explore' as any)}
                style={[styles.emptyBtn, { backgroundColor: Palette.accent500 }]}
              >
                <Feather name="search" size={14} color="#fff" />
                <Text style={styles.emptyBtnText}>Browse Jobs</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 4 }}>
              {applications.slice(0, 5).map((app) => {
                const s = STATUS_CONFIG[app.status] || STATUS_CONFIG['pending'];
                return (
                  <Pressable
                    key={app.id}
                    onPress={() => router.push('/tracker' as any)}
                    style={({ pressed }) => [
                      styles.appRow,
                      { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    {/* Gradient initial circle or Company Logo */}
                    {app.companyLogoUrl ? (
                      <View style={[styles.appInitial, { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: '#ffffff' }]}>
                        <Image source={{ uri: app.companyLogoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={[Palette.accent100, Palette.warm100]}
                        style={styles.appInitial}
                      >
                        <Text style={styles.appInitialText}>
                          {(app.company_name || app.job_title || 'J').charAt(0)}
                        </Text>
                      </LinearGradient>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appTitle, { color: colors.text }]} numberOfLines={1}>
                        {app.job_title}
                      </Text>
                      <Text style={[styles.appCompany, { color: colors.textMuted }]}>
                        {app.company_name}
                      </Text>
                    </View>

                    {/* Status chip */}
                    <View style={[styles.statusChip, { backgroundColor: s.chip }]}>
                      <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
                      <Text style={[styles.statusText, { color: s.chipText }]}>{s.label}</Text>
                    </View>

                    <Feather name="chevron-right" size={14} color={colors.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 7 — RECOMMENDED ROLES (horizontal scroll cards)
            Matches web: Top approved jobs matching your profile
            ════════════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={{ marginBottom: 16 }}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Recommended Roles</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Top approved jobs matching your profile</Text>
            </View>
            <Pressable onPress={() => router.push('/explore' as any)}>
              <Text style={[styles.viewAllText, { color: Palette.accent500 }]}>View All →</Text>
            </Pressable>
          </View>

          {isFetching ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 8, paddingVertical: 8 }}
              style={{ marginVertical: -8 }}
            >
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.jobCard, { borderColor: '#e2e8f0', width: 230, height: 220, borderRadius: 16, padding: 14, borderWidth: 1, backgroundColor: '#ffffff', overflow: 'hidden' }]}>
                  <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View style={styles.jobCardTop}>
                      <Skeleton width={40} height={40} borderRadius={12} />
                      <Skeleton width={32} height={32} borderRadius={10} />
                    </View>
                    <View style={{ gap: 6 }}>
                      <Skeleton width="80%" height={14} />
                      <Skeleton width="55%" height={10} />
                    </View>
                    <View style={{ gap: 6 }}>
                      <Skeleton width="100%" height={26} borderRadius={8} />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : approvedJobs.length === 0 ? (
            <View style={[styles.sectionCard, { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' }]}>
              <View style={styles.emptyChart}>
                <Feather name="search" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching roles right now</Text>
              </View>
            </View>
          ) : (
            <ScrollView
              ref={recommendedScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 8, paddingVertical: 8 }}
              style={{ marginVertical: -8 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onContentSizeChange={handleContentSizeChange}
              onLayout={handleLayout}
            >
              {infiniteApprovedJobs.map((job, idx) => {
                const isSaved = savedJobs.includes(job.id);
                return (
                  <Pressable
                    key={`${job.id}-${idx}`}
                    onPress={() => router.push({ pathname: '/job-details', params: { id: job.id } } as any)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                  >
                    <LiquidGlassCard style={styles.jobCard}>
                      <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        {/* Company logo / initial + heart */}
                        <View style={styles.jobCardTop}>
                          <View style={[styles.jobInitial, { backgroundColor: 'rgba(255, 255, 255, 0.45)', borderColor: '#e2e8f0', overflow: 'hidden' }]}>
                            {job.companyLogoUrl ? (
                              <Image source={{ uri: job.companyLogoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                              <Text style={[styles.jobInitialText, { color: colors.textSecondary }]}>
                                {(job.companyName || 'C').charAt(0)}
                              </Text>
                            )}
                          </View>
                          <Pressable
                            onPress={(e) => { handleSaveJob(job.id); }}
                            style={[styles.heartBtn, { backgroundColor: isSaved ? Palette.warm100 : 'transparent' }]}
                            hitSlop={8}
                          >
                            <Feather name="bookmark" size={16} color={isSaved ? Palette.warm600 : colors.textMuted} />
                          </Pressable>
                        </View>

                        {/* Middle Info Section */}
                        <View style={{ flex: 1, justifyContent: 'center', marginVertical: 4 }}>
                          {/* Job title */}
                          <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
                            {job.title}
                          </Text>

                          {/* Company + verified */}
                          <View style={styles.companyRow}>
                            <Text style={[styles.jobCompany, { color: colors.textMuted }]} numberOfLines={1}>
                              {job.companyName}
                            </Text>
                            {job.companyIsVerified && (
                              <Feather name="check-circle" size={12} color={Palette.blue500} />
                            )}
                          </View>
                        </View>

                        {/* Bottom Actions section */}
                        <View>
                          {/* Tags: location, salary */}
                          <View style={styles.tagRow}>
                            <View style={[styles.tag, { backgroundColor: Palette.neutral100 }]}>
                              <Text style={[styles.tagText, { color: colors.textSecondary }]} numberOfLines={1}>{job.location}</Text>
                            </View>
                            {job.salaryRange ? (
                              <View style={[styles.tag, { backgroundColor: Palette.emerald50 }]}>
                                <Text style={[styles.tagText, { color: Palette.emerald600 }]} numberOfLines={1}>{job.salaryRange}</Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Quick Apply button */}
                          <Pressable
                            onPress={() => router.push({ pathname: '/job-details', params: { id: job.id } } as any)}
                            style={({ pressed }) => [
                              styles.applyBtn,
                              { backgroundColor: Palette.accent500, opacity: pressed ? 0.85 : 1 },
                            ]}
                          >
                            <Text style={[styles.applyBtnText, { color: '#ffffff' }]}>Apply Now</Text>
                          </Pressable>
                        </View>
                      </View>
                    </LiquidGlassCard>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: H_PAD, gap: 0 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroBanner: {
    borderRadius: BorderRadius.cardLg,
    borderWidth:  1,
    padding:      20,
    overflow:     'hidden',
  },
  heroImage: {
    alignSelf: 'center',
    width:  Math.min(180, SCREEN_W * 0.45),
    height: Math.min(180, SCREEN_W * 0.45),
    marginBottom: 12,
  },
  pillsRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  heroH1: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5, marginBottom: 6, lineHeight: 32,
  },
  heroSub: { fontSize: FontSize.sm, marginBottom: 16, lineHeight: 20 },
  ctaRow: { flexDirection: 'row', gap: 10 },
  ctaPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12, borderRadius: BorderRadius.button,
  },
  ctaPrimaryText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  ctaSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12, borderRadius: BorderRadius.button, borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ctaSecondaryText: { fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  kpiGridItem: {
    width: (SCREEN_W - H_PAD * 2 - 12) / 2,
  },
  statCard: {
    width: '100%', padding: 16, borderWidth: 0,
  },
  statCardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 12,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  kpiValue:  { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, letterSpacing: -0.5 },
  statLabel: { fontSize: FontSize.sm,  fontWeight: FontWeight.semibold, marginTop: 2 },
  statSub:   { fontSize: FontSize.xs,  marginTop: 2 },
  sectionCard: { padding: 16, borderWidth: 0 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  chartHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 16,
  },
  chartTitle: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold },
  chartSub:   { fontSize: FontSize.xs,   marginTop: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  legendRow:  { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyChart:    { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIconWrap: { padding: 16, borderRadius: 20, marginBottom: 4 },
  emptyText:     { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  emptySub:      { fontSize: FontSize.xs, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  // ── Pie chart ─────────────────────────────────────────────────────────────
  pieContainer: { alignItems: 'center', gap: 16 },
  pieLegend:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },

  // ── Recent applications ───────────────────────────────────────────────────
  viewAllText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  appRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
  },
  appInitial: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  appInitialText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Palette.accent700 },
  appTitle:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  appCompany: { fontSize: FontSize.xs, marginTop: 1 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: FontWeight.bold },

  // ── Profile completion ────────────────────────────────────────────────────
  profileScoreVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  progressBg:      { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 4 },
  checkRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel:      { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  profileBtn: {
    marginTop: 14, paddingVertical: 10,
    borderRadius: 12, alignItems: 'center',
  },
  profileBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // ── Recommended job cards ─────────────────────────────────────────────────
  jobCard: {
    width: 230, height: 220, borderRadius: BorderRadius.card, padding: 14, borderWidth: 1,
    borderColor: '#e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden',
  },
  jobCardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 10,
  },
  jobInitial: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  jobInitialText: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold },
  heartBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  jobTitle:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 2 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  jobCompany: { fontSize: FontSize.xs },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText:    { fontSize: 10, fontWeight: FontWeight.semibold },
  applyBtn:   { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  applyBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
