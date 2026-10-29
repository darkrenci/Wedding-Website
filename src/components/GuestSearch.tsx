import React, { useState, useEffect, useRef } from 'react';
import { InvitedGuest } from '../types/wedding';
import { searchInvitedGuests, getInvitedGuests, subscribeGuestList } from '../utils/guestList';
import { getSupabaseConfig } from '../lib/supabase';
import { Search, UserCheck, X, Check, Users, Sparkles, Database } from 'lucide-react';

interface GuestSearchProps {
  selectedGuest: InvitedGuest | null;
  onSelectGuest: (guest: InvitedGuest | null) => void;
  className?: string;
}

export const GuestSearch: React.FC<GuestSearchProps> = ({
  selectedGuest,
  onSelectGuest,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InvitedGuest[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allGuests, setAllGuests] = useState<InvitedGuest[]>(() => getInvitedGuests());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(() => getSupabaseConfig().isConfigured);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSupabaseConnected(getSupabaseConfig().isConfigured);
    const unsubscribe = subscribeGuestList((updated) => {
      setAllGuests(updated);
      setIsSupabaseConnected(getSupabaseConfig().isConfigured);
      if (query.trim()) {
        setResults(searchInvitedGuests(query));
      }
    });
    return unsubscribe;
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length > 0) {
      const hits = searchInvitedGuests(val);
      setResults(hits);
      setIsOpen(true);
      setHasSearched(true);
    } else {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
    }
  };

  const handleSelect = (guest: InvitedGuest) => {
    onSelectGuest(guest);
    setQuery('');
    setIsOpen(false);
    setHasSearched(false);
  };

  const handleClearSelection = () => {
    onSelectGuest(null);
    setQuery('');
  };

  const handleQuickPick = (guestName: string) => {
    const found = allGuests.find(
      (g) => g.name.toLowerCase() === guestName.toLowerCase()
    );
    if (found) {
      handleSelect(found);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {selectedGuest ? (
        /* ACTIVE GUEST FOUND & SELECTED CARD */
        <div className="bg-gradient-to-br from-[#3b0914] via-[#4a0d1a] to-[#32060f] text-[#f7eade] p-5 sm:p-6 rounded-2xl border-2 border-[#caa48a] shadow-xl relative overflow-hidden transition-all duration-300">
          {/* Subtle gold floral watermark */}
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <Users className="w-32 h-32 text-[#d4af37]" />
          </div>

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-start gap-3.5">
              {/* Ornate verification badge */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#faede5] text-[#4a0d18] flex items-center justify-center shrink-0 shadow-md border-2 border-[#d9baa6]">
                <UserCheck className="w-6 h-6 text-[#4a0d18]" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#e8cfc2] uppercase font-semibold">
                    Invitation Found &middot; Verified Guest
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#28040a] text-[#f1d0bc] border border-[#782334] text-[10px] px-2.5 py-0.5 rounded-full font-mono">
                    <Sparkles className="w-2.5 h-2.5 text-[#f1d0bc]" />
                    {selectedGuest.allocatedInvitations} {selectedGuest.allocatedInvitations === 1 ? 'Invitation' : 'Invitations'}
                  </span>
                </div>

                {/* Primary Guest Name (e.g. John Padilla) */}
                <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium tracking-wide mt-1">
                  Guest: <span className="text-[#faede5] font-semibold">{selectedGuest.name}</span>
                </h3>

                {/* Key requirement highlight: Primary guest is already included */}
                <div className="mt-2.5 p-3 rounded-xl bg-[#2a050d]/80 border border-[#641b2a] max-w-lg">
                  <p className="font-serif italic text-xs sm:text-sm text-[#f5dfd5]">
                    <strong>{selectedGuest.name}</strong> has{' '}
                    <span className="text-white font-bold underline decoration-[#caa48a] decoration-2">
                      {selectedGuest.allocatedInvitations} {selectedGuest.allocatedInvitations === 1 ? 'invitation' : 'invitations'}
                    </span>{' '}
                    (= {selectedGuest.allocatedInvitations} attendees total).
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#caa298] font-sans mt-1">
                    {selectedGuest.allocatedInvitations === 1 ? (
                      'This invitation is reserved for 1 attendee (you are included).'
                    ) : (
                      <>
                        <span className="text-white font-semibold">{selectedGuest.name} is already included as the primary guest</span>. You can enter names for up to{' '}
                        <span className="text-white font-semibold">
                          {selectedGuest.allocatedInvitations - 1} accompanying{' '}
                          {selectedGuest.allocatedInvitations - 1 === 1 ? 'guest' : 'guests'}
                        </span>{' '}
                        in the form below, or leave unused slots blank if attending alone.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Change Guest / Search Again button */}
            <button
              type="button"
              onClick={handleClearSelection}
              title="Search different guest"
              className="text-[#baa09a] hover:text-white p-1.5 rounded-full hover:bg-[#5a1424] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* GUEST SEARCH INPUT CARD */
        <div
          ref={searchContainerRef}
          className="bg-[#460e19] text-[#f7eade] p-5 sm:p-7 rounded-2xl border border-[#6d1d2e] shadow-xl relative"
        >
          {/* Header */}
          <div className="text-center mb-3.5">
            <div className="inline-flex items-center gap-2 mb-1 flex-wrap justify-center">
              <Search className="w-4 h-4 text-[#e2b0a3]" />
              <span className="font-cinzel text-xs sm:text-sm tracking-[0.25em] text-[#faede5] uppercase font-semibold">
                Guest Search
              </span>
              {isSupabaseConnected && (
                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-[#27050d] text-emerald-300 border border-emerald-800 font-mono tracking-normal">
                  <Database className="w-2.5 h-2.5" />
                  Supabase Active
                </span>
              )}
            </div>
            <p className="font-serif italic text-xs sm:text-sm text-[#dfc3b5]">
              Search your name in the guest list to check your invitations &amp; reserved attendees
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative max-w-lg mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (query.trim().length > 0) setIsOpen(true);
                }}
                placeholder="Type your name (e.g. John Padilla)..."
                className="w-full bg-[#320811] text-white placeholder-[#98616c] border border-[#782334] focus:border-[#e2b0a3] focus:ring-2 focus:ring-[#e2b0a3]/30 rounded-xl py-3 pl-11 pr-10 text-sm outline-none transition-all"
              />
              <Search className="w-4 h-4 text-[#baa09a] absolute left-3.5 pointer-events-none" />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setIsOpen(false);
                  }}
                  className="absolute right-3 text-[#baa09a] hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Autocomplete Results Dropdown */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#2d0710] border border-[#7a2436] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto">
                {results.length > 0 ? (
                  <div className="divide-y divide-[#4e1320]">
                    <div className="p-2 text-[10px] font-sans uppercase tracking-widest text-[#caa298] bg-[#22040b]">
                      Matching Guests in Registry
                    </div>
                    {results.map((guest) => (
                      <button
                        key={guest.id}
                        type="button"
                        onClick={() => handleSelect(guest)}
                        className="w-full text-left p-3.5 hover:bg-[#480e1b] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#460e19] group-hover:bg-[#5e1625] text-[#faede5] border border-[#701c2e] flex items-center justify-center font-serif text-sm font-bold shrink-0">
                            {guest.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-serif text-base font-semibold text-white group-hover:text-[#faede5]">
                              {guest.name}
                            </p>
                            <p className="text-[11px] text-[#caa298] font-sans">
                              {guest.allocatedInvitations} {guest.allocatedInvitations === 1 ? 'Invitation' : 'Invitations'} reserved
                              {guest.allocatedInvitations > 1 && ` (Primary guest included + ${guest.allocatedInvitations - 1} other ${guest.allocatedInvitations - 1 === 1 ? 'guest' : 'guests'})`}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 text-xs text-[#deb6ab] group-hover:text-white font-sans font-medium">
                          <span>Select</span>
                          <Check className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : hasSearched ? (
                  <div className="p-4 text-center">
                    <p className="font-serif italic text-sm text-[#f0ded4]">
                      No match found for "{query}".
                    </p>
                    <p className="text-[11px] text-[#caa298] font-sans mt-1">
                      Please check the spelling or select from sample guests below.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Quick-test guest pills (dynamically reflects real/current guests in registry) */}
          {allGuests.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#5e1826] text-center">
              <span className="text-[10px] font-sans uppercase tracking-widest text-[#caa298] block mb-2">
                Click a guest name to test verification &amp; party size:
              </span>
              <div className="flex items-center justify-center flex-wrap gap-2">
                {allGuests.slice(0, 5).map((guest) => {
                  const isJohnPadilla = guest.name.toLowerCase() === 'john padilla';
                  return (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => handleQuickPick(guest.name)}
                      className="bg-[#2a050d] hover:bg-[#3d0b16] border border-[#782334] hover:border-[#caa48a] text-[#faede5] text-xs py-1.5 px-3 rounded-full font-serif transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span className="font-semibold">{guest.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isJohnPadilla ? 'bg-[#6b1e2e] text-[#fcdcd3]' : 'bg-[#460e19] text-[#dec5b8]'
                      }`}>
                        {guest.allocatedInvitations} {guest.allocatedInvitations === 1 ? 'invitation' : 'invitations'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
