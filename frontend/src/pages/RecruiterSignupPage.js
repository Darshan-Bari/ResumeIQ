import React from 'react';

function RecruiterSignupPage({
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
        <h1>Recruiter Signup</h1>
        <button className="back-btn" onClick={onBack}>Back to Home</button>
      </header>

      <div className="portal-content auth-shell">
        <div className="portal-card auth-card">
          <h2>Create Recruiter Account</h2>
          <p className="step-description">Sign up to create jobs and review candidates</p>

          <form className="profile-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recruiter@example.com"
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
              {loading ? 'Please wait...' : 'Create Recruiter Account'}
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

export default RecruiterSignupPage;
