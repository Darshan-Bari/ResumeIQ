import React from 'react';

function SignupPage({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  message,
  onBack,
  onSwitchToLogin,
}) {
  return (
    <div className="candidate-portal">
      <header className="portal-header">
        <h1>Candidate Signup</h1>
        <button className="back-btn" onClick={onBack}>Back to Home</button>
      </header>

      <div className="portal-content auth-shell">
        <div className="portal-card auth-card">
          <h2>Create Account</h2>
          <p className="step-description">Create your ResumeIQ candidate account</p>

          <form className="profile-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch-row" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" type="button" onClick={onSwitchToLogin}>
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
