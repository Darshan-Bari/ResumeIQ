import React from 'react';
import { FileSearch, BarChart3, Users, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    title: 'Resume Parsing',
    description: 'Advanced AI extracts key information from any resume format with 99% accuracy.',
    icon: FileSearch,
  },
  {
    title: 'Skill Gap Analysis',
    description: 'Identify missing skills and get recommendations for candidate development.',
    icon: BarChart3,
  },
  {
    title: 'Candidate Ranking',
    description: 'Automatically rank candidates based on job requirements and cultural fit.',
    icon: Users,
  },
  {
    title: 'AI Matching',
    description: 'Machine learning algorithms find the perfect match between candidates and roles.',
    icon: Sparkles,
  },
];

function FeatureCards() {
  return (
    <section className="features-section" id="features">
      <div className="features-heading">
        <span className="feature-pill">Powerful Features</span>
        <h2>Everything you need for smart hiring</h2>
        <p>Our AI-powered platform streamlines your recruitment process from start to finish.</p>
      </div>

      <div className="features-grid">
        {FEATURES.map(({ title, description, icon: Icon }) => (
          <article key={title} className="feature-card" data-interactive-card="true">
            <div className="feature-icon">
              <Icon size={22} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeatureCards;
