import React, { useState } from 'react';
import { WeddingDetails, RSVPResponse } from '../types/wedding';
import { CoupleArchCard } from './CoupleArchCard';
import { CalendarCard } from './CalendarCard';
import { RSVPCard } from './RSVPCard';
import { CountdownCard } from './CountdownCard';
import { LaceFrame } from './LaceFrame';
import { LaceFlap } from './LaceFlap';
import { WaxSeal } from './WaxSeal';
import { weddingAudio } from '../utils/audio';
import { Volume2, VolumeX, Music, MapPin, Clock, Heart, Send } from 'lucide-react';

interface InvitationCardProps {
  wedding: WeddingDetails;
  guestName?: string;
  onRSVPSubmitted?: (rsvp: RSVPResponse) => void;
  onReclose?: () => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  wedding,
  guestName,
  onRSVPSubmitted,
  onReclose,
}) => {
  const [isPlayingMusic, setIsPlayingMusic] = useState(weddingAudio.getIsPlaying());
  const [wishesList, setWishesList] = useState<Array<{ name: string; message: string; date: string }>>([
    {
      name: 'Charlotte & James',
      message: 'So utterly delighted for you two! Counting down the days until we celebrate in NYC! ❤️',
      date: 'Yesterday'
    },
    {
      name: 'Uncle Robert',
      message: 'A match made in heaven. Can’t wait for the dancing and wonderful reunion!',
      date: '2 days ago'
    }
  ]);
  const [newGuestName, setNewGuestName] = useState('');
  const [newWishMessage, setNewWishMessage] = useState('');
  const [wishSent, setWishSent] = useState(false);

  const toggleSound = () => {
    const active = weddingAudio.toggleMusic((playing) => setIsPlayingMusic(playing));
    setIsPlayingMusic(active);
  };

  const handlePostWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim() || !newWishMessage.trim()) return;

    setWishesList([
      {
        name: newGuestName.trim(),
        message: newWishMessage.trim(),
        date: 'Just now'
      },
      ...wishesList
    ]);
    setNewGuestName('');
    setNewWishMessage('');
    setWishSent(true);
    setTimeout(() => setWishSent(false), 3000);
  };

  return (
    <div id="invitation-card" className="relative w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto transition-all duration-700 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Main Wedding Stationery Suite Container */}
      <div className="relative w-full text-[#331118]">
        
        {/* Personalized Guest Greeting Note if provided */}
        {guestName && (
          <div className="text-center pb-3 mb-6">
            <span className="font-serif italic text-sm tracking-wider text-[#8b6348]">
              Warmly invited:
            </span>
            <p className="font-serif text-xl sm:text-2xl text-[#460e19] font-semibold tracking-wide mt-0.5">
              {guestName}
            </p>
          </div>
        )}

        {/* Section 1: The Opened Envelope Assembly (faithfully matching image_3e4f3f3c.png) */}
        <section id="letter" className="relative w-full max-w-xl sm:max-w-2xl mx-auto mb-12">
          
          {/* Main Envelope Housing (Velvet Burgundy Backing & Pocket) */}
          <div className="relative w-full rounded-2xl shadow-2xl overflow-visible">
            
            {/* 1. Envelope Back Flap pointing UP with Scalloped Lace Crest */}
            <div className="relative w-full overflow-hidden -mb-1 z-0">
              <div
                className="w-full bg-[#460e19] pt-6 pb-14 px-4 text-center flex flex-col items-center relative shadow-inner"
                style={{
                  clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
                  minHeight: '150px',
                }}
              >
                {/* Scalloped lace crest along the flap apex */}
                <div className="w-full max-w-xs sm:max-w-sm pt-1">
                  <LaceFlap className="opacity-95 text-[#f0ded4]" />
                </div>
              </div>
            </div>

            {/* 2. Envelope Velvet Interior Backing framing the Stationery Card */}
            <div className="relative z-10 w-full bg-gradient-to-b from-[#3a0812] via-[#460e19] to-[#2c050b] p-2 sm:p-3 rounded-2xl shadow-xl">
              {/* The Inner Stationery Card */}
              <div className="w-full shadow-lg rounded-xl overflow-hidden">
                <CoupleArchCard wedding={wedding} />
              </div>

              {/* 3. The Envelope Lower Front Pocket with Centered Ivory Wax Seal */}
              <div className="relative -mt-16 sm:-mt-20 z-20 w-[calc(100%+8px)] -ml-1 sm:w-[calc(100%+16px)] sm:-ml-2">
                <div
                  className="w-full bg-gradient-to-t from-[#25040a] via-[#3d0b15] to-[#4c0f1c] pt-12 pb-8 px-6 text-center rounded-b-2xl shadow-[0_18px_36px_rgba(0,0,0,0.5)] relative"
                  style={{
                    clipPath: 'polygon(0% 0%, 50% 36%, 100% 0%, 100% 100%, 0% 100%)',
                    minHeight: '135px',
                  }}
                >
                  {/* Subtle diagonal envelope crease lines meeting at the notch */}
                  <div className="absolute inset-0 pointer-events-none opacity-30">
                    <svg viewBox="0 0 400 135" preserveAspectRatio="none" className="w-full h-full text-black">
                      <line x1="0" y1="135" x2="200" y2="48" stroke="currentColor" strokeWidth="2.5" />
                      <line x1="400" y1="135" x2="200" y2="48" stroke="currentColor" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>

                {/* Ivory Wax Seal centered on the pocket notch */}
                <div className="absolute top-[18px] sm:top-[20px] left-1/2 transform -translate-x-1/2 z-30">
                  <WaxSeal
                    initials={wedding.coupleInitials}
                    size="md"
                    isBroken={false}
                  />
                </div>
              </div>
            </div>

          </div>
        </section>

          {/* Section 2: "The moment has arrived..." & "We're getting Married" (matching screenshots 4s, 6s) */}
          <div className="text-center my-10 sm:my-14">
            <p className="font-serif italic text-base sm:text-lg text-[#805542] tracking-wide mb-1">
              The moment has arrived...
            </p>

            <h2 className="font-script text-5xl sm:text-6xl md:text-7xl text-[#531320] leading-tight my-3">
              We're getting Married
            </h2>

            {/* Musical Notes flourish symbol (Screenshot 4s) */}
            <div className="flex items-center justify-center my-4 text-[#b54359]">
              <svg viewBox="0 0 32 32" className="w-9 h-9 opacity-80" fill="currentColor">
                <path d="M 12,6 L 26,2 L 26,18 C 24,16 21,16 19,17 C 16,19 15,22 17,25 C 19,27 23,27 25,25 C 26,24 26,23 26,22 L 26,8 L 14,11 L 14,21 C 12,19 9,19 7,20 C 4,22 3,25 5,28 C 7,30 11,30 13,28 C 14,27 14,26 14,25 L 14,6 Z" />
              </svg>
            </div>

            {/* Location & Date Details */}
            <div className="mt-6 space-y-1.5">
              <p className="font-cinzel text-xs sm:text-sm tracking-[0.3em] text-[#805542] uppercase font-semibold">
                Join Us In
              </p>
              <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#3d0e17] font-medium tracking-wide">
                {wedding.locationCity}
              </p>
              <p className="font-serif italic text-base sm:text-lg text-[#744c3b]">
                the {wedding.dateFormatted}
              </p>
            </div>

            {/* Venue & Ceremony time highlight */}
            <div className="mt-6 pt-4 border-t border-[#ebdcd0] max-w-sm mx-auto text-center">
              <p className="font-serif text-base font-semibold text-[#48111c]">
                {wedding.venueName}
              </p>
              <p className="text-xs sm:text-sm text-[#805849] font-sans mt-0.5">
                {wedding.venueAddress}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#934c5b] font-medium mt-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Ceremony begins promptly at 4:00 PM</span>
              </div>
            </div>
          </div>

          {/* Section 3: Burgundy Calendar Card (Screenshot 6s) */}
          <section id="calendar" className="scroll-mt-24">
            <CalendarCard wedding={wedding} />
          </section>

          {/* Section 4: Satin & Lace Divider Transition into RSVP (Screenshot 8s) */}
          <div className="relative py-4 my-4 text-center overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-[#baa09a] to-transparent w-full" />
          </div>

          {/* Section 5: RSVP Card Form with Guest Search & Companion Names */}
          <section id="rsvp" className="scroll-mt-24">
            <RSVPCard
              wedding={wedding}
              guestName={guestName}
              onRSVPSubmitted={onRSVPSubmitted}
            />
          </section>

          {/* Section 6: Real-Time Countdown to Wedding Date (Screenshot 10s) */}
          <section id="countdown">
            <CountdownCard wedding={wedding} />
          </section>

          {/* Section 7: Schedule of Events Accordion / Timeline */}
          <section id="schedule" className="bg-[#f5ece3] rounded-2xl p-6 sm:p-8 border border-[#dfcebf] my-8 scroll-mt-24">
            <h4 className="font-cinzel text-center text-xs sm:text-sm tracking-[0.25em] text-[#581c27] uppercase font-semibold mb-6">
              Schedule of the Day
            </h4>
            <div className="space-y-4 font-serif">
              <div className="flex items-start gap-4 border-b border-[#e8ded3] pb-3">
                <span className="font-sans font-semibold text-xs sm:text-sm text-[#7e2537] w-20 shrink-0 pt-0.5">4:00 PM</span>
                <div>
                  <p className="font-semibold text-base text-[#3a0d16]">The Wedding Ceremony</p>
                  <p className="text-xs sm:text-sm text-[#735142]">Grand Ballroom &middot; Exchange of vows &amp; unity celebration</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-b border-[#e8ded3] pb-3">
                <span className="font-sans font-semibold text-xs sm:text-sm text-[#7e2537] w-20 shrink-0 pt-0.5">5:30 PM</span>
                <div>
                  <p className="font-semibold text-base text-[#3a0d16]">Cocktail Hour &amp; Canapés</p>
                  <p className="text-xs sm:text-sm text-[#735142]">Terrace &middot; Signature drinks, champagne &amp; live string quartet</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="font-sans font-semibold text-xs sm:text-sm text-[#7e2537] w-20 shrink-0 pt-0.5">7:00 PM</span>
                <div>
                  <p className="font-semibold text-base text-[#3a0d16]">Dinner &amp; Dancing</p>
                  <p className="text-xs sm:text-sm text-[#735142]">Celebration banquet, heartfelt toasts, wedding cake cutting &amp; party</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Heartfelt Guestbook / Well Wishes Wall */}
          <section id="wishes" className="bg-[#f7efe7] rounded-2xl p-6 sm:p-8 border border-[#e0cfc1] my-8 scroll-mt-24">
            <div className="text-center mb-4">
              <span className="font-cinzel text-xs sm:text-sm tracking-[0.25em] text-[#581c27] uppercase font-semibold">
                Leave a Love Note
              </span>
              <p className="font-serif italic text-xs sm:text-sm text-[#7b5747] mt-1">
                Send warm wishes to {wedding.brideName} &amp; {wedding.groomName}
              </p>
            </div>

            <form onSubmit={handlePostWish} className="space-y-3 mb-6">
              <input
                type="text"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white border border-[#d9c4b5] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#331118] placeholder-[#9c7d71] outline-none"
              />
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={newWishMessage}
                  onChange={(e) => setNewWishMessage(e.target.value)}
                  placeholder="Write a sweet message..."
                  className="flex-1 bg-white border border-[#d9c4b5] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#331118] placeholder-[#9c7d71] outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#460e19] hover:bg-[#5f1725] text-white px-5 py-2.5 rounded-lg text-xs sm:text-sm font-sans font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Note</span>
                </button>
              </div>
              {wishSent && (
                <p className="text-emerald-700 text-xs font-sans">
                  ✨ Your love note has been added!
                </p>
              )}
            </form>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {wishesList.map((w, idx) => (
                <div key={idx} className="bg-white/85 p-3.5 rounded-xl border border-[#ecdcd0] text-xs sm:text-sm shadow-xs">
                  <div className="flex justify-between items-center text-[#7a4e3f] font-serif font-semibold text-xs sm:text-sm mb-1">
                    <span>{w.name}</span>
                    <span className="text-[11px] text-[#a6867a] font-sans font-normal">{w.date}</span>
                  </div>
                  <p className="font-serif text-[#441d25] italic text-sm">{w.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 9: With Love Monogram Lace Card (Screenshot 10s) */}
          <section id="contact" className="my-10 scroll-mt-24">
            <LaceFrame>
              <p className="font-cinzel text-xs tracking-[0.35em] text-[#784d3d] uppercase font-semibold">
                With Love
              </p>

              {/* Intertwined Monogram Crest */}
              <div className="my-4 flex items-center justify-center">
                <div className="relative w-16 h-16 rounded-full border border-[#d5baa9] flex items-center justify-center bg-[#fdfaf6] shadow-sm">
                  <span className="font-script text-4xl text-[#531522] tracking-wider transform -rotate-3">
                    {wedding.coupleInitials}
                  </span>
                </div>
              </div>

              <p className="font-serif italic text-xs sm:text-sm text-[#6c483a] max-w-xs mx-auto">
                For questions contact the bride and groom via email:
              </p>

              <div className="mt-2">
                <a
                  href={`mailto:${wedding.contactEmail}`}
                  className="font-sans text-xs sm:text-sm tracking-wider text-[#48111c] hover:text-[#7d2033] font-medium underline transition-colors"
                >
                  {wedding.contactEmail}
                </a>
              </div>
            </LaceFrame>
          </section>

          {/* Bottom Elegant Note */}
          <div className="text-center pt-2 pb-4">
            <p className="font-script text-2xl text-[#63202e]">
              {wedding.brideName} &amp; {wedding.groomName}
            </p>
            <p className="font-cinzel text-[9px] tracking-[0.25em] text-[#9c7d71] uppercase mt-1">
              Forever &middot; July 17, 2027
            </p>
          </div>
        </div>
      </div>
  );
};
