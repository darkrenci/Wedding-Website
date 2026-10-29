import React, { useState, useEffect, useRef } from 'react';
import { WeddingDetails, RSVPResponse } from '../types/wedding';
import { WaxSeal } from './WaxSeal';
import { LaceFlap } from './LaceFlap';
import { InvitationCard } from './InvitationCard';
import { weddingAudio } from '../utils/audio';
import { ChevronDown } from 'lucide-react';

interface AnimatedEnvelopeProps {
  wedding: WeddingDetails;
  guestName?: string;
  onRSVPSubmitted?: (rsvp: RSVPResponse) => void;
  isOpenedExternally?: boolean;
  onOpenStateChange?: (opened: boolean) => void;
}

export type AnimationStage = 'closed' | 'breaking' | 'opening_flap' | 'zooming_out' | 'open';

export const AnimatedEnvelopeExperience: React.FC<AnimatedEnvelopeProps> = ({
  wedding,
  guestName,
  onRSVPSubmitted,
  isOpenedExternally,
  onOpenStateChange,
}) => {
  const [stage, setStage] = useState<AnimationStage>('closed');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync if parent toggles open/close
  useEffect(() => {
    if (isOpenedExternally !== undefined) {
      if (isOpenedExternally && stage === 'closed') {
        handleOpen();
      } else if (!isOpenedExternally && stage === 'open') {
        handleReclose();
      }
    }
  }, [isOpenedExternally]);

  const handleOpen = () => {
    if (stage !== 'closed') return;

    // Phase 1: Break seal (Wax seal cracks and lifts)
    setStage('breaking');
    weddingAudio.playWaxSealCrack();

    // Start background romantic music softly
    if (!weddingAudio.getIsPlaying()) {
      weddingAudio.startMusic();
    }

    // Phase 2: Flap rotates open in 3D
    setTimeout(() => {
      setStage('opening_flap');

      // Phase 3: Zoom panel smoothly zooms out while card slides up out of envelope pocket
      setTimeout(() => {
        setStage('zooming_out');

        // Phase 4: Settle completely into full open layout
        setTimeout(() => {
          setStage('open');
          if (onOpenStateChange) onOpenStateChange(true);
        }, 1100);
      }, 750);
    }, 450);
  };

  const handleReclose = () => {
    if (stage === 'closed') return;
    setStage('zooming_out');
    setTimeout(() => {
      setStage('opening_flap');
      setTimeout(() => {
        setStage('closed');
        if (onOpenStateChange) onOpenStateChange(false);
      }, 700);
    }, 700);
  };

  const isFlapOpen = stage === 'opening_flap' || stage === 'zooming_out' || stage === 'open';
  const isFullyOpen = stage === 'open';

  return (
    <div ref={containerRef} className="w-full select-none">
      {/* WHEN CLOSED OR DURING OPENING ZOOM TRANSITION: FULL RESOLUTION ENVELOPE (Desktop & Mobile) */}
      {!isFullyOpen ? (
        <div
          className={`w-full min-h-screen flex flex-col justify-between items-center text-center bg-[#420b15] relative overflow-hidden transition-all duration-1000 ${
            stage === 'zooming_out' ? 'scale-95 opacity-90' : 'scale-100 opacity-100'
          }`}
          style={{
            transformOrigin: 'center center',
            transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Subtle Satin & Paper Fabric Texture spanning the entire desktop/mobile resolution */}
          <div className="absolute inset-0 bg-satin-texture opacity-35 pointer-events-none" />

          {/* BACK LINING of Envelope (visible when flap opens up) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#2e070e] via-[#3a0812] to-[#25050b] flex flex-col justify-between pointer-events-none">
            <div className="w-full h-48 bg-[#2d0710] border-b border-[#4d131f] opacity-80" />
            <div className="w-full h-56 bg-[#1e0409]" />
          </div>

          {/* 3D ROTATING ENVELOPE FLAP - Spans entire width with elegant proportions */}
          <div
            className={`absolute top-0 left-0 right-0 z-30 envelope-flap-origin transition-transform duration-700 preserve-3d ${
              isFlapOpen ? 'flap-open' : 'flap-closed'
            }`}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* FRONT FACE of Flap (Burgundy with "A LOVE LETTER FROM", "EMMA & ANDRE", Wax Seal) */}
            <div
              className={`relative w-full pb-14 pt-12 sm:pt-20 px-6 sm:px-16 text-center bg-gradient-to-b from-[#50111e] via-[#430d18] to-[#340711] shadow-[0_16px_40px_rgba(0,0,0,0.65)] ${
                isFlapOpen ? 'pointer-events-none' : ''
              }`}
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 68%, 50% 100%, 0% 68%)',
                minHeight: '440px',
              }}
            >
              {/* Personalized Guest Greeting */}
              {guestName && (
                <div className="mb-4">
                  <span className="font-serif italic text-xs sm:text-sm text-[#caa298] tracking-widest block">
                    Specially for
                  </span>
                  <span className="font-serif text-base sm:text-lg tracking-wider text-[#faede5] font-semibold">
                    {guestName}
                  </span>
                </div>
              )}

              {/* "A LOVE LETTER FROM" */}
              <p className="font-cinzel text-xs sm:text-sm md:text-base tracking-[0.4em] text-[#d49e91] uppercase font-medium mt-2">
                {wedding.introHeading || 'A Love Letter From'}
              </p>

              {/* Couple's Names: EMMA & ANDRE (Desktop & Mobile scale) */}
              <div className="mt-6 mb-8 max-w-3xl mx-auto">
                <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#fbede4] tracking-[0.25em] uppercase font-light">
                  {wedding.brideName}
                </h1>
                <div className="relative flex items-center justify-center -my-4 sm:-my-6">
                  <span className="font-script text-5xl sm:text-7xl md:text-8xl text-[#e2b0a3] transform -rotate-6">
                    &amp;
                  </span>
                </div>
                <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#fbede4] tracking-[0.25em] uppercase font-light">
                  {wedding.groomName}
                </h2>
              </div>

              {/* Scalloped lace along the V-notch */}
              <div className="absolute inset-x-0 bottom-0 pointer-events-none">
                <LaceFlap className="opacity-95 -mb-1 w-full" />
              </div>
            </div>
          </div>

          {/* THE WAX SEAL - Centered on Flap V-Tip */}
          <div
            className={`absolute z-40 left-1/2 transform -translate-x-1/2 transition-all duration-500 cursor-pointer ${
              stage === 'closed'
                ? 'top-[360px] sm:top-[385px] scale-110 sm:scale-125 opacity-100 hover:scale-130'
                : stage === 'breaking'
                ? 'top-[350px] sm:top-[375px] scale-135 opacity-90 animate-pulse'
                : 'top-[320px] scale-150 opacity-0 pointer-events-none'
            }`}
          >
            <WaxSeal
              initials={wedding.coupleInitials}
              size="lg"
              onClick={handleOpen}
              isBroken={stage !== 'closed'}
            />
          </div>

          {/* INNER STATIONERY CARD (Sliding Up During Animation) */}
          <div
            className={`absolute left-6 right-6 sm:left-1/4 sm:right-1/4 z-20 rounded-2xl bg-[#faf6f0] p-6 sm:p-8 shadow-2xl border border-[#e8ded3] transition-all duration-1000 ease-out ${
              stage === 'closed'
                ? 'top-[260px] scale-95 opacity-0 pointer-events-none'
                : stage === 'breaking'
                ? 'top-[240px] scale-95 opacity-20'
                : stage === 'opening_flap'
                ? 'top-[180px] scale-98 opacity-80'
                : 'top-[60px] scale-100 opacity-100' // sliding out as zoom begins
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Sneak peek of the Arch photo, Swan, and Save the Date inside */}
            <div className="flex flex-col items-center text-center">
              <div className="w-56 h-64 sm:w-64 sm:h-72 rounded-t-full overflow-hidden border-2 border-[#d9c4b2] shadow-md bg-[#e8ded1] my-2">
                <img
                  src={wedding.couplePhotoUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"}
                  alt="Couple"
                  className="w-full h-full object-cover filter sepia-[0.25]"
                />
              </div>
              <p className="font-serif italic text-sm text-[#805542] mt-3">
                The moment has arrived...
              </p>
              <h3 className="font-script text-4xl sm:text-5xl text-[#531320]">
                We're getting Married
              </h3>
            </div>
          </div>

          {/* FRONT LOWER POCKET OF ENVELOPE (Spans Full Resolution) */}
          <div
            className="absolute bottom-0 left-0 right-0 z-25 bg-gradient-to-t from-[#26050b] via-[#3a0b15] to-[#4c0f1c] pt-20 pb-14 px-6 text-center border-t border-[#611a28]/50 shadow-[0_-12px_30px_rgba(0,0,0,0.6)]"
            style={{
              clipPath: 'polygon(0% 28%, 50% 0%, 100% 28%, 100% 100%, 0% 100%)',
              minHeight: '360px',
            }}
          >
            {/* Bottom prompt: "OPEN THE INVITATION" */}
            <div className="mt-20 sm:mt-24 flex flex-col items-center">
              <button
                type="button"
                onClick={handleOpen}
                disabled={stage !== 'closed'}
                className="group inline-flex flex-col items-center justify-center text-[#dfb5aa] hover:text-white transition-all cursor-pointer focus:outline-none disabled:opacity-50"
              >
                <span className="font-cinzel text-xs sm:text-sm md:text-base tracking-[0.4em] uppercase font-semibold group-hover:tracking-[0.45em] transition-all">
                  {stage === 'closed' ? 'Open The Invitation' : 'Opening & Revealing...'}
                </span>
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 mt-3 text-[#d49e91] group-hover:text-white transition-transform animate-bounce" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* FULLY OPENED INVITATION STAGE (Desktop & Mobile Friendly, Full Canvas) */
        <div className="w-full min-h-screen bg-[#faf7f2] animate-in fade-in zoom-in-95 duration-1000 py-6 sm:py-12 px-4 sm:px-8">
          <div className="w-full max-w-4xl lg:max-w-5xl mx-auto">
            <InvitationCard
              wedding={wedding}
              guestName={guestName}
              onRSVPSubmitted={onRSVPSubmitted}
              onReclose={handleReclose}
            />
          </div>
        </div>
      )}
    </div>
  );
};
