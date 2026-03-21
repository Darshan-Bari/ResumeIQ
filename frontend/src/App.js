import React, { useEffect, useState } from 'react';
import { Briefcase, Shield, User } from 'lucide-react';
import './styles/App.css';
import CandidatePortal from './pages/CandidatePortal';
import RecruiterPortal from './pages/RecruiterPortal';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RecruiterLoginPage from './pages/RecruiterLoginPage';
import RecruiterSignupPage from './pages/RecruiterSignupPage';
import {
  adminLogin,
  clearAuth,
  getAuthState,
  getJobs,
  getMe,
  login,
  recruiterLogin,
  recruiterSignup,
  signup,
} from './services/api';
import CustomCursor from './components/CustomCursor.jsx';
import GlassCard from './components/GlassCard.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import JobsMarquee from './components/JobsMarquee.jsx';
import BackgroundGradientStrip from './components/BackgroundGradientStrip.jsx';
import FloatingBoxes from './components/FloatingBoxes.jsx';

function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [authState, setAuthState] = useState(() => getAuthState());
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [recruiterAuthMode, setRecruiterAuthMode] = useState('login');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPassword, setRecruiterPassword] = useState('');
  const [recruiterLoading, setRecruiterLoading] = useState(false);
  const [recruiterMessage, setRecruiterMessage] = useState('');
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');

  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  useEffect(() => {
    if (currentRole !== null) {
      return;
    }
    const loadJobs = async () => {
      setJobsLoading(true);
      setJobsError('');
      try {
        const response = await getJobs();
        setJobs(response.jobs || []);
      } catch (error) {
        setJobsError(error.message || 'Unable to load jobs');
      } finally {
        setJobsLoading(false);
      }
    };
    loadJobs();
  }, [currentRole]);

  useEffect(() => {
    const validateSession = async () => {
      if (!authState?.token) {
        return;
      }
      try {
        const me = await getMe(authState.token);
        if (me?.user) {
          setAuthState({ token: authState.token, user: me.user });
        }
      } catch {
        clearAuth();
        setAuthState({ token: '', user: null });
      }
    };
    validateSession();
  }, [authState.token]);

  const handleAuthUpdate = (token, user) => {
    setAuthState({ token, user });
  };

  const handleLogout = () => {
    clearAuth();
    setAuthState({ token: '', user: null });
    setAuthEmail('');
    setAuthPassword('');
    setAuthMessage('');
    setRecruiterEmail('');
    setRecruiterPassword('');
    setRecruiterMessage('');
    setCurrentRole(null);
  };

  const handleCandidateAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');
    try {
      const result = authMode === 'signup'
        ? await signup(authEmail, authPassword)
        : await login(authEmail, authPassword, 'candidate');

      setAuthState({ token: result.token, user: result.user });
      setAuthMessage(result.message || 'Success');
    } catch (error) {
      setAuthMessage(`Error: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');
    try {
      const result = await adminLogin(authEmail, authPassword);
      setAuthState({ token: result.token, user: result.user });
      setAuthMessage(result.message || 'Success');
    } catch (error) {
      setAuthMessage(`Error: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRecruiterAuth = async (e) => {
    e.preventDefault();
    setRecruiterLoading(true);
    setRecruiterMessage('');
    try {
      const result = recruiterAuthMode === 'signup'
        ? await recruiterSignup(recruiterEmail, recruiterPassword)
        : await recruiterLogin(recruiterEmail, recruiterPassword);
      setAuthState({ token: result.token, user: result.user });
      setRecruiterMessage(result.message || 'Success');
    } catch (error) {
      setRecruiterMessage(`Error: ${error.message}`);
    } finally {
      setRecruiterLoading(false);
    }
  };

  const isCandidateAuthed = currentRole === 'candidate' && authState?.token && authState?.user?.role === 'candidate';
  const isAdminAuthed = currentRole === 'admin' && authState?.token && authState?.user?.role === 'admin';
  const isRecruiterAuthed = currentRole === 'recruiter' && authState?.token && authState?.user?.role === 'recruiter';

  return (
    <div className="app">
      <CustomCursor />
      {currentRole === null ? (
        <LandingPage
          setCurrentRole={setCurrentRole}
          jobs={jobs}
          jobsLoading={jobsLoading}
          jobsError={jobsError}
        />
      ) : currentRole === 'candidate' ? (
        isCandidateAuthed ? (
          <CandidatePortal
            setCurrentRole={setCurrentRole}
            authState={authState}
            onAuthUpdate={handleAuthUpdate}
            onLogout={handleLogout}
          />
        ) : (
          authMode === 'signup' ? (
            <SignupPage
              email={authEmail}
              setEmail={setAuthEmail}
              password={authPassword}
              setPassword={setAuthPassword}
              onSubmit={handleCandidateAuth}
              loading={authLoading}
              message={authMessage}
              onBack={() => setCurrentRole(null)}
              onSwitchToLogin={() => {
                setAuthMode('login');
                setAuthMessage('');
              }}
            />
          ) : (
            <LoginPage
              title="Candidate Login"
              subtitle="Access your resume dashboard and profile"
              email={authEmail}
              setEmail={setAuthEmail}
              password={authPassword}
              setPassword={setAuthPassword}
              onSubmit={handleCandidateAuth}
              loading={authLoading}
              message={authMessage}
              onBack={() => setCurrentRole(null)}
              onSwitchToSignup={() => {
                setAuthMode('signup');
                setAuthMessage('');
              }}
              submitLabel="Login"
              showSignupSwitch
            />
          )
        )
      ) : currentRole === 'admin' ? (
        isAdminAuthed ? (
          <AdminDashboard token={authState.token} onLogout={handleLogout} setCurrentRole={setCurrentRole} />
        ) : (
          <LoginPage
            title="Admin Login"
            subtitle="Manage jobs, candidates, and platform stats"
            email={authEmail}
            setEmail={setAuthEmail}
            password={authPassword}
            setPassword={setAuthPassword}
            onSubmit={handleAdminAuth}
            loading={authLoading}
            message={authMessage}
            onBack={() => setCurrentRole(null)}
            submitLabel="Login as Admin"
            showSignupSwitch={false}
          />
        )
      ) : currentRole === 'recruiter' ? (
        isRecruiterAuthed ? (
          <RecruiterPortal
            setCurrentRole={setCurrentRole}
            authState={authState}
            onLogout={handleLogout}
          />
        ) : recruiterAuthMode === 'signup' ? (
          <RecruiterSignupPage
            email={recruiterEmail}
            setEmail={setRecruiterEmail}
            password={recruiterPassword}
            setPassword={setRecruiterPassword}
            onSubmit={handleRecruiterAuth}
            loading={recruiterLoading}
            message={recruiterMessage}
            onBack={() => setCurrentRole(null)}
            onSwitchToLogin={() => {
              setRecruiterAuthMode('login');
              setRecruiterMessage('');
            }}
          />
        ) : (
          <RecruiterLoginPage
            email={recruiterEmail}
            setEmail={setRecruiterEmail}
            password={recruiterPassword}
            setPassword={setRecruiterPassword}
            onSubmit={handleRecruiterAuth}
            loading={recruiterLoading}
            message={recruiterMessage}
            onBack={() => setCurrentRole(null)}
            onSwitchToSignup={() => {
              setRecruiterAuthMode('signup');
              setRecruiterMessage('');
            }}
          />
        )
      ) : (
        <RecruiterPortal setCurrentRole={setCurrentRole} authState={authState} onLogout={handleLogout} />
      )}
    </div>
  );
}

function LandingPage({ setCurrentRole, jobs, jobsLoading, jobsError }) {
  const scrollToCards = () => {
    const section = document.getElementById('our-approach');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="landing" id="home">
      {/* Background elements (behind all content) */}
      <div className="relative overflow-hidden min-h-screen">
        <BackgroundGradientStrip />
        <FloatingBoxes />

        {/* Content layer */}
        <div className="landing-container relative z-10">
          <Navbar />
          <Hero onScrollClick={scrollToCards} />
          <JobsMarquee />

          <section className="approach-section" id="our-approach">
            <GlassCard title="Integrated Project Management" cardType="nodes" />
            <GlassCard title="What Makes Us Unique" cardType="unique" />
          </section>

          <section className="impact-strip" id="impact">
            <div className="impact-item">
              <h3>50K+</h3>
              <p>Resumes screened</p>
            </div>
            <div className="impact-item">
              <h3>92%</h3>
              <p>Faster screening pipeline</p>
            </div>
            <div className="impact-item">
              <h3>100+</h3>
              <p>Hiring teams onboarded</p>
            </div>
          </section>

          <section className="role-selection" id="sectors">
            <h2>Select Your Role</h2>
            <p className="role-description">
              Candidate, Recruiter, or Admin. Existing login, signup, and dashboard flows are unchanged.
            </p>

            <div className="role-cards">
              <div className="role-card candidate-card" onClick={() => setCurrentRole('candidate')} data-interactive-card="true">
                <div className="role-icon"><User size={34} strokeWidth={2} /></div>
                <h3>Candidate</h3>
                <p>Upload your resume and profile information</p>
                <button className="role-button">I&apos;m a Candidate</button>
              </div>

              <div className="role-card recruiter-card" onClick={() => setCurrentRole('recruiter')} data-interactive-card="true">
                <div className="role-icon"><Briefcase size={34} strokeWidth={2} /></div>
                <h3>Recruiter</h3>
                <p>Screen and rank candidates for your roles</p>
                <button className="role-button">I&apos;m a Recruiter</button>
              </div>

              <div className="role-card admin-card" onClick={() => setCurrentRole('admin')} data-interactive-card="true">
                <div className="role-icon"><Shield size={34} strokeWidth={2} /></div>
                <h3>Admin</h3>
                <p>Manage all jobs, candidates, and platform data</p>
                <button className="role-button">Open Admin Panel</button>
              </div>
            </div>
          </section>

          <section className="jobs-section" id="projects">
            <div className="jobs-header">
              <h2>Recent Job Openings</h2>
              <p>Live postings from recruiters using ResumeIQ</p>
            </div>

            {jobsLoading && <div className="jobs-state">Loading latest jobs...</div>}
            {!jobsLoading && jobsError && <div className="jobs-state error">{jobsError}</div>}
            {!jobsLoading && !jobsError && jobs.length === 0 && (
              <div className="jobs-state">No job postings yet. Check back soon.</div>
            )}

            {!jobsLoading && !jobsError && jobs.length > 0 && (
              <div className="jobs-grid">
                {jobs.slice(0, 8).map((job) => (
                  <article key={job.job_id} className="job-card" data-interactive-card="true">
                    <h3>{job.job_title || 'Untitled Role'}</h3>
                    <div className="job-meta">
                      <span>{job.company_name || 'Company not specified'}</span>
                      <span>{job.location || 'Location not specified'}</span>
                    </div>
                    <p>{(job.job_description || '').slice(0, 140)}{(job.job_description || '').length > 140 ? '...' : ''}</p>
                    <div className="job-skills">
                      {(job.required_skills || []).slice(0, 6).map((skill) => (
                        <span key={`${job.job_id}-${skill}`} className="job-skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="job-footer">
                      <small>{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Date unavailable'}</small>
                      <button className="role-button" onClick={() => setCurrentRole('candidate')}>
                        Apply Now
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="people-contact" id="our-people">
            <div className="people-panel" data-interactive-card="true">
              <h3>Our People</h3>
              <p>Hiring specialists, AI engineers, and product leaders collaborate on every role journey.</p>
            </div>
            <div className="contact-panel" id="contact-us" data-interactive-card="true">
              <h3>Contact Us</h3>
              <p>Ready to modernize hiring outcomes with AI assistance?</p>
              <button className="role-button" onClick={() => setCurrentRole('recruiter')}>Let&apos;s Collaborate</button>
            </div>
          </section>

          <footer className="landing-footer">Website made by Darshan Bari</footer>
        </div>
      </div>
    </div>
  );
}

export default App;
