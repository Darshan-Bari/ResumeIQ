import React from 'react';

function RecruiterLoginPage({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  message,
  onBack,
  onSwitchToSignup,
}) {
  return (
    <div className="candidate-portal">
      <header className="portal-header">
        <h1>Recruiter Login</h1>
        <button className="back-btn" onClick={onBack}>Back to Home</button>
      </header>

      <div className="portal-content auth-shell">
        <div className="portal-card auth-card">
          <h2>Welcome Recruiter</h2>
          <p className="step-description">Login to manage jobs and review candidates</p>

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
                placeholder="Enter password"
                required
              />
            </div>

            {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Login'}
            </button>
          </form>

          <div className="auth-switch-row" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" type="button" onClick={onSwitchToSignup}>
              New recruiter? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruiterLoginPage;
