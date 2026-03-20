import React from 'react';

function LoginPage({
  title = 'Login',
  subtitle = 'Sign in to continue',
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  message,
  onBack,
  onSwitchToSignup,
  submitLabel = 'Login',
  showSignupSwitch = true,
}) {
  return (
    <div className="candidate-portal">
      <header className="portal-header">
        <h1>{title}</h1>
        <button className="back-btn" onClick={onBack}>Back to Home</button>
      </header>

      <div className="portal-content auth-shell">
        <div className="portal-card auth-card">
          <h2>{title}</h2>
          <p className="step-description">{subtitle}</p>

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
                placeholder="Enter password"
                required
              />
            </div>

            {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : submitLabel}
            </button>
          </form>

          {showSignupSwitch && (
            <div className="auth-switch-row" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" type="button" onClick={onSwitchToSignup}>
                Need an account? Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
