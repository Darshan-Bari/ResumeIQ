import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import EyeAnimation from './EyeAnimation.jsx';

function AuthCard({
  title,
  subtitle,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  message,
  onBack,
  onSwitch,
  switchLabel,
  submitLabel,
  passwordPlaceholder,
  minPasswordLength,
  showForgot,
}) {
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-page-shell">
      <div className="auth-bg-blob auth-blob-left" />
      <div className="auth-bg-blob auth-blob-right" />

      <div className="auth-card-surface" data-interactive-card="true">
        <div className="auth-brand-row">
          <div className="brand-mark">R</div>
          <span>ResumeIQ</span>
        </div>

        <EyeAnimation closed={passwordFocused} />

        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <Mail size={18} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder={passwordPlaceholder}
              minLength={minPasswordLength}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {showForgot && <button className="forgot-link" type="button">Forgot password?</button>}

          {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

          <button className="btn-gradient full-width" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : submitLabel}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {switchLabel && onSwitch && (
          <div className="auth-switch-text">
            <button type="button" className="switch-link" onClick={onSwitch}>
              {switchLabel}
            </button>
          </div>
        )}
      </div>

      <button className="back-home-link" type="button" onClick={onBack}>
        <ArrowLeft size={15} />
        Back to home
      </button>
    </div>
  );
}

export default AuthCard;
