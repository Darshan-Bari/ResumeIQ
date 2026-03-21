import React, { useState, useRef, useEffect } from 'react';

// Generate random floating boxes with varied sizes and positions
const generateBoxes = () => {
  const boxes = [];
  const positions = [
    { top: '8%', left: '4%', width: 64, height: 64, duration: 5.2 },
    { top: '12%', right: '6%', width: 48, height: 48, duration: 6.1 },
    { top: '22%', left: '8%', width: 72, height: 72, duration: 5.8 },
    { top: '35%', right: '12%', width: 52, height: 52, duration: 6.4 },
    { bottom: '18%', left: '10%', width: 60, height: 60, duration: 5.5 },
    { bottom: '12%', right: '8%', width: 56, height: 56, duration: 6.7 },
    { top: '45%', left: '2%', width: 44, height: 44, duration: 5.9 },
    { top: '60%', right: '4%', width: 68, height: 68, duration: 6.2 },
    { bottom: '28%', left: '5%', width: 52, height: 52, duration: 5.6 },
    { top: '18%', left: '14%', width: 48, height: 48, duration: 6.3 },
  ];

  return positions.map((pos, idx) => ({
    id: idx,
    ...pos,
    rotation: Math.random() * 360,
    delay: (idx * 0.15) % 5,
  }));
};

export default function FloatingBoxes() {
  const [boxes] = useState(generateBoxes());
  const [hoveredBox, setHoveredBox] = useState(null);

  return (
    <>
      {boxes.map((box) => (
        <div
          key={box.id}
          className="floating-box"
          style={{
            top: box.top,
            bottom: box.bottom,
            left: box.left,
            right: box.right,
            width: `${box.width}px`,
            height: `${box.height}px`,
            '--animation-duration': `${box.duration}s`,
            '--animation-delay': `${box.delay}s`,
          }}
          onMouseEnter={() => setHoveredBox(box.id)}
          onMouseLeave={() => setHoveredBox(null)}
          data-hovered={hoveredBox === box.id}
        />
      ))}
    </>
  );
}
