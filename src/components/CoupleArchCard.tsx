import React from 'react';
import { WeddingDetails } from '../types/wedding';

interface CoupleArchCardProps {
  wedding: WeddingDetails;
}

export const CoupleArchCard: React.FC<CoupleArchCardProps> = ({ wedding }) => {
  return (
    <div className="relative w-full overflow-hidden rounded-t-2xl bg-[#faf6f0] shadow-md border border-[#e8ded3]">
      <div className="flex flex-col sm:flex-row items-stretch">
        
        {/* Left Side: Couple Photograph with Graceful Swan (matching reference image) */}
        <div className="relative w-full sm:w-[52%] min-h-[280px] sm:min-h-[340px] md:min-h-[380px] overflow-hidden bg-[#ded3c5]">
          {/* Couple photo - Bride in white veil & gown, groom in tuxedo */}
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
            alt={`${wedding.brideName} and ${wedding.groomName}`}
            className="w-full h-full object-cover filter contrast-[1.02] grayscale-[20%] sepia-[15%]"
            referrerPolicy="no-referrer"
          />

          {/* Soft gradient edge between photo and paper */}
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#faf6f0] pointer-events-none hidden sm:block" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#faf6f0] to-transparent pointer-events-none sm:hidden" />

          {/* Graceful Classical White Swan (Realistic fine-art silhouette & feathers) */}
          <div className="absolute -left-2 bottom-2 sm:bottom-4 w-32 sm:w-40 md:w-44 pointer-events-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
            <svg viewBox="0 0 160 200" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="swanBody" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="45%" stopColor="#fcf6ec" />
                  <stop offset="80%" stopColor="#ece0cf" />
                  <stop offset="100%" stopColor="#dac7b2" />
                </linearGradient>
                <linearGradient id="swanShading" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#faf3e6" />
                  <stop offset="100%" stopColor="#caa98b" />
                </linearGradient>
              </defs>

              {/* Acanthus leaf crown & filigree at top of swan */}
              <g stroke="#b59c83" strokeWidth="1" fill="#fffaf2">
                <path d="M 85,35 C 98,18 122,24 116,42 C 108,56 94,52 85,45 Z" />
                <path d="M 78,28 C 88,10 110,14 104,30 C 98,40 86,38 78,32 Z" />
                <path d="M 94,48 C 112,42 128,52 122,66 C 114,76 100,72 94,62 Z" />
              </g>

              {/* Classical Swan: Slender graceful arched S-neck */}
              <path
                d="M 90,52
                   C 92,26 68,20 54,34
                   C 42,46 48,60 58,66
                   C 74,75 82,95 74,120
                   C 66,145 40,160 26,184
                   C 45,188 78,166 88,142
                   C 98,122 98,90 90,52 Z"
                fill="url(#swanBody)"
                stroke="#a68c74"
                strokeWidth="1.2"
              />

              {/* Swan head, delicate dark eye and orange/sepia beak */}
              <path d="M 52,36 L 40,39 L 49,43 Z" fill="#84593c" />
              <path d="M 52,36 L 47,38 L 49,43 Z" fill="#2d150f" />
              <circle cx="54" cy="34" r="2" fill="#240f09" />
              <circle cx="54.6" cy="33.4" r="0.6" fill="#ffffff" />
              <path d="M 51,35 Q 54,31 58,33" stroke="#4a2419" strokeWidth="0.8" fill="none" />

              {/* Layered wing feathers wrapping along the lower photo */}
              <path
                d="M 60,105
                   C 36,96 18,116 16,140
                   C 14,162 34,186 58,196
                   C 84,206 118,190 128,166
                   C 112,168 92,164 84,148
                   C 72,128 82,112 60,105 Z"
                fill="url(#swanShading)"
                stroke="#a68c74"
                strokeWidth="1.2"
              />

              {/* Feather details inside wing */}
              <g stroke="#ba9e84" strokeWidth="0.9" fill="#fffbf5">
                <path d="M 32,138 C 46,130 65,135 70,150 C 54,155 38,150 32,138 Z" />
                <path d="M 38,158 C 54,150 75,158 80,172 C 62,178 44,172 38,158 Z" />
                <path d="M 48,175 C 64,170 88,176 94,188 C 76,194 56,188 48,175 Z" />
              </g>

              {/* Lower acanthus floral scroll curl */}
              <path
                d="M 46,180 C 32,192 22,208 34,216 C 52,220 68,206 60,192"
                fill="url(#swanBody)"
                stroke="#a68c74"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>

        {/* Right Side: Deckle Edge "SAVE THE DATE" & Couple Names (matching reference image) */}
        <div className="w-full sm:w-[48%] p-6 sm:p-8 md:p-10 flex flex-col justify-between text-center relative bg-[#faf6f0]">
          {/* Deckle/torn paper edge accent at top right */}
          <div className="absolute top-0 right-0 w-24 h-12 overflow-hidden pointer-events-none opacity-40">
            <svg viewBox="0 0 120 50" preserveAspectRatio="none" className="w-full h-full text-[#d8caba]" fill="currentColor">
              <path d="M 0,0 Q 25,18 50,4 Q 75,22 100,6 Q 110,25 120,0 L 120,50 L 0,50 Z" />
            </svg>
          </div>

          {/* "SAVE THE DATE" Header */}
          <div className="pt-2 sm:pt-4">
            <span className="font-cinzel text-xs sm:text-sm tracking-[0.35em] text-[#845f47] uppercase font-semibold block">
              Save The Date
            </span>
          </div>

          {/* Couple Names */}
          <div className="my-4 sm:my-6">
            <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#46111b] tracking-[0.2em] uppercase font-light">
              {wedding.brideName}
            </h3>
            <div className="relative flex items-center justify-center -my-3 sm:-my-4">
              <span className="font-script text-4xl sm:text-5xl md:text-6xl text-[#9c5a66] transform -rotate-6">
                &amp;
              </span>
            </div>
            <h4 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#46111b] tracking-[0.2em] uppercase font-light">
              {wedding.groomName}
            </h4>
          </div>

          {/* Fan/Seashell fluting & Date: 07 · 17 · 2027 (matching image_3e4f3f3c.png) */}
          <div className="pb-3 sm:pb-5">
            {/* Two Symmetrical Shell / Fan fluted rosettes flanking the date */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 opacity-90">
              {/* Left Fan Shell */}
              <svg viewBox="0 0 50 30" className="w-8 sm:w-10 h-5 sm:h-6 text-[#c49f84]" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M 45,28 C 30,28 15,20 5,5" />
                <path d="M 45,28 C 35,22 25,14 15,4" />
                <path d="M 45,28 C 40,18 35,10 26,3" />
                <path d="M 45,28 C 42,16 40,9 38,2" />
                <path d="M 45,28 L 45,2" />
              </svg>

              <span className="font-sans text-xs sm:text-sm tracking-[0.28em] text-[#7d5341] font-semibold uppercase">
                07 &middot; 17 &middot; 2027
              </span>

              {/* Right Fan Shell */}
              <svg viewBox="0 0 50 30" className="w-8 sm:w-10 h-5 sm:h-6 text-[#c49f84] transform -scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M 45,28 C 30,28 15,20 5,5" />
                <path d="M 45,28 C 35,22 25,14 15,4" />
                <path d="M 45,28 C 40,18 35,10 26,3" />
                <path d="M 45,28 C 42,16 40,9 38,2" />
                <path d="M 45,28 L 45,2" />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
