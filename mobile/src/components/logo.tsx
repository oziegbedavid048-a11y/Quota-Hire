import React from 'react';
import Svg, { Circle, Rect, Path } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 36 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer dark green ring */}
      <Circle cx="50" cy="50" r="48" fill="#1A6515" />
      {/* Lime green ring */}
      <Circle cx="50" cy="50" r="35" fill="#5DDE2A" />
      {/* Centre dark green disc */}
      <Circle cx="50" cy="50" r="21" fill="#1A6515" />

      {/* BRIEFCASE — perfectly centred at (50, 50) */}
      <Rect x="39" y="46" width="22" height="14" rx="2.5" fill="white" />
      <Path
        d="M43.5 46 L43.5 42 Q43.5 40 50 40 Q56.5 40 56.5 42 L56.5 46"
        stroke="white"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="39" y="52.5" width="22" height="2" rx="1" fill="#1A6515" />
      <Rect x="47" y="51" width="6" height="5.5" rx="1.5" fill="#1A6515" />
    </Svg>
  );
}
