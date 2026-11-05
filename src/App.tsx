import React, { useState, useEffect } from 'react';
import { WeddingDetails, RSVPResponse } from './types/wedding';
import { AnimatedEnvelopeExperience } from './components/AnimatedEnvelopeExperience';
import { CustomizerDrawer } from './components/CustomizerDrawer';
import { RSVPAdminModal } from './components/RSVPAdminModal';
import { weddingAudio } from './utils/audio';
import { clearCustomAudioFile } from './utils/audioStorage';
import { 
  Volume2, 
  VolumeX, 
  Sliders, 
  Users, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { syncWithSupabase } from './utils/guestList';
import { fetchWeddingDetailsFromSupabase, saveWeddingDetailsToSupabase } from './services/supabaseWeddingService';
import { syncLoveNotesFromSupabase } from './utils/loveNotes';

const DEFAULT_WEDDING: WeddingDetails = {
  brideName: 'Kath',
  groomName: 'Raynold',
  coupleInitials: 'EA',
  tagline: 'Formal invitation to follow',
  introHeading: 'A LOVE LETTER FROM',
  subHeading: 'The moment has arrived...',
  weddingDate: '2027-07-17',
  dateFormatted: 'Saturday, 17 July 2027',
  monthYear: 'JULY 2027',
  dayNumber: 17,
  locationCity: 'New York City',
  venueName: 'The Plaza & Central Park Conservatory',
  venueAddress: '768 5th Ave, New York, NY 10019',
  ceremonyTime: 'Ceremony begins promptly at 4:00 PM',
  rsvpDeadline: 'January 2027',
  contactEmail: 'wedding@emmaandre.com',
  primaryColor: '#480e19',
  envelopeBg: '#380913',
  envelopePhotoUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
  couplePhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  musicUrl: '',
  musicTitle: 'Dreamy Harp & Celesta (Built-in)',
  musicType: 'builtin',
  musicVolume: 0.7,
  scheduleTitle: 'Schedule of the Day',
  schedule: [
    {
      time: '4:00 PM',
      title: 'The Wedding Ceremony',
      description: 'Grand Ballroom · Exchange of vows & unity celebration',
    },
    {
      time: '5:30 PM',
      title: 'Cocktail Hour & Canapés',
      description: 'Terrace · Signature drinks, champagne & live string quartet',
    },
    {
      time: '7:00 PM',
      title: 'Dinner & Dancing',
      description: 'Celebration banquet, heartfelt toasts, wedding cake cutting & party',
    },
  ],
};

// Helper to check if current URL points to /admin or admin query params
const checkIsAdminUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  return (
    path === '/admin' ||
    path.endsWith('/admin') ||
    hash === '#admin' ||
    hash === '#/admin' ||
    search.get('admin') === 'true' ||
    search.get('admin') === '1' ||
    search.get('mode') === 'admin'
  );
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
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => checkIsAdminUrl());
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => checkIsAdminUrl());
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

    // Auto-sync guest list, wedding settings, and love notes with Supabase cloud
    syncWithSupabase().catch(() => {});
    syncLoveNotesFromSupabase().catch(() => {});

    fetchWeddingDetailsFromSupabase()
      .then((remoteDetails) => {
        if (remoteDetails) {
          setWedding(remoteDetails);
          try {
            localStorage.setItem('wedding_invitation_config', JSON.stringify(remoteDetails));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn('Could not pull wedding details from Supabase:', err);
      });

    // Listen to browser URL changes (/admin route detection)
    const handleRouteCheck = () => {
      const isNowAdmin = checkIsAdminUrl();
      setIsAdminRoute(isNowAdmin);
      if (isNowAdmin) {
        setIsAdminOpen(true);
      }
    };

    handleRouteCheck();
    window.addEventListener('popstate', handleRouteCheck);
    window.addEventListener('hashchange', handleRouteCheck);

    return () => {
      window.removeEventListener('popstate', handleRouteCheck);
      window.removeEventListener('hashchange', handleRouteCheck);
    };
  }, []);

  // Sync audio player configuration with current wedding music settings
  useEffect(() => {
    weddingAudio.configure({
      musicUrl: wedding.musicUrl,
      musicType: wedding.musicType,
      musicTitle: wedding.musicTitle,
      musicVolume: wedding.musicVolume ?? 0.7,
    });
  }, [wedding.musicUrl, wedding.musicType, wedding.musicTitle, wedding.musicVolume]);

  const handleWeddingUpdate = (updated: WeddingDetails) => {
    setWedding(updated);
    try {
      localStorage.setItem('wedding_invitation_config', JSON.stringify(updated));
    } catch {}
    // Push instantly to Supabase so phone, laptops, and guests see updates
    saveWeddingDetailsToSupabase(updated).catch((err) => {
      console.warn('Could not sync wedding details to Supabase:', err);
    });
  };

  const handleResetDefaults = () => {
    setWedding(DEFAULT_WEDDING);
    localStorage.removeItem('wedding_invitation_config');
    clearCustomAudioFile().catch(() => {});
    saveWeddingDetailsToSupabase(DEFAULT_WEDDING).catch(() => {});
  };

  const handleToggleSound = () => {
    const active = weddingAudio.toggleMusic((playing) => setIsPlayingMusic(playing));
    setIsPlayingMusic(active);
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    // If user visited via /admin or query param, reset URL cleanly to '/'
    if (checkIsAdminUrl()) {
      window.history.pushState(null, '', '/');
      setIsAdminRoute(false);
    }
  };

  const handleExitAdminMode = () => {
    setIsAdminOpen(false);
    setIsAdminRoute(false);
    window.history.pushState(null, '', '/');
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
      {/* Discreet top indicator only visible if user navigated to /admin */}
      {isAdminRoute && (
        <div className="w-full bg-[#2a050d] text-[#faede5] border-b border-[#631826] px-4 py-2 flex items-center justify-between text-xs z-40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-[#caa298]">
              Admin URL Active: <strong className="text-white">/admin</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-xs text-[#faede5] hover:text-white underline cursor-pointer"
            >
              Open Guest Admin
            </button>
            <span className="text-[#641b2a]">&middot;</span>
            <button
              onClick={handleExitAdminMode}
              className="text-xs text-[#caa298] hover:text-white underline cursor-pointer"
            >
              Exit to Guest View (/)
            </button>
          </div>
        </div>
      )}

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

      {/* Floating Audio & Utility Controls (Pure romantic controls for guests, admin buttons hidden) */}
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

        {/* ADMIN ONLY CONTROLS - ONLY VISIBLE WHEN USER VISITED /admin */}
        {isAdminRoute && (
          <>
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

            <button
              onClick={() => setIsCustomizerOpen(true)}
              title="Customize Couple Names & Wedding Details"
              className="p-2 rounded-full bg-[#3d0b16]/90 hover:bg-[#50111e] backdrop-blur-md text-[#fbf0ea] border border-[#6b1e2e] shadow-xl transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Pure, Elegant Footer (No admin links or buttons visible to wedding guests) */}
      <footer className="w-full py-8 text-center text-xs text-[#a88279] mt-auto">
        <p className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-[#8a5d51]">
          Forever &middot; {wedding.monthYear || 'July 2027'}
        </p>
        <p className="font-serif italic text-xs text-[#734e45] mt-1">
          With all our love, {wedding.brideName} &amp; {wedding.groomName}
        </p>
      </footer>

      {/* Slide-out Customizer Drawer (Accessible from /admin) */}
      <CustomizerDrawer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        wedding={wedding}
        onChange={handleWeddingUpdate}
        guestName={guestName}
        onGuestNameChange={setGuestName}
        onReset={handleResetDefaults}
      />

      {/* Admin RSVP Modal (Opens when navigating to /admin) */}
      <RSVPAdminModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        wedding={wedding}
        onWeddingUpdate={handleWeddingUpdate}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
}
