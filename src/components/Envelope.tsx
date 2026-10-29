import React, { useState } from 'react';
import { WeddingDetails } from '../types/wedding';
import { WaxSeal } from './WaxSeal';
import { LaceFlap } from './LaceFlap';
import { weddingAudio } from '../utils/audio';
import { ChevronDown, Sparkles } from 'lucide-react';

interface EnvelopeProps {
  wedding: WeddingDetails;
  isOpen: boolean;
  onOpen: () => void;
  guestName?: string;
}

export const Envelope: React.FC<EnvelopeProps> = ({
  wedding,
  isOpen,
  onOpen,
  guestName
}) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    if (isOpen || isOpening) return;
    setIsOpening(true);
    weddingAudio.playWaxSealCrack();

    // Auto-start soft music on user interaction
    if (!weddingAudio.getIsPlaying()) {
      weddingAudio.startMusic();
    }

    setTimeout(() => {
      onOpen();
      setIsOpening(false);
    }, 600);
  };

  return (
    <div className="relative w-full max-w-md mx-auto transition-all duration-700 select-none">
      {/* Outer Envelope Wrapper */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-700 ${
          isOpen ? 'bg-transparent' : 'bg-[#430c17] min-h-[580px] sm:min-h-[620px]'
        }`}
        style={{
          perspective: '1200px',
        }}
      >
        {/* CLOSED ENVELOPE STATE (Screenshots 0s, 2s) */}
        {!isOpen && (
          <div className="relative flex flex-col justify-between items-center min-h-[580px] sm:min-h-[620px] p-6 text-center bg-gradient-to-b from-[#4d0f1b] via-[#3a0812] to-[#2a050d]">
            {/* Subtle vintage texture overlay */}
            <div className="absolute inset-0 bg-satin-texture pointer-events-none opacity-40" />

            {/* Top Flap Section */}
            <div className="relative z-10 pt-10 sm:pt-14 w-full">
              {/* Personalized guest greeting tag if guestName query or prop is present */}
              {guestName && (
                <div className="mb-4">
                  <span className="font-serif italic text-xs tracking-widest text-[#d9a89c] block">
                    Specially for
                  </span>
                  <span className="font-serif text-sm tracking-wider text-[#faede5] font-semibold">
                    {guestName}
                  </span>
                </div>
              )}

              {/* "A LOVE LETTER FROM" */}
              <p className="font-cinzel text-[11px] sm:text-xs tracking-[0.35em] text-[#d49e91] uppercase font-medium">
                {wedding.introHeading || 'A Love Letter From'}
              </p>

              {/* Couple's Names: EMMA & ANDRE */}
              <div className="mt-5 mb-8">
                <h1 className="font-serif text-3xl sm:text-4xl text-[#fbede4] tracking-[0.25em] uppercase font-light">
                  {wedding.brideName}
                </h1>
                
                {/* Romantic cursive '&' or monogram loop */}
                <div className="relative flex items-center justify-center -my-3 sm:-my-4">
                  <span className="font-script text-4xl sm:text-5xl text-[#e2b0a3] transform -rotate-6">
                    &amp;
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl text-[#fbede4] tracking-[0.25em] uppercase font-light">
                  {wedding.groomName}
                </h2>
              </div>
            </div>

            {/* The V-Flap Triangle Contour with Lace Trim */}
            <div className="relative z-20 w-full flex flex-col items-center my-auto">
              {/* Lace trim along the flap edge */}
              <LaceFlap className="mb-1" />

              {/* Wax Seal positioned in the center */}
              <div className="relative -mt-6 sm:-mt-8 transform hover:scale-105 transition-transform duration-300">
                <WaxSeal
                  initials={wedding.coupleInitials}
                  size="md"
                  onClick={handleOpen}
                  isBroken={isOpening}
                />
              </div>
            </div>

            {/* Bottom Call To Action: "OPEN THE INVITATION" */}
            <div className="relative z-10 pb-8 pt-4">
              <button
                type="button"
                onClick={handleOpen}
                className="group inline-flex flex-col items-center justify-center text-[#dfb5aa] hover:text-white transition-colors cursor-pointer focus:outline-none"
              >
                <span className="font-cinzel text-[10px] sm:text-[11px] tracking-[0.3em] uppercase font-semibold group-hover:tracking-[0.35em] transition-all">
                  Open The Invitation
                </span>
                <ChevronDown className="w-4 h-4 mt-2 text-[#d49e91] group-hover:text-white group-hover:translate-y-1 transition-transform animate-bounce" />
              </button>
            </div>

            {/* Envelope V-pocket folds background accents */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#200409] to-transparent pointer-events-none" />
          </div>
        )}

        {/* OPEN ENVELOPE TOP LINING (When opened, shown as the envelope back pocket flap) */}
        {isOpen && (
          <div className="relative w-full text-center py-2 pointer-events-none">
            {/* The envelope top flap flipped open */}
            <div className="w-full bg-[#350711] py-4 rounded-t-2xl border-t border-[#651726] shadow-inner flex flex-col items-center">
              <LaceFlap className="opacity-40 -mt-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
