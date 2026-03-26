import React from 'react';
import AuthCard from '../components/AuthCard.jsx';

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
    <AuthCard
      title={title}
      subtitle={subtitle}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onSubmit={onSubmit}
      loading={loading}
      message={message}
      onBack={onBack}
      onSwitch={showSignupSwitch ? onSwitchToSignup : undefined}
      switchLabel={showSignupSwitch ? 'Need an account? Sign up' : ''}
      submitLabel={submitLabel}
      passwordPlaceholder="Enter your password"
      showForgot
    />
  );
}

export default LoginPage;
