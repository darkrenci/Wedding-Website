import React from 'react';

// Scalloped floral lace overlay that trims the triangular envelope flap
export const LaceFlap: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none select-none w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className="w-full h-12 md:h-16 text-[#e8cfc2] opacity-75"
        fill="currentColor"
      >
        <defs>
          <pattern id="laceEyelet" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="3" fill="#2d060c" />
            <circle cx="10" cy="10" r="4.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="5" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="15" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="5" cy="15" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="15" cy="15" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Scalloped edge row along the V-notch */}
        <g stroke="currentColor" strokeWidth="1" fill="none">
          {/* Continuous scallop arcs */}
          <path
            d="M 0,10 
               Q 12,24 25,10 Q 37,24 50,10 Q 62,24 75,10 Q 87,24 100,10 
               Q 112,24 125,10 Q 137,24 150,10 Q 162,24 175,10 Q 187,24 200,10
               Q 212,24 225,10 Q 237,24 250,10 Q 262,24 275,10 Q 287,24 300,10
               Q 312,24 325,10 Q 337,24 350,10 Q 362,24 375,10 Q 387,24 400,10"
            stroke="#dfc5b8"
            strokeWidth="1.5"
          />
          {/* Outer delicate micro-scallops */}
          <path
            d="M 0,16 
               Q 6,24 12,16 Q 18,24 25,16 Q 31,24 37,16 Q 44,24 50,16
               Q 56,24 62,16 Q 69,24 75,16 Q 81,24 87,16 Q 94,24 100,16
               Q 106,24 112,16 Q 119,24 125,16 Q 131,24 137,16 Q 144,24 150,16
               Q 156,24 162,16 Q 169,24 175,16 Q 181,24 187,16 Q 194,24 200,16
               Q 206,24 212,16 Q 219,24 225,16 Q 231,24 237,16 Q 244,24 250,16
               Q 256,24 262,16 Q 269,24 275,16 Q 281,24 287,16 Q 294,24 300,16
               Q 306,24 312,16 Q 319,24 325,16 Q 331,24 337,16 Q 344,24 350,16
               Q 356,24 362,16 Q 369,24 375,16 Q 381,24 387,16 Q 394,24 400,16"
            stroke="#f5e6dc"
            strokeWidth="1"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
};
