import React, { useEffect, useState } from 'react';
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
import Navbar from './components/Navbar.jsx';
import HeroSection from './components/HeroSection.jsx';
import RecentJobs from './components/RecentJobs.jsx';
import FeatureCards from './components/FeatureCards.jsx';

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
      {currentRole === null ? (
        <LandingPage
          setCurrentRole={setCurrentRole}
          setAuthMode={setAuthMode}
          authState={authState}
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
              title="Welcome Back"
              subtitle="Sign in to your ResumeIQ candidate account"
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

function LandingPage({ setCurrentRole, setAuthMode, authState, jobs }) {
  const scrollToId = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openCandidateLogin = () => {
    setAuthMode('login');
    setCurrentRole('candidate');
  };

  const openCandidateSignup = () => {
    setAuthMode('signup');
    setCurrentRole('candidate');
  };

  const previewDashboard = () => {
    if (jobs.length > 0) {
      scrollToId('features');
      return;
    }
    openCandidateLogin();
  };

  return (
    <div className="landing-page" id="home">
      <div className="landing-gradient landing-gradient-left" />
      <div className="landing-gradient landing-gradient-right" />

      <div className="landing-layout">
        <Navbar
          onHome={() => scrollToId('home')}
          onFeatures={() => scrollToId('features')}
          onDashboard={previewDashboard}
          onLogin={openCandidateLogin}
          onRecruiterLogin={() => setCurrentRole('recruiter')}
          onSignup={openCandidateSignup}
        />

        <HeroSection
          onUploadResume={openCandidateSignup}
          onExploreDashboard={previewDashboard}
        />

        <RecentJobs authState={authState} onRequireLogin={openCandidateLogin} />

        <FeatureCards />

        <footer className="landing-footer-actions">
          <span>Need recruiter or admin access?</span>
          <div>
            <button type="button" onClick={() => setCurrentRole('recruiter')}>Recruiter Login</button>
            <button type="button" onClick={() => setCurrentRole('admin')}>Admin Login</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
