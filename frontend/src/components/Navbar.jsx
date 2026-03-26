import React from 'react';

function Navbar({ onHome, onFeatures, onDashboard, onLogin, onRecruiterLogin, onSignup }) {
  return (
    <header className="landing-navbar" data-interactive-card="true">
      <div className="brand-wrap" aria-label="ResumeIQ logo and title">
        <div className="brand-mark">R</div>
        <h2>Resume<span>IQ</span></h2>
      </div>

      <nav className="landing-nav-links" aria-label="Primary navigation">
        <button type="button" onClick={onHome}>Home</button>
        <button type="button" onClick={onFeatures}>Features</button>
        <button type="button" onClick={onDashboard}>Dashboard</button>
        <button type="button" onClick={onLogin}>Login</button>
        <button type="button" className="recruiter-btn" onClick={onRecruiterLogin}>Recruiter Login</button>
      </nav>

      <button type="button" className="btn-gradient nav-signup-btn" onClick={onSignup}>
        Sign Up
      </button>
    </header>
  );
}

export default Navbar;
