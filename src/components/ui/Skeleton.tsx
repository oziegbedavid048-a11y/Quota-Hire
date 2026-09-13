/**
 * Loading placeholders, mirroring mobile/src/components/ui/skeleton.tsx.
 *
 * The app draws a grey shape where each piece of content will land and pulses
 * it until the data arrives, so the layout is already on screen and nothing
 * jumps when it fills in. These are the web equivalents, built on Tailwind's
 * animate-pulse, which motion-reduce disables for anyone who has asked for
 * less movement.
 */

type Size = number | string;

const toCss = (v: Size | undefined) => (typeof v === 'number' ? `${v}px` : v);

interface BoxProps {
  width?: Size;
  height?: Size;
  radius?: Size;
  className?: string;
}

export const SkeletonBox = ({ width = '100%', height = 16, radius = 8, className = '' }: BoxProps) => (
  <div
    aria-hidden="true"
    className={`bg-slate-200/80 dark:bg-neutral-800 animate-pulse motion-reduce:animate-none ${className}`}
    style={{ width: toCss(width), height: toCss(height), borderRadius: toCss(radius) }}
  />
);

export const SkeletonLine = ({ width = '100%', height = 12, className = '' }: Omit<BoxProps, 'radius'>) => (
  <SkeletonBox width={width} height={height} radius={6} className={className} />
);

export const SkeletonAvatar = ({ size = 44, className = '' }: { size?: number; className?: string }) => (
  <SkeletonBox width={size} height={size} radius={size / 2} className={className} />
);
