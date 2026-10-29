import React, { useState, useEffect } from 'react';
import { WeddingDetails, RSVPResponse } from './types/wedding';
import { AnimatedEnvelopeExperience } from './components/AnimatedEnvelopeExperience';
import { CustomizerDrawer } from './components/CustomizerDrawer';
import { RSVPAdminModal } from './components/RSVPAdminModal';
import { weddingAudio } from './utils/audio';
import { 
  Volume2, 
  VolumeX, 
  Sliders, 
  Users, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { syncWithSupabase } from './utils/guestList';

const DEFAULT_WEDDING: WeddingDetails = {
  brideName: 'Emma',
  groomName: 'Andre',
  coupleInitials: 'EA',
  tagline: 'Formal invitation to follow',
  introHeading: 'A LOVE LETTER FROM',
  weddingDate: '2027-07-17',
  dateFormatted: 'Saturday, 17 July 2027',
  monthYear: 'JULY 2027',
  dayNumber: 17,
  locationCity: 'New York City',
  venueName: 'The Plaza & Central Park Conservatory',
  venueAddress: '768 5th Ave, New York, NY 10019',
  rsvpDeadline: 'January 2027',
  contactEmail: 'wedding@emmaandre.com',
  primaryColor: '#480e19',
  envelopeBg: '#380913',
  couplePhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
};

export default function App() {
  const [wedding, setWedding] = useState<WeddingDetails>(() => {
    try {
      const saved = localStorage.getItem('wedding_invitation_config');
      return saved ? JSON.parse(saved) : DEFAULT_WEDDING;
    } catch {
      return DEFAULT_WEDDING;
    }
  });

  const [guestName, setGuestName] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('to') || params.get('guest') || '';
  });

  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('all_wedding_rsvps');
      if (stored) {
        const list = JSON.parse(stored);
        setRsvpCount(list.length);
      }
    } catch {
      // ignore
    }

    // Auto-sync guest list with Supabase
    syncWithSupabase().catch(() => {});

    // Check if admin is requested via URL query param (?admin=true or ?mode=admin)
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('admin') === '1' || params.get('mode') === 'admin') {
      setIsAdminOpen(true);
    }
  }, []);

  const handleWeddingUpdate = (updated: WeddingDetails) => {
    setWedding(updated);
    try {
      localStorage.setItem('wedding_invitation_config', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleResetDefaults = () => {
    setWedding(DEFAULT_WEDDING);
    localStorage.removeItem('wedding_invitation_config');
  };

  const handleToggleSound = () => {
    const active = weddingAudio.toggleMusic((playing) => setIsPlayingMusic(playing));
    setIsPlayingMusic(active);
  };

  const handleRSVPSubmitted = (newRsvp: RSVPResponse) => {
    try {
      const stored = localStorage.getItem('all_wedding_rsvps');
      if (stored) {
        setRsvpCount(JSON.parse(stored).length);
      } else {
        setRsvpCount(1);
      }
    } catch {
      setRsvpCount((c) => c + 1);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#faf7f2] text-[#2b0810] flex flex-col items-center justify-start relative selection:bg-[#771e2f] selection:text-white">
      {/* NO TOP MENU BAR (As requested: pure invitation only) */}

      {/* Main Full Resolution Invitation Experience */}
      <main className="w-full flex-1 flex flex-col items-center justify-start">
        <AnimatedEnvelopeExperience
          wedding={wedding}
          guestName={guestName}
          onRSVPSubmitted={handleRSVPSubmitted}
          isOpenedExternally={isEnvelopeOpen}
          onOpenStateChange={(opened) => setIsEnvelopeOpen(opened)}
        />
      </main>

      {/* Floating Audio & Utility Controls (Discreetly anchored in the corner, zero header clutter) */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        {/* Soft Romantic Audio Player Floating Pill */}
        <button
          onClick={handleToggleSound}
          aria-label={isPlayingMusic ? 'Mute melody' : 'Play melody'}
          className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-[#3d0b15]/90 hover:bg-[#50111e] backdrop-blur-md text-[#fbf0ea] border border-[#6b1e2e] shadow-xl text-xs font-sans transition-all active:scale-95 cursor-pointer"
        >
          {isPlayingMusic ? (
            <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#baa09a]" />
          )}
          <span className="text-[11px] font-medium tracking-wide">
            {isPlayingMusic ? 'Music On' : 'Play Music'}
          </span>
        </button>

        {/* Re-seal Floating Quick Button (when opened) */}
        {isEnvelopeOpen && (
          <button
            onClick={() => setIsEnvelopeOpen(false)}
            title="Fold back into envelope"
            className="p-2 rounded-full bg-[#3d0b15]/90 hover:bg-[#50111e] backdrop-blur-md text-[#fbf0ea] border border-[#6b1e2e] shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Couple Editor & Wedding Admin Button */}
        <button
          onClick={() => setIsAdminOpen(true)}
          title="Guest Registry & Supabase Cloud Manager"
          className="flex items-center gap-1.5 py-2 px-3 rounded-full bg-[#3d0b16]/95 hover:bg-[#50111e] backdrop-blur-md text-[#fbf0ea] border border-[#782334] shadow-xl text-xs font-sans transition-all active:scale-95 cursor-pointer relative"
        >
          <Users className="w-3.5 h-3.5 text-[#caa48a]" />
          <span className="text-[11px] font-medium tracking-wide">Guest Admin</span>
          {rsvpCount > 0 && (
            <span className="bg-[#852336] text-white text-[9px] px-1.5 rounded-full font-mono">
              {rsvpCount}
            </span>
          )}
        </button>

        {/* Wedding details customization button */}
        <button
          onClick={() => setIsCustomizerOpen(true)}
          title="Customize Couple Names & Wedding Details"
          className="p-2 rounded-full bg-[#3d0b16]/90 hover:bg-[#50111e] backdrop-blur-md text-[#fbf0ea] border border-[#6b1e2e] shadow-xl transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Host Organizer Footer Link */}
      <footer className="w-full py-5 text-center text-xs text-[#a88279] mt-auto">
        <button
          onClick={() => setIsAdminOpen(true)}
          className="hover:text-[#460e19] transition-colors underline decoration-dotted text-[11px] cursor-pointer"
        >
          Organizer Admin Portal (Change Guest Names &amp; Supabase Database)
        </button>
      </footer>

      {/* Slide-out Customizer Drawer */}
      <CustomizerDrawer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        wedding={wedding}
        onChange={handleWeddingUpdate}
        guestName={guestName}
        onGuestNameChange={setGuestName}
        onReset={handleResetDefaults}
      />

      {/* Admin RSVP Modal */}
      <RSVPAdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
