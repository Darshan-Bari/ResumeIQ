import React from 'react';

export default function BackgroundGradientStrip() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-strip-container">
      <svg
        viewBox="0 0 1440 600"
        className="w-full h-full bg-gradient-strip-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="bgWaveGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#00FFC6" />
            <stop offset="100%" stopColor="#00C2FF" />
          </linearGradient>
        </defs>

        <path
          d="M0,400 C300,300 600,500 900,400 C1200,300 1440,450 1440,450 L1440,600 L0,600 Z"
          fill="url(#bgWaveGradient)"
          fillOpacity="0.25"
          className="bg-gradient-strip-path"
        />
      </svg>

      {/* Blur overlay for soft glow effect */}
      <div className="bg-gradient-strip-blur"></div>
    </div>
  );
}
