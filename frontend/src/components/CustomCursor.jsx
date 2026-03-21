import React, { useEffect, useRef, useState } from 'react';

function CustomCursor() {
  const cursorRef = useRef(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [hoveringCard, setHoveringCard] = useState(false);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const canEnable = !isCoarsePointer && !isTouchDevice;
    setEnabled(canEnable);

    if (!canEnable) {
      return undefined;
    }

    document.body.classList.add('custom-cursor-enabled');

    const update = () => {
      const speed = 0.24;
      positionRef.current.x += (targetRef.current.x - positionRef.current.x) * speed;
      positionRef.current.y += (targetRef.current.y - positionRef.current.y) * speed;

      if (cursorRef.current) {
        cursorRef.current.style.setProperty('--cursor-x', `${positionRef.current.x}px`);
        cursorRef.current.style.setProperty('--cursor-y', `${positionRef.current.y}px`);
      }

      rafRef.current = requestAnimationFrame(update);
    };

    const handleMove = (event) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleHoverState = (event) => {
      const cardTarget = event.target.closest('[data-interactive-card="true"], .feature-glass-card, .job-card');
      setHoveringCard(Boolean(cardTarget));
    };

    const handleMouseLeaveWindow = () => setHoveringCard(false);

    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mousemove', handleHoverState);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);

    rafRef.current = requestAnimationFrame(update);

    return () => {
      document.body.classList.remove('custom-cursor-enabled');
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mousemove', handleHoverState);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <div ref={cursorRef} className={`custom-cursor ${hoveringCard ? 'cursor-hover' : 'cursor-default'}`} />;
}

export default CustomCursor;
