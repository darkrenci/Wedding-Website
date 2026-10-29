import React from 'react';

interface LaceFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const LaceFrame: React.FC<LaceFrameProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative p-5 md:p-7 ${className}`}>
      {/* Outer scalloped lace border background */}
      <div className="absolute inset-0 pointer-events-none rounded-xl border-4 border-dashed border-[#e6d2c4]/70 shadow-[0_4px_20px_rgba(0,0,0,0.15)]" />
      
      {/* Corner lace florets */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-2 border-[#d9c0af] bg-[#faf6f0] flex items-center justify-center pointer-events-none shadow-sm">
        <span className="w-3 h-3 rounded-full bg-[#d9c0af]/40 block" />
      </div>
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-[#d9c0af] bg-[#faf6f0] flex items-center justify-center pointer-events-none shadow-sm">
        <span className="w-3 h-3 rounded-full bg-[#d9c0af]/40 block" />
      </div>
      <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full border-2 border-[#d9c0af] bg-[#faf6f0] flex items-center justify-center pointer-events-none shadow-sm">
        <span className="w-3 h-3 rounded-full bg-[#d9c0af]/40 block" />
      </div>
      <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full border-2 border-[#d9c0af] bg-[#faf6f0] flex items-center justify-center pointer-events-none shadow-sm">
        <span className="w-3 h-3 rounded-full bg-[#d9c0af]/40 block" />
      </div>

      {/* Scalloped eyelet edges top & bottom */}
      <div className="absolute top-0 left-6 right-6 h-2 flex justify-between overflow-hidden opacity-80 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={`t-${i}`} className="w-3 h-3 -mt-1.5 rounded-full border border-[#d9c0af] bg-[#f7ede2]" />
        ))}
      </div>
      <div className="absolute bottom-0 left-6 right-6 h-2 flex justify-between overflow-hidden opacity-80 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={`b-${i}`} className="w-3 h-3 -mb-1.5 rounded-full border border-[#d9c0af] bg-[#f7ede2]" />
        ))}
      </div>

      {/* Main content body inside frame */}
      <div className="relative z-10 bg-[#fbf8f4]/95 backdrop-blur-xs p-6 md:p-8 rounded-lg border border-[#e4d3c6] text-center shadow-inner">
        {children}
      </div>
    </div>
  );
};
