import React, { useState, useEffect } from 'react';
import { WeddingDetails } from '../types/wedding';

interface CountdownCardProps {
  wedding: WeddingDetails;
}

export const CountdownCard: React.FC<CountdownCardProps> = ({ wedding }) => {
  // Wedding target: July 17, 2027 16:00:00 (EDT)
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 881, hours: 16, minutes: 1, seconds: 20 });

  useEffect(() => {
    // If target date is July 17, 2027:
    const target = new Date('2027-07-17T16:00:00');

    const updateTimer = () => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [wedding.weddingDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="w-full max-w-xl sm:max-w-2xl mx-auto bg-[#460e19] text-[#f7eade] py-9 px-6 sm:px-10 rounded-2xl border border-[#6b1e2e] shadow-xl text-center my-8">
      {/* Numbers Row */}
      <div className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-widest text-[#f5e3d7] font-normal flex items-center justify-center space-x-1 sm:space-x-2 tabular-nums">
        <span>{timeLeft.days}</span>
        <span className="text-[#a4606f] font-light text-2xl sm:text-3xl">:</span>
        <span>{pad(timeLeft.hours)}</span>
        <span className="text-[#a4606f] font-light text-2xl sm:text-3xl">:</span>
        <span>{pad(timeLeft.minutes)}</span>
        <span className="text-[#a4606f] font-light text-2xl sm:text-3xl">:</span>
        <span>{pad(timeLeft.seconds)}</span>
      </div>

      {/* Labels Row */}
      <div className="flex items-center justify-center space-x-5 sm:space-x-8 text-[9px] sm:text-[10px] font-sans tracking-[0.25em] text-[#caa298] uppercase mt-2 opacity-80">
        <span className="w-12 text-center">DAYS</span>
        <span className="w-10 text-center">HOURS</span>
        <span className="w-10 text-center">MINUTES</span>
        <span className="w-10 text-center">SECONDS</span>
      </div>

      {/* Script Footnote */}
      <p className="font-script text-2xl sm:text-3xl text-[#ecd7cb] mt-5 tracking-wide">
        Formal invitation to follow
      </p>
    </div>
  );
};
