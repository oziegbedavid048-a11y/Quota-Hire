/**
 * QuotaHire Logo — Bullseye target with briefcase in centre
 * Colors: #1A6515 (forest green) + #5DDE2A (lime green)
 * Usage: <Logo size={40} />
 */
interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = ({ size = 40, className = '' }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Quota Hire logo"
  >
    {/* Outer dark green ring */}
    <circle cx="50" cy="50" r="48" fill="#1A6515" />
    {/* Lime green ring */}
    <circle cx="50" cy="50" r="35" fill="#5DDE2A" />
    {/* Centre dark green disc */}
    <circle cx="50" cy="50" r="21" fill="#1A6515" />

    {/* BRIEFCASE — mathematically centred at (50, 50)
        Total height = 20px → handle top y=40, body bottom y=60
        Width = 22px → x=39 to x=61 (centre x=50) */}

    {/* Handle arch: curves from (43.5, 46) up to y=40 and back to (56.5, 46) */}
    <path
      d="M43.5 46 L43.5 42 Q43.5 40 50 40 Q56.5 40 56.5 42 L56.5 46"
      stroke="white"
      strokeWidth="2.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Body: x=39→61, y=46→60 */}
    <rect x="39" y="46" width="22" height="14" rx="2.5" fill="white" />
    {/* Horizontal divider across centre of body */}
    <rect x="39" y="52.5" width="22" height="2" rx="1" fill="#1A6515" />
    {/* Centre clasp */}
    <rect x="47" y="51" width="6" height="5.5" rx="1.5" fill="#1A6515" />
  </svg>
);
