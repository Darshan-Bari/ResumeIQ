import React from 'react';

function GradientWaveStrip() {
  return (
    <div className="gradient-wave-container">
      <svg
        viewBox="0 0 1440 320"
        className="gradient-wave-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#00FFC6" />
            <stop offset="100%" stopColor="#00C2FF" />
          </linearGradient>
        </defs>

        <path
          fill="url(#waveGradient)"
          fillOpacity="0.6"
          d="M0,160 C240,240 480,80 720,160 C960,240 1200,80 1440,160 L1440,320 L0,320 Z"
        />
      </svg>

      <div className="gradient-wave-blur" aria-hidden="true"></div>
    </div>
  );
}

export default GradientWaveStrip;
