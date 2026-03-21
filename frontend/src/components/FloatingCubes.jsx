import React, { useEffect, useRef, useState } from 'react';

function FloatingCubes() {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredCube, setHoveredCube] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x: x * 40, y: y * 40 });
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const cubeConfig = [
    { id: 'large', className: 'cube cube-large' },
    { id: 'small-top', className: 'cube cube-small cube-small-top' },
    { id: 'small-bottom', className: 'cube cube-small cube-small-bottom' },
    { id: 'extra-1', className: 'cube cube-extra cube-extra-1' },
    { id: 'extra-2', className: 'cube cube-extra cube-extra-2' },
    { id: 'extra-3', className: 'cube cube-extra cube-extra-3' },
  ];

  return (
    <div className="floating-cubes" ref={containerRef} aria-hidden="true">
      {cubeConfig.map((cube) => (
        <div
          key={cube.id}
          className={cube.className}
          style={{
            transform: `translate3d(${hoveredCube === cube.id ? mousePos.x * 0.6 : mousePos.x * 0.3}px, ${hoveredCube === cube.id ? mousePos.y * 0.6 : mousePos.y * 0.3}px, 0)`,
          }}
          onMouseEnter={() => setHoveredCube(cube.id)}
          onMouseLeave={() => setHoveredCube(null)}
          data-cube-id={cube.id}
        />
      ))}
    </div>
  );
}

export default FloatingCubes;
