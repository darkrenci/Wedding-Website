import React from 'react';
import { WeddingDetails } from '../types/wedding';
import { Sliders, RotateCcw, X, Sparkles } from 'lucide-react';

interface CustomizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wedding: WeddingDetails;
  onChange: (updated: WeddingDetails) => void;
  guestName: string;
  onGuestNameChange: (name: string) => void;
  onReset: () => void;
}

export const CustomizerDrawer: React.FC<CustomizerDrawerProps> = ({
  isOpen,
  onClose,
  wedding,
  onChange,
  guestName,
  onGuestNameChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="bg-[#21060b] text-[#f7eade] border-l border-[#6b1f2e] w-full max-w-md h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#521723] mb-6">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#f3cebe]" />
              <h3 className="font-cinzel text-base tracking-wider uppercase font-semibold text-white">
                Invitation Customizer
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[#caa298] hover:text-white transition-colors"
              aria-label="Close customizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[#caa298] font-sans mb-5 leading-relaxed">
            Customize the couple’s names, wedding date, venue, and guest greeting in real-time to preview your client's invitation.
          </p>

          {/* Form controls */}
          <div className="space-y-4">
            {/* Guest Personalization */}
            <div className="bg-[#340912] p-3.5 rounded-lg border border-[#611b29]">
              <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                Personalized Guest Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => onGuestNameChange(e.target.value)}
                placeholder="e.g. Mr. & Mrs. Harrison"
                className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white placeholder-[#78434f] outline-none"
              />
              <span className="text-[10px] text-[#b38b80] mt-1 block">
                Shown on envelope and invitation greeting
              </span>
            </div>

            {/* Bride & Groom Names */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                  Bride's Name
                </label>
                <input
                  type="text"
                  value={wedding.brideName}
                  onChange={(e) => onChange({
                    ...wedding,
                    brideName: e.target.value,
                    coupleInitials: `${e.target.value.charAt(0) || 'E'}${wedding.groomName.charAt(0) || 'A'}`
                  })}
                  className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                  Groom's Name
                </label>
                <input
                  type="text"
                  value={wedding.groomName}
                  onChange={(e) => onChange({
                    ...wedding,
                    groomName: e.target.value,
                    coupleInitials: `${wedding.brideName.charAt(0) || 'E'}${e.target.value.charAt(0) || 'A'}`
                  })}
                  className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Monogram Initials */}
            <div>
              <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                Monogram Initials (Wax Seal &amp; Card)
              </label>
              <input
                type="text"
                maxLength={4}
                value={wedding.coupleInitials}
                onChange={(e) => onChange({ ...wedding, coupleInitials: e.target.value.toUpperCase() })}
                className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white font-serif uppercase outline-none"
              />
            </div>

            {/* Wedding Date formatted */}
            <div>
              <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                Formatted Date
              </label>
              <input
                type="text"
                value={wedding.dateFormatted}
                onChange={(e) => onChange({ ...wedding, dateFormatted: e.target.value })}
                className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white outline-none"
              />
            </div>

            {/* Location City */}
            <div>
              <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                City / Destination
              </label>
              <input
                type="text"
                value={wedding.locationCity}
                onChange={(e) => onChange({ ...wedding, locationCity: e.target.value })}
                className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white outline-none"
              />
            </div>

            {/* Venue Name & Address */}
            <div>
              <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                Venue Name &amp; Address
              </label>
              <input
                type="text"
                value={wedding.venueName}
                onChange={(e) => onChange({ ...wedding, venueName: e.target.value })}
                className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white outline-none mb-2"
                placeholder="Venue name"
              />
              <input
                type="text"
                value={wedding.venueAddress}
                onChange={(e) => onChange({ ...wedding, venueAddress: e.target.value })}
                className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white outline-none"
                placeholder="Full street address"
              />
            </div>

            {/* RSVP Deadline */}
            <div>
              <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                RSVP Deadline
              </label>
              <input
                type="text"
                value={wedding.rsvpDeadline}
                onChange={(e) => onChange({ ...wedding, rsvpDeadline: e.target.value })}
                className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white outline-none"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-[11px] font-cinzel tracking-wider text-[#eccdc0] uppercase mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={wedding.contactEmail}
                onChange={(e) => onChange({ ...wedding, contactEmail: e.target.value })}
                className="w-full bg-[#1e0409] border border-[#6b1f2e] rounded px-3 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-[#521723] mt-6 flex gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-2.5 px-4 rounded border border-[#6b1f2e] text-[#caa298] hover:text-white hover:bg-[#340912] font-sans text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded bg-[#e8cfc2] hover:bg-white text-[#380912] font-sans text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
