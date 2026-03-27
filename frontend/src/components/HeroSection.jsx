import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Upload, BarChart3, FileText, Briefcase, GraduationCap } from 'lucide-react';

function HeroSection({ onUploadResume, onExploreDashboard }) {
  const heroVisualRef = useRef(null);
  const scoreCardRef = useRef(null);
  const skillsCardRef = useRef(null);
  const fitCardRef = useRef(null);
  const resumePanelRef = useRef(null);
  const [connectorData, setConnectorData] = useState({
    width: 460,
    height: 300,
    paths: [],
    startNodes: [],
    endNodes: [],
  });

  useEffect(() => {
    const updateConnectors = () => {
      const heroVisual = heroVisualRef.current;
      const scoreCard = scoreCardRef.current;
      const skillsCard = skillsCardRef.current;
      const fitCard = fitCardRef.current;
      const resumePanel = resumePanelRef.current;

      if (!heroVisual || !scoreCard || !skillsCard || !fitCard || !resumePanel) {
        return;
      }

      const visualRect = heroVisual.getBoundingClientRect();
      const resumeRect = resumePanel.getBoundingClientRect();

      const getCardTopCenter = (cardRect) => ({
        x: cardRect.left - visualRect.left + cardRect.width / 2,
        y: cardRect.top - visualRect.top,
      });

      const scoreStart = getCardTopCenter(scoreCard.getBoundingClientRect());
      const skillsStart = getCardTopCenter(skillsCard.getBoundingClientRect());
      const fitStart = getCardTopCenter(fitCard.getBoundingClientRect());

      const resumeTop = resumeRect.top - visualRect.top;
      const resumeLeft = resumeRect.left - visualRect.left;
      const resumeWidth = resumeRect.width;

      const endNodes = [0.38, 0.5, 0.62].map((offset) => ({
        x: resumeLeft + resumeWidth * offset,
        y: resumeTop,
      }));

      const starts = [scoreStart, skillsStart, fitStart];

      const paths = starts.map((start, index) => {
        const end = endNodes[index];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const c1x = start.x + dx * 0.24;
        const c1y = start.y + dy * 0.34;
        const c2x = start.x + dx * 0.76;
        const c2y = start.y + dy * 0.72;

        return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
      });

      setConnectorData({
        width: visualRect.width,
        height: visualRect.height,
        paths,
        startNodes: starts,
        endNodes,
      });
    };

    updateConnectors();

    const observer = new ResizeObserver(updateConnectors);
    if (heroVisualRef.current) {
      observer.observe(heroVisualRef.current);
    }

    window.addEventListener('resize', updateConnectors);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateConnectors);
    };
  }, []);

  return (
    <section className="hero-section" id="home">
      <div className="hero-content">
        <span className="hero-pill">AI-Powered Analysis</span>
        <h1 className="hero-brand hero-title">
          Resume<span className="iq-highlight">IQ</span>
        </h1>
        <p className="hero-description">
          Smart AI-powered resume analysis and candidate matching. Transform your hiring
          process with intelligent insights and precision matching.
        </p>

        <div className="hero-cta-row">
          <button className="btn-gradient" type="button" onClick={onUploadResume}>
            <Upload size={17} />
            Upload Resume
            <ArrowRight size={16} />
          </button>
          <button className="btn-glass" type="button" onClick={onExploreDashboard}>
            <BarChart3 size={16} />
            View Insights
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <h3>100+</h3>
            <p>Resumes Analyzed</p>
          </div>
          <div className="stat-item">
            <h3>95%</h3>
            <p>Match Accuracy</p>
          </div>
          <div className="stat-item">
            <h3>50+</h3>
            <p>Companies</p>
          </div>
        </div>
      </div>

      <div className="hero-visual" aria-hidden="true" ref={heroVisualRef}>
        <div className="metric-card score-card floating-soft" ref={scoreCardRef}>
          <div className="score-ring">92%</div>
          <div>
            <p className="metric-label">Match Score</p>
            <p className="metric-value">Excellent</p>
          </div>
        </div>

        <div className="metric-card skills-card floating-mid" ref={skillsCardRef}>
          <p className="metric-title">Skills</p>
          <div className="tag-row">
            <span>Python</span>
            <span>AWS</span>
            <span>Agile</span>
          </div>
        </div>

        <div className="metric-card fit-card floating-fast" ref={fitCardRef}>
          <p className="metric-title">Role Fit</p>
          <div className="fit-row">
            <span>Tech</span>
            <strong>94%</strong>
          </div>
          <div className="fit-row">
            <span>Culture</span>
            <strong>89%</strong>
          </div>
        </div>

        <svg
          className="connector-svg"
          viewBox={`0 0 ${Math.max(connectorData.width, 1)} ${Math.max(connectorData.height, 1)}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="heroConnectorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f7ef7" />
              <stop offset="100%" stopColor="#0ea5b7" />
            </linearGradient>
          </defs>
          {connectorData.paths.map((path, index) => (
            <path key={`connector-path-${index}`} className="connector-path" d={path} />
          ))}

          {connectorData.startNodes.map((node, index) => (
            <circle key={`start-node-${index}`} className="connector-node" cx={node.x} cy={node.y} r="3.5" />
          ))}
          {connectorData.endNodes.map((node, index) => (
            <circle key={`end-node-${index}`} className="connector-node" cx={node.x} cy={node.y} r="3.5" />
          ))}
        </svg>

        <div className="resume-panel" ref={resumePanelRef}>
          <div className="resume-sheet">
            <div className="resume-header-row">
              <div className="resume-icon">
                <FileText size={16} />
              </div>
              <div className="resume-head-text">
                <h4>Alex Morgan</h4>
                <p>Senior Data Analyst</p>
              </div>
            </div>

            <div className="resume-section">
              <div className="resume-section-title">
                <Briefcase size={12} />
                <span>Experience</span>
              </div>
              <div className="resume-lines">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="resume-section">
              <div className="resume-section-title">
                <span>Skills</span>
              </div>
              <div className="resume-skills-row">
                <span>Python</span>
                <span>SQL</span>
                <span>ML</span>
              </div>
            </div>

            <div className="resume-section">
              <div className="resume-section-title">
                <GraduationCap size={12} />
                <span>Education</span>
              </div>
              <div className="resume-edu-lines">
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className="resume-panel-bottom" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
