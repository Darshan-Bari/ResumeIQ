import React from 'react';
import AuthCard from '../components/AuthCard.jsx';

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
    <AuthCard
      title="Welcome Recruiter"
      subtitle="Login to manage jobs and review candidates"
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onSubmit={onSubmit}
      loading={loading}
      message={message}
      onBack={onBack}
      onSwitch={onSwitchToSignup}
      switchLabel="New recruiter? Sign up"
      submitLabel="Login"
      passwordPlaceholder="Enter your password"
      showForgot
    />
  );
}

export default RecruiterLoginPage;
