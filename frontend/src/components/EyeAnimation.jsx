import React, { useEffect, useRef } from 'react';

function getTargetOffset(eyeElement, cursor, maxRadius) {
  const rect = eyeElement.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = cursor.x - cx;
  const dy = cursor.y - cy;
  const distance = Math.hypot(dx, dy);

  if (!distance) {
    return { x: 0, y: 0 };
  }

  // Use angle-based direction and clamp movement so the pupil stays inside the socket.
  const angle = Math.atan2(dy, dx);
  const radius = Math.min(maxRadius, distance / 26);

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function applyLerp(current, target, factor) {
  return current + (target - current) * factor;
}

function EyeAnimation({ closed = false }) {
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const leftPupilRef = useRef(null);
  const rightPupilRef = useRef(null);
  const leftPos = useRef({ x: 0, y: 0 });
  const rightPos = useRef({ x: 0, y: 0 });
  const mouse = useRef({ x: 0, y: 0 });
  const lastMoveTime = useRef(0);
  const frameTime = useRef(0);

  useEffect(() => {
    let rafId;

    mouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    lastMoveTime.current = performance.now();

    const handleMove = (event) => {
      mouse.current = { x: event.clientX, y: event.clientY };
      lastMoveTime.current = performance.now();
    };

    const animate = (timestamp) => {
      frameTime.current = timestamp;

      if (closed) {
        leftPos.current.x = applyLerp(leftPos.current.x, 0, 0.2);
        leftPos.current.y = applyLerp(leftPos.current.y, 0, 0.2);
        rightPos.current.x = applyLerp(rightPos.current.x, 0, 0.2);
        rightPos.current.y = applyLerp(rightPos.current.y, 0, 0.2);

        if (leftPupilRef.current) {
          leftPupilRef.current.style.transform = `translate3d(${leftPos.current.x}px, ${leftPos.current.y}px, 0)`;
        }
        if (rightPupilRef.current) {
          rightPupilRef.current.style.transform = `translate3d(${rightPos.current.x}px, ${rightPos.current.y}px, 0)`;
        }
      } else {
        const idleElapsed = timestamp - lastMoveTime.current;
        const isIdle = idleElapsed > 220;
        const idleT = timestamp * 0.001;

        if (leftEyeRef.current && leftPupilRef.current) {
          const target = getTargetOffset(leftEyeRef.current, mouse.current, 8);
          const idleX = isIdle ? Math.sin(idleT * 1.2) * 0.9 : 0;
          const idleY = isIdle ? Math.cos(idleT * 1.05) * 0.7 : 0;

          // Left eye leads slightly for natural asymmetry.
          leftPos.current.x = applyLerp(leftPos.current.x, target.x + idleX, 0.15);
          leftPos.current.y = applyLerp(leftPos.current.y, target.y + idleY, 0.15);
          leftPupilRef.current.style.transform = `translate3d(${leftPos.current.x}px, ${leftPos.current.y}px, 0)`;
        }

        if (rightEyeRef.current && rightPupilRef.current) {
          const target = getTargetOffset(rightEyeRef.current, mouse.current, 8);
          const idleX = isIdle ? Math.sin(idleT * 1.2 + 0.7) * 0.8 : 0;
          const idleY = isIdle ? Math.cos(idleT * 1.05 + 0.45) * 0.65 : 0;

          // Slightly lower factor creates a subtle delayed follow in the right eye.
          rightPos.current.x = applyLerp(rightPos.current.x, target.x + idleX, 0.11);
          rightPos.current.y = applyLerp(rightPos.current.y, target.y + idleY, 0.11);
          rightPupilRef.current.style.transform = `translate3d(${rightPos.current.x}px, ${rightPos.current.y}px, 0)`;
        }
      }

      rafId = window.requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [closed]);

  return (
    <div className="eye-animation-wrap" aria-hidden="true">
      <div className={`eye-socket ${closed ? 'is-closed' : ''}`} ref={leftEyeRef}>
        <span className="eye-pupil" ref={leftPupilRef} />
        <span className="eye-lid" />
      </div>
      <div className={`eye-socket ${closed ? 'is-closed' : ''}`} ref={rightEyeRef}>
        <span className="eye-pupil" ref={rightPupilRef} />
        <span className="eye-lid" />
      </div>
    </div>
  );
}

export default EyeAnimation;
