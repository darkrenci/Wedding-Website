import React, { useState } from 'react';
import { WeddingDetails } from '../types/wedding';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { Calendar, Check, Download, ExternalLink } from 'lucide-react';

interface CalendarCardProps {
  wedding: WeddingDetails;
}

export const CalendarCard: React.FC<CalendarCardProps> = ({ wedding }) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calendar for July 2027 (Starts on Thursday July 1, 2027)
  // July 2027: 31 days. July 1 is a Thursday (column index 4 if Sunday=0)
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const startDayOffset = 4; // Thursday
  const totalDays = 31;
  const targetDay = wedding.dayNumber || 17;

  const handleCopyDate = () => {
    navigator.clipboard.writeText(`${wedding.brideName} & ${wedding.groomName} Wedding: ${wedding.dateFormatted} at ${wedding.venueName}, ${wedding.locationCity}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-[#460e19] text-[#f7eade] p-6 sm:p-10 rounded-2xl shadow-xl border border-[#6b1e2e] my-8">
      {/* Month & Year Title */}
      <h3 className="font-cinzel text-center text-sm sm:text-lg tracking-[0.35em] font-medium text-[#f3dacb] uppercase mb-6">
        {wedding.monthYear}
      </h3>

      {/* Calendar Grid Table */}
      <div className="max-w-sm sm:max-w-md mx-auto">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center text-xs sm:text-sm font-sans tracking-widest text-[#d9a89c] mb-3 opacity-80">
          {daysOfWeek.map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days matrix */}
        <div className="grid grid-cols-7 text-center font-serif text-sm sm:text-lg text-[#f0e2d8] gap-y-3">
          {/* Empty offset cells before 1st of July */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}

          {/* Days 1 to 31 */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const isTarget = day === targetDay;

            return (
              <div key={day} className="relative flex items-center justify-center h-8">
                {isTarget ? (
                  <div className="relative group cursor-pointer flex items-center justify-center">
                    {/* Hand-drawn style heart outline around 17 */}
                    <svg
                      viewBox="0 0 40 40"
                      className="absolute w-10 h-10 -top-1 -left-1 text-[#f5dfd5] animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M 20,13 C 18,8 10,8 9,15 C 8,22 20,29 20,29 C 20,29 32,22 31,15 C 30,8 22,8 20,13 Z" />
                    </svg>
                    <span className="relative z-10 font-bold text-white text-base">
                      {day}
                    </span>
                  </div>
                ) : (
                  <span className="text-[#deb6ab] hover:text-white transition-colors">
                    {day}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add To Calendar Button (Crisp white rectangle as in image 6s) */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => setShowModal(true)}
          className="bg-white hover:bg-[#faede5] text-[#4a0d18] font-cinzel text-[11px] sm:text-xs tracking-[0.2em] font-semibold py-2.5 px-6 rounded-xs shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 cursor-pointer uppercase"
        >
          Add To Calendar
        </button>
      </div>

      {/* Calendar Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#24060b] text-[#f7eade] border border-[#742334] rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#521723]">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#f3cebe]" />
                <h4 className="font-cinzel text-sm tracking-wider uppercase font-semibold">Save Our Date</h4>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#baa09a] hover:text-white p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="font-serif italic text-sm text-[#dec7be] mb-4 text-center">
              {wedding.dateFormatted} <br />
              {wedding.venueName}, {wedding.locationCity}
            </p>

            <div className="space-y-2.5">
              <a
                href={generateGoogleCalendarUrl(wedding)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-[#e8cfc2] hover:bg-white text-[#380912] font-sans text-xs font-semibold tracking-wider transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Add to Google Calendar
              </a>

              <button
                onClick={() => {
                  downloadIcsFile(wedding);
                  setShowModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded border border-[#832d40] hover:bg-[#46121f] text-[#f4ded2] font-sans text-xs font-medium tracking-wider transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Apple / Outlook (.ics)
              </button>

              <button
                onClick={handleCopyDate}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded text-xs text-[#c6aba1] hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                {copied ? 'Details Copied!' : 'Copy Wedding Information'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
