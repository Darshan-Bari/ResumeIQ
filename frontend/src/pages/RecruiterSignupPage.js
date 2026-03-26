import React from 'react';
import AuthCard from '../components/AuthCard.jsx';

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
    <AuthCard
      title="Create Recruiter Account"
      subtitle="Sign up to create jobs and review candidates"
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onSubmit={onSubmit}
      loading={loading}
      message={message}
      onBack={onBack}
      onSwitch={onSwitchToLogin}
      switchLabel="Already have an account? Login"
      submitLabel="Create Recruiter Account"
      passwordPlaceholder="Minimum 6 characters"
      minPasswordLength={6}
      showForgot={false}
    />
  );
}

export default RecruiterSignupPage;
