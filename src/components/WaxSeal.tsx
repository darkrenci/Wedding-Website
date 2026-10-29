import React from 'react';

interface WaxSealProps {
  initials?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  isBroken?: boolean;
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  initials = 'EA',
  onClick,
  size = 'md',
  isBroken = false
}) => {
  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Wax seal - Click to open invitation"
      className={`group relative flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 hover:scale-105 focus:outline-none ${sizeClasses} ${isBroken ? 'opacity-0 scale-125 pointer-events-none' : 'opacity-100'}`}
    >
      {/* 3D Wax Shadow */}
      <div className="absolute inset-0 rounded-[50%_50%_48%_52%/54%_52%_48%_46%] bg-[#1a0507] opacity-60 blur-md transform translate-y-3" />

      {/* Outer irregular wax droplet border */}
      <svg
        viewBox="0 0 100 130"
        className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Champagne/Cream Wax gradient */}
          <radialGradient id="waxGrad" cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#fff8ee" />
            <stop offset="28%" stopColor="#f3e7d3" />
            <stop offset="62%" stopColor="#dec8ad" />
            <stop offset="85%" stopColor="#bfa07d" />
            <stop offset="100%" stopColor="#967756" />
          </radialGradient>

          {/* Inner ring gradient */}
          <radialGradient id="innerGrad" cx="45%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#f9f1e3" />
            <stop offset="50%" stopColor="#e6d4bc" />
            <stop offset="100%" stopColor="#b89873" />
          </radialGradient>

          {/* Emboss highlight and shadow filter */}
          <filter id="emboss" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.6" dy="0.8" stdDeviation="0.4" floodColor="#ffffff" floodOpacity="0.8" />
            <feDropShadow dx="-0.8" dy="-0.8" stdDeviation="0.6" floodColor="#664627" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Outer wax pool with organic melted ridges */}
        <path
          d="M 50,4
             C 74,3 95,22 96,48
             C 97,64 96,82 91,96
             C 86,110 74,126 50,126
             C 26,126 14,110 9,96
             C 4,82 3,64 4,48
             C 5,22 26,3 50,4 Z"
          fill="url(#waxGrad)"
        />

        {/* Melted lip contours */}
        <path
          d="M 50,7
             C 70,6 90,24 91,48
             C 92,62 90,80 86,93
             C 81,106 70,122 50,122
             C 30,122 19,106 14,93
             C 10,80 8,62 9,48
             C 10,24 30,6 50,7 Z"
          fill="none"
          stroke="#ebd9c0"
          strokeWidth="1.2"
          opacity="0.6"
        />

        {/* Inner oval stamp bed */}
        <ellipse
          cx="50"
          cy="65"
          rx="36"
          ry="48"
          fill="url(#innerGrad)"
          stroke="#aa8966"
          strokeWidth="1"
        />

        {/* Inner dotted decorative perimeter */}
        <ellipse
          cx="50"
          cy="65"
          rx="33"
          ry="45"
          fill="none"
          stroke="#8c6c4b"
          strokeWidth="0.8"
          strokeDasharray="1.5 2"
          opacity="0.65"
        />

        {/* Embossed Calla Lily / Botanical Stem motif */}
        <g filter="url(#emboss)" stroke="#745535" fill="#745535">
          {/* Flower bell / calla lily */}
          <path
            d="M 50,34
               C 44,40 43,47 46,55
               C 48,59 50,62 50,65
               C 50,62 52,59 54,55
               C 57,47 56,40 50,34 Z"
            fill="#dcc5a7"
            stroke="#6c4d2d"
            strokeWidth="0.9"
          />
          {/* Stamen inside lily */}
          <path
            d="M 50,40 C 49,46 50,51 51,54"
            fill="none"
            stroke="#876541"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Stem curving downward */}
          <path
            d="M 50,65 Q 49,76 47,88 Q 46,94 45,99"
            fill="none"
            stroke="#6c4d2d"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Left delicate leaf */}
          <path
            d="M 49,72 C 43,71 38,76 39,83 C 43,84 48,79 49,76"
            fill="#cfb799"
            stroke="#6c4d2d"
            strokeWidth="0.8"
          />
          {/* Right delicate leaf */}
          <path
            d="M 48,80 C 53,79 58,83 58,89 C 54,91 49,86 48,82"
            fill="#cfb799"
            stroke="#6c4d2d"
            strokeWidth="0.8"
          />

          {/* Embossed Initials 'E' & 'A' */}
          <text
            x="32"
            y="70"
            fontFamily="var(--font-cinzel), serif"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="0.05em"
            fill="#6d4f31"
            textAnchor="middle"
            opacity="0.75"
          >
            {initials.charAt(0) || 'E'}
          </text>
          <text
            x="68"
            y="70"
            fontFamily="var(--font-cinzel), serif"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="0.05em"
            fill="#6d4f31"
            textAnchor="middle"
            opacity="0.75"
          >
            {initials.charAt(1) || 'A'}
          </text>
        </g>
      </svg>
    </button>
  );
};
