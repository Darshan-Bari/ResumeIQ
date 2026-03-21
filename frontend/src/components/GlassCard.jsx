import React, { useState } from 'react';
import { Check } from 'lucide-react';

function GlassCard({ title, cardType = 'nodes' }) {
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg) scale(1)');

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 14;
    const rotateX = (0.5 - (y / rect.height)) * 14;
    setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`);
  };

  const handleLeave = () => {
    setTransform('rotateX(0deg) rotateY(0deg) scale(1)');
  };

  return (
    <article
      className="feature-glass-card"
      style={{ transform }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      data-interactive-card="true"
    >
      <div className="feature-card-header">
        <h3>{title}</h3>
      </div>

      {cardType === 'nodes' ? (
        <div className="nodes-icon" aria-hidden="true">
          <span className="node n1"></span>
          <span className="node n2"></span>
          <span className="node n3"></span>
          <span className="line l1"></span>
          <span className="line l2"></span>
        </div>
      ) : (
        <div className="check-icon" aria-hidden="true">
          <Check size={26} strokeWidth={2.6} />
        </div>
      )}

      <p>
        {cardType === 'nodes'
          ? 'Cross-functional planning, tracking, and delivery workflows connected into one execution layer.'
          : 'A practical blend of AI screening, human oversight, and transparent role-fit insights for every stage.'}
      </p>
      <button className="see-more-link">See more</button>
    </article>
  );
}

export default GlassCard;
