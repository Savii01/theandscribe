'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  startFadeOut?: boolean;
  onFadeComplete?: () => void;
}

export function SplashScreen({ startFadeOut = false, onFadeComplete }: SplashScreenProps) {
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (startFadeOut) {
      setFading(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onFadeComplete) onFadeComplete();
      }, 300); // 300ms matches duration-300
      return () => clearTimeout(timer);
    }
  }, [startFadeOut, onFadeComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F5C518] transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center select-none animate-pulse-slow">
        {/* Yellow background with black logo */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center">
          <Image
            src="/Logo/logo_black.svg"
            alt="theandscribe logo"
            width={176}
            height={176}
            priority
            className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
          />
        </div>
        
        {/* Brand Text */}
        <h1 className="mt-8 text-3xl font-heading font-black tracking-tightest text-[#2A2200] uppercase">
          theandscribe
        </h1>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2A2200]/60">
          Personal AI transcription
        </p>
      </div>
    </div>
  );
}
export default SplashScreen;
