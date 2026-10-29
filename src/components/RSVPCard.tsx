import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { WeddingDetails, RSVPResponse, InvitedGuest } from '../types/wedding';
import { GuestSearch } from './GuestSearch';
import { findGuestByName, updateGuestRSVP } from '../utils/guestList';
import { CheckCircle2, Edit3, Users, UserPlus, Check, Sparkles, Mail, Lock } from 'lucide-react';

interface RSVPCardProps {
  wedding: WeddingDetails;
  guestName?: string;
  onRSVPSubmitted?: (rsvp: RSVPResponse) => void;
}

export const RSVPCard: React.FC<RSVPCardProps> = ({
  wedding,
  guestName,
  onRSVPSubmitted,
}) => {
  const rsvpFormRef = useRef<HTMLDivElement>(null);
  const [selectedGuest, setSelectedGuest] = useState<InvitedGuest | null>(() => {
    if (guestName) {
      return findGuestByName(guestName) || null;
    }
    return null;
  });

  const [name, setName] = useState(guestName || '');
  const [attendance, setAttendance] = useState<'accepted' | 'declined'>('accepted');

  const maxInvitations = selectedGuest ? selectedGuest.allocatedInvitations : 4;
  const maxCompanions = Math.max(0, maxInvitations - 1);

  const [companionNames, setCompanionNames] = useState<string[]>(() => {
    const count = selectedGuest ? Math.max(0, selectedGuest.allocatedInvitations - 1) : 3;
    return new Array(count).fill('');
  });

  const [email, setEmail] = useState('');
  const [dietary, setDietary] = useState('');
  const [wishes, setWishes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRSVP, setSubmittedRSVP] = useState<RSVPResponse | null>(() => {
    try {
      const saved = localStorage.getItem('user_wedding_rsvp');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep name strictly synchronized with selectedGuest
  useEffect(() => {
    if (selectedGuest) {
      setName(selectedGuest.name);
    }
  }, [selectedGuest]);

  // Adjust companion slots when selectedGuest changes
  useEffect(() => {
    const targetLen = selectedGuest ? Math.max(0, selectedGuest.allocatedInvitations - 1) : 3;
    setCompanionNames((prev) => {
      if (prev.length === targetLen) return prev;
      const next = new Array(targetLen).fill('');
      for (let i = 0; i < Math.min(prev.length, targetLen); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  }, [selectedGuest]);

  // Handle external guestName prop updates
  useEffect(() => {
    if (guestName) {
      const match = findGuestByName(guestName);
      if (match) {
        handleSelectGuest(match);
      } else {
        setName(guestName);
      }
    }
  }, [guestName]);

  // When selected guest changes from the search component
  const handleSelectGuest = (guest: InvitedGuest | null) => {
    setSelectedGuest(guest);
    if (guest) {
      setName(guest.name);
      const companionsNeeded = Math.max(0, guest.allocatedInvitations - 1);
      setCompanionNames(new Array(companionsNeeded).fill(''));
      setTimeout(() => {
        rsvpFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    } else {
      setName('');
      setCompanionNames(new Array(3).fill(''));
    }
  };

  const handleCompanionNameChange = (index: number, val: string) => {
    setCompanionNames((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Active accompanying guests (non-blank entries)
  const activeCompanions = companionNames.map((c) => c.trim()).filter((c) => c.length > 0);
  // Total attendees = 1 (primary guest) + number of filled accompanying guest names
  const calculatedAttendees = attendance === 'declined' ? 0 : 1 + activeCompanions.length;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#e8cfc2', '#d4af37', '#b53b53', '#ffffff', '#faede5'],
        shapes: ['circle', 'square'],
      });
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const primaryGuestName = selectedGuest ? selectedGuest.name : name.trim();

    if (!primaryGuestName) {
      setErrorMsg('Please select or enter your name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Non-blank companion names count as accompanying guests; blank slots mean no accompany
    const cleanedCompanions =
      attendance === 'accepted'
        ? companionNames.map((c) => c.trim()).filter((c) => c.length > 0)
        : [];

    const totalPartyCount = attendance === 'declined' ? 0 : 1 + cleanedCompanions.length;

    setIsSubmitting(true);

    const newRSVP: RSVPResponse = {
      id: Date.now().toString(),
      guestName: primaryGuestName,
      attending: attendance,
      guestCount: totalPartyCount,
      companionNames: cleanedCompanions,
      allocatedInvitations: selectedGuest ? selectedGuest.allocatedInvitations : totalPartyCount,
      email: email.trim(),
      dietary: dietary.trim() || undefined,
      wishes: wishes.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      try {
        localStorage.setItem('user_wedding_rsvp', JSON.stringify(newRSVP));
        const existingAll: RSVPResponse[] = JSON.parse(
          localStorage.getItem('all_wedding_rsvps') || '[]'
        );
        const updatedAll = [
          newRSVP,
          ...existingAll.filter(
            (r) => r.email.toLowerCase() !== newRSVP.email.toLowerCase() &&
                   r.guestName.toLowerCase() !== newRSVP.guestName.toLowerCase()
          ),
        ];
        localStorage.setItem('all_wedding_rsvps', JSON.stringify(updatedAll));

        // Update master guest list
        updateGuestRSVP(primaryGuestName, newRSVP);
      } catch {
        // storage quota
      }

      setSubmittedRSVP(newRSVP);
      setIsEditing(false);
      setIsSubmitting(false);

      if (attendance === 'accepted') {
        triggerCelebration();
      }

      if (onRSVPSubmitted) {
        onRSVPSubmitted(newRSVP);
      }
    }, 450);
  };

  // If already submitted and not in editing mode, show the full confirmation breakdown
  if (submittedRSVP && !isEditing) {
    return (
      <div className="w-full my-8">
        <div className="text-center mb-4">
          <p className="font-cinzel text-xs tracking-[0.25em] text-[#d9a89c] uppercase">
            We'd love to know if you can join us
          </p>
          <p className="font-sans text-[10px] tracking-widest text-[#caa298] uppercase mt-1">
            Please reply by {wedding.rsvpDeadline}
          </p>
        </div>

        <div className="bg-[#460e19] text-[#f7eade] p-6 sm:p-9 rounded-2xl border-2 border-[#caa48a] shadow-2xl text-center max-w-xl sm:max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-[#fceddf] text-[#4a0d18] flex items-center justify-center mx-auto mb-3.5 shadow-md">
            <CheckCircle2 className="w-8 h-8 text-[#4a0d18]" />
          </div>

          <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-[#e8cfc2] font-semibold block">
            RSVP Confirmed
          </span>

          <h3 className="font-serif text-3xl font-normal text-white my-1">
            {submittedRSVP.attending === 'accepted' ? 'We Can’t Wait to Celebrate!' : 'Response Received'}
          </h3>

          <p className="font-serif italic text-base text-[#e8cfc2] mb-5">
            Thank you, {submittedRSVP.guestName}.
          </p>

          <div className="bg-[#340711]/90 rounded-xl p-5 border border-[#5d1927] text-left text-xs space-y-3 mb-6 shadow-inner">
            <div className="flex justify-between items-center border-b border-[#4d1622] pb-2">
              <span className="text-[#caa298] font-sans">Primary Guest:</span>
              <span className="font-serif text-base font-bold text-white">
                {submittedRSVP.guestName}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-[#4d1622] pb-2">
              <span className="text-[#caa298] font-sans">Attendance Status:</span>
              <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                submittedRSVP.attending === 'accepted'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {submittedRSVP.attending === 'accepted' ? 'Joyfully Attending' : 'Regretfully Declining'}
              </span>
            </div>

            {submittedRSVP.attending === 'accepted' && (
              <>
                <div className="flex justify-between items-center border-b border-[#4d1622] pb-2">
                  <span className="text-[#caa298] font-sans">Total Attendees Reserved:</span>
                  <span className="font-serif text-base font-bold text-[#fce8de]">
                    {submittedRSVP.guestCount} {submittedRSVP.guestCount === 1 ? 'Attendee' : 'Attendees'}
                  </span>
                </div>

                {submittedRSVP.companionNames && submittedRSVP.companionNames.length > 0 && (
                  <div className="border-b border-[#4d1622] pb-2">
                    <span className="text-[#caa298] font-sans block mb-1.5">
                      Accompanying Guests ({submittedRSVP.companionNames.length}):
                    </span>
                    <ul className="space-y-1 pl-2">
                      {submittedRSVP.companionNames.map((cName, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-white font-serif text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#caa48a]" />
                          <span>Guest #{idx + 2}: <strong>{cName}</strong></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[#caa298] font-sans">Confirmation Email:</span>
              <span className="font-medium text-white truncate max-w-[200px]">{submittedRSVP.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const prevName = submittedRSVP.guestName;
              setName(prevName);
              const found = findGuestByName(prevName);
              if (found) {
                setSelectedGuest(found);
              }
              const allocated = found ? found.allocatedInvitations : (submittedRSVP.allocatedInvitations || 4);
              const compsNeeded = Math.max(0, allocated - 1);
              const prevComps = submittedRSVP.companionNames || [];
              const padded = new Array(compsNeeded).fill('').map((_, i) => prevComps[i] || '');

              setAttendance(submittedRSVP.attending);
              setEmail(submittedRSVP.email);
              setCompanionNames(padded);
              if (submittedRSVP.dietary) setDietary(submittedRSVP.dietary);
              if (submittedRSVP.wishes) setWishes(submittedRSVP.wishes);
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-[#deb6ab] hover:text-white transition-colors underline cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit your RSVP details or guest names
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full my-8 space-y-6">
      {/* 1. GUEST SEARCH LOOKUP PANEL */}
      <GuestSearch
        selectedGuest={selectedGuest}
        onSelectGuest={handleSelectGuest}
        className="max-w-xl sm:max-w-2xl mx-auto"
      />

      {/* 2. MAIN RSVP FORM - ONLY APPEARS IF THEY ALREADY SEARCH THEIR NAME AND IT IS ON THE LIST */}
      {selectedGuest ? (
        <div ref={rsvpFormRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="text-center mb-2">
            <h4 className="font-cinzel text-xs sm:text-sm tracking-[0.22em] text-[#d9a89c] uppercase font-semibold">
              We'd love to know if you can join us
            </h4>
            <p className="font-sans text-[10px] sm:text-xs tracking-[0.2em] text-[#caa298] uppercase mt-1">
              Please reply by {wedding.rsvpDeadline}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl sm:max-w-2xl mx-auto bg-[#460e19] text-[#f7eade] p-6 sm:p-9 rounded-2xl border border-[#6d1d2e] shadow-2xl space-y-5"
          >
            {/* Name Field with Verification Lock (Primary guest cannot change name) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <label className="font-serif italic text-xs sm:text-sm text-[#f0ded4] flex items-center gap-2">
                  <span>Primary Guest Name</span>
                  <span className="text-[#fca5a5]">*</span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#27050d] text-[#e8cfc2] border border-[#6b1f2e] font-sans font-normal tracking-wide">
                    <Lock className="w-2.5 h-2.5 text-[#caa48a]" />
                    Locked &amp; Verified
                  </span>
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#86efac] font-sans font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Linked to {selectedGuest.allocatedInvitations} {selectedGuest.allocatedInvitations === 1 ? 'invitation' : 'invitations'}
                </span>
              </div>

              {/* LOCKED UNEDITABLE PRIMARY GUEST FIELD */}
              <div className="relative">
                <input
                  type="text"
                  required
                  readOnly
                  tabIndex={-1}
                  value={selectedGuest.name}
                  aria-readonly="true"
                  title="Primary guest name is locked and cannot be edited"
                  className="w-full bg-[#28050d] border border-[#782334] rounded-md pl-9 pr-24 py-2.5 text-sm font-serif font-semibold text-white select-none cursor-not-allowed shadow-inner focus:outline-none"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#caa48a] pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#86efac] bg-[#3a0812] border border-[#5d1927] px-2 py-0.5 rounded shadow-sm">
                    <Check className="w-3 h-3 text-[#86efac]" /> Verified
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#caa298] font-sans mt-1.5 flex items-center gap-1">
                <span>The primary guest name is locked to the verified invitation (<strong>{selectedGuest.name}</strong>) and cannot be edited.</span>
              </p>
            </div>

            {/* Attendance Radios */}
            <div>
              <label className="block font-serif italic text-xs sm:text-sm text-[#f0ded4] mb-2">
                Will you be attending our wedding?<span className="text-[#fca5a5]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAttendance('accepted')}
                  className={`text-center px-4 py-2.5 rounded-md text-xs sm:text-sm font-sans transition-all duration-150 cursor-pointer ${
                    attendance === 'accepted'
                      ? 'bg-white text-[#460e19] font-medium shadow-md'
                      : 'bg-[#360912] text-[#e8cec2] hover:bg-[#3f0c16] border border-[#6b1f2e]'
                  }`}
                >
                  Joyfully accepts
                </button>

                <button
                  type="button"
                  onClick={() => setAttendance('declined')}
                  className={`text-center px-4 py-2.5 rounded-md text-xs sm:text-sm font-sans transition-all duration-150 cursor-pointer ${
                    attendance === 'declined'
                      ? 'bg-white text-[#460e19] font-medium shadow-md'
                      : 'bg-[#360912] text-[#e8cec2] hover:bg-[#3f0c16] border border-[#6b1f2e]'
                  }`}
                >
                  Regretfully declines
                </button>
              </div>
            </div>

            {/* ACCOMPANYING GUEST NAMES (Only when accepted) */}
            {attendance === 'accepted' && (
              <div className="space-y-4 pt-1">
                {maxCompanions > 0 ? (
                  <div className="bg-[#2d0710] p-4 sm:p-5 rounded-xl border border-[#782334] space-y-4 shadow-inner">
                    {/* Header with live dynamic party size count */}
                    <div className="flex items-center justify-between border-b border-[#4f131f] pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#caa48a]" />
                        <span className="font-cinzel text-xs tracking-wider uppercase text-white font-semibold">
                          Accompanying Guests ({maxCompanions} Available)
                        </span>
                      </div>

                      {/* Live party attendee counter */}
                      <span className="inline-flex items-center gap-1.5 text-xs font-sans px-2.5 py-1 rounded-full bg-[#1e0308] border border-[#5d1927] text-[#fce8de]">
                        <span className="w-2 h-2 rounded-full bg-[#86efac]" />
                        <span>Total Party: <strong>{calculatedAttendees}</strong> of {maxInvitations} Reserved Seats</span>
                      </span>
                    </div>

                    {/* Instruction note matching client's rule */}
                    <div className="p-3 rounded-lg bg-[#21040a] border border-[#521723] text-xs font-sans text-[#dfc3b5] space-y-1">
                      <p className="flex items-center gap-1.5 text-white font-serif text-xs sm:text-sm">
                        <span>Primary Guest (<strong>{selectedGuest.name}</strong>) is already counted as Guest #1.</span>
                      </p>
                      <p className="text-[11px] text-[#caa298]">
                        Enter the name of each accompanying guest below. If you are attending alone or with fewer companions, simply leave the unused slots blank (blank slots will not be counted).
                      </p>
                    </div>

                    {/* Inputs for each companion slot */}
                    <div className="space-y-3">
                      {companionNames.map((cName, idx) => {
                        const isFilled = cName.trim().length > 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-sans">
                              <label className="text-[#e8cec2] flex items-center gap-1.5">
                                <span className="font-serif italic font-medium">Accompanying Guest #{idx + 1}</span>
                                <span className="text-[10px] text-[#caa298] font-sans">
                                  (Attendee #{idx + 2} of {maxInvitations})
                                </span>
                              </label>
                              <span
                                className={`text-[10px] font-sans px-2 py-0.5 rounded transition-colors ${
                                  isFilled
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-[#200409] text-[#935c67] border border-[#44111c]'
                                }`}
                              >
                                {isFilled ? '✓ Attending (+1)' : 'Optional (leave blank if solo)'}
                              </span>
                            </div>
                            <input
                              type="text"
                              value={cName}
                              onChange={(e) => handleCompanionNameChange(idx, e.target.value)}
                              placeholder={`Enter name for Accompanying Guest #${idx + 1} (or leave blank)`}
                              className={`w-full bg-[#1e0308] border rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#783e4a] outline-none transition-colors ${
                                isFilled
                                  ? 'border-[#caa48a] focus:border-[#e6cebe] focus:ring-1 focus:ring-[#e6cebe]'
                                  : 'border-[#6b1f2e] focus:border-[#caa48a]'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Live summary footer */}
                    <div className="pt-2.5 border-t border-[#4f131f] flex items-center justify-between text-xs text-[#d9a89c] font-sans flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#caa48a]" />
                        <span>
                          Confirmed Attendees: <strong className="text-white">{calculatedAttendees} {calculatedAttendees === 1 ? 'Person' : 'People'}</strong>{' '}
                          ({selectedGuest.name}
                          {activeCompanions.length > 0
                            ? ` + ${activeCompanions.join(', ')}`
                            : ' attending alone'})
                        </span>
                      </div>
                      {activeCompanions.length < maxCompanions && (
                        <span className="text-[11px] text-[#caa298] italic">
                          ({maxCompanions - activeCompanions.length} unused {maxCompanions - activeCompanions.length === 1 ? 'seat' : 'seats'} left blank)
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* If allocatedInvitations is 1 (e.g. Clara Montgomery) */
                  <div className="p-3.5 rounded-xl bg-[#28050d] border border-[#641b2a] text-xs font-sans text-[#dfc3b5] flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#86efac] shrink-0" />
                    <span>
                      This invitation is reserved for <strong>1 attendee</strong> (Primary Guest: <strong>{selectedGuest.name}</strong>).
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block font-serif italic text-xs sm:text-sm text-[#f0ded4] mb-1.5">
                Enter your email for confirmation<span className="text-[#fca5a5]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. guest@example.com"
                className="w-full bg-[#360912] border border-[#6b1f2e] focus:border-[#e6cebe] focus:ring-1 focus:ring-[#e6cebe] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-[#874e59] outline-none transition-colors"
              />
            </div>

            {/* Optional Wishes / Dietary Accordion */}
            {attendance === 'accepted' && (
              <div className="pt-1">
                <details className="group text-xs">
                  <summary className="cursor-pointer text-[#caa298] hover:text-[#f3ded4] font-serif italic list-none flex items-center justify-between">
                    <span>+ Add dietary requirements or note (optional)</span>
                  </summary>
                  <div className="mt-2 space-y-2 pt-2 border-t border-[#541723]">
                    <input
                      type="text"
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      placeholder="Dietary restrictions for your party (e.g. Vegetarian, Gluten-Free)"
                      className="w-full bg-[#360912] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white placeholder-[#874e59] outline-none"
                    />
                    <textarea
                      value={wishes}
                      onChange={(e) => setWishes(e.target.value)}
                      placeholder="Leave a sweet note for Emma & Andre..."
                      rows={2}
                      className="w-full bg-[#360912] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white placeholder-[#874e59] outline-none resize-none"
                    />
                  </div>
                </details>
              </div>
            )}

            {errorMsg && (
              <p className="text-rose-300 text-xs bg-rose-950/70 p-2.5 rounded border border-rose-800">
                {errorMsg}
              </p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white hover:bg-[#faede5] text-[#460e19] font-cinzel text-xs tracking-[0.25em] font-bold py-3 px-6 rounded-full shadow-lg transition-transform duration-200 active:scale-95 disabled:opacity-75 uppercase cursor-pointer"
              >
                {isSubmitting ? 'Recording RSVP...' : 'SUBMIT RSVP'}
              </button>
            </div>

            {/* Footnote */}
            <p className="text-center font-sans text-[9px] tracking-wide text-[#bda097] opacity-80 pt-1">
              Your reservation details will be sent to the couple.
            </p>
          </form>
        </div>
      ) : (
        /* PROMPT CARD WHEN GUEST HAS NOT YET SEARCHED OR SELECTED THEIR NAME */
        <div className="w-full max-w-xl sm:max-w-2xl mx-auto bg-[#360811]/90 text-[#f7eade] p-7 sm:p-9 rounded-2xl border border-[#5d1726] shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#20040a] text-[#caa48a] border border-[#5a1523] flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6 text-[#caa48a]" />
          </div>

          <div>
            <span className="font-cinzel text-[10px] sm:text-xs tracking-[0.25em] uppercase text-[#deb6ab] block font-semibold mb-1">
              RSVP By Invitation Only
            </span>
            <h4 className="font-serif text-2xl sm:text-3xl font-medium text-white">
              Search Your Name to RSVP
            </h4>
          </div>

          <p className="font-serif italic text-xs sm:text-sm text-[#caa298] max-w-md mx-auto leading-relaxed">
            To view your reserved invitation and submit your RSVP, please search your full name in the <strong>Guest Search</strong> above.
          </p>

          <div className="pt-1 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 text-[11px] font-sans text-[#f0ded4] bg-[#22040b] px-4 py-2 rounded-full border border-[#4d131f] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>The RSVP response form will appear once your name is verified on the list</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
