import React, { useEffect, useRef, useState } from 'react';
import FloatingCubes from './FloatingCubes.jsx';

function Hero({ onScrollClick }) {
  const heroRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = heroRef.current;
    if (!node) {
      return undefined;
    }

    const handleMove = (event) => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 20;
      setOffset({ x, y });
    };

    const resetOffset = () => setOffset({ x: 0, y: 0 });

    node.addEventListener('mousemove', handleMove);
    node.addEventListener('mouseleave', resetOffset);

    return () => {
      node.removeEventListener('mousemove', handleMove);
      node.removeEventListener('mouseleave', resetOffset);
    };
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-left">
        <h1 className="hero-title">ResumeIQ</h1>
        <p className="hero-tagline">A Turnkey Service from Start to Finish</p>
        <p className="hero-subtitle">
          Precision hiring intelligence shaped for modern recruitment and candidate excellence.
        </p>
        <button className="scroll-indicator" onClick={onScrollClick} aria-label="Scroll to approach cards">
          ↓
        </button>
      </div>

      <div className="hero-right" style={{ transform: `translate3d(${offset.x * 0.5}px, ${offset.y * 0.5}px, 0)` }}>
        <FloatingCubes />
      </div>
    </section>
  );
}

export default Hero;
