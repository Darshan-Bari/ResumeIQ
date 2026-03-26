import React, { useEffect, useRef, useState } from 'react';
import '../styles/CandidatePortal.css';
import {
  applyToJob,
  clearAuth,
  deleteCandidateAccount,
  getAppliedJobs,
  getCandidateAvailableJobs,
  getCandidateDashboard,
  saveCandidateProfile,
  uploadResume,
} from '../services/api';

const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000/api').replace(/\/api$/, '');

function CandidatePortal({ setCurrentRole, authState, onAuthUpdate, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState('dashboard');

  const [candidate, setCandidate] = useState(null);
  const [jobListings, setJobListings] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const [profile, setProfile] = useState({
    candidate_id: '',
    candidate_name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    leetcode: '',
    codechef: '',
    codeforces: '',
    skills: [],
    education: [{ degree: '', field: '', year: '' }],
    experience: [{ role: '', company: '', duration: '' }],
    projects: [],
    estimated_experience_years: 0,
  });

  const [skillInput, setSkillInput] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [jobMatchResult, setJobMatchResult] = useState(null);
  const [resumeCandidateName, setResumeCandidateName] = useState('');
  const [uploadLinks, setUploadLinks] = useState({
    github: '',
    leetcode: '',
    codeforces: '',
    codechef: '',
  });
  const fileInputRef = useRef(null);

  const hydrateProfile = (candidateData) => {
    if (!candidateData) {
      return;
    }
    setProfile((prev) => ({
      ...prev,
      candidate_id: candidateData.candidate_id || '',
      candidate_name: candidateData.candidate_name || '',
      email: candidateData.contact?.email || authState?.user?.email || '',
      phone: candidateData.contact?.phone || '',
      linkedin: candidateData.contact?.linkedin || '',
      github: candidateData.coding_profiles?.github || candidateData.contact?.github || '',
      leetcode: candidateData.coding_profiles?.leetcode || '',
      codechef: candidateData.coding_profiles?.codechef || '',
      codeforces: candidateData.coding_profiles?.codeforces || '',
      skills: candidateData.skills?.length ? candidateData.skills : [],
      education: candidateData.education?.length ? candidateData.education : prev.education,
      experience: candidateData.experience?.length ? candidateData.experience : prev.experience,
      projects: candidateData.projects || [],
    }));

    setResumeCandidateName(candidateData.candidate_name || '');
    setUploadLinks({
      github: candidateData.coding_profiles?.github || candidateData.contact?.github || '',
      leetcode: candidateData.coding_profiles?.leetcode || '',
      codeforces: candidateData.coding_profiles?.codeforces || '',
      codechef: candidateData.coding_profiles?.codechef || '',
    });
  };

  const loadDashboardData = async () => {
    if (!authState?.token) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const [dashboardResponse, jobsResponse, appliedResponse] = await Promise.all([
        getCandidateDashboard(authState.token),
        getCandidateAvailableJobs(authState.token),
        getAppliedJobs(authState.token),
      ]);

      const candidateData = dashboardResponse?.candidate || null;
      setCandidate(candidateData);
      hydrateProfile(candidateData);

      setJobListings(jobsResponse?.jobs || []);
      setAppliedJobs(appliedResponse?.applied_jobs || dashboardResponse?.applied_jobs || []);

      if (!candidateData) {
        setViewMode('update-resume');
      } else {
        setViewMode('dashboard');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [authState?.token]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) {
      return;
    }
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, skillInput.trim()],
    }));
    setSkillInput('');
  };

  const handleRemoveSkill = (index) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleAddEducation = () => {
    setProfile((prev) => ({
      ...prev,
      education: [...prev.education, { degree: '', field: '', year: '' }],
    }));
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfile((prev) => ({ ...prev, education: updated }));
  };

  const handleAddExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [...prev.experience, { role: '', company: '', duration: '' }],
    }));
  };

  const handleExperienceChange = (index, field, value) => {
    const updated = [...profile.experience];
    updated[index] = { ...updated[index], [field]: value };
    setProfile((prev) => ({ ...prev, experience: updated }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.candidate_name || !profile.email) {
      setMessage('Name and email are required');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await saveCandidateProfile(profile, authState?.token);
      setMessage('Profile updated successfully');
      setViewMode('dashboard');
      await loadDashboardData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validatePdfFile = (file) => {
    if (!file) {
      return false;
    }
    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const hasPdfMime = file.type === 'application/pdf' || file.type === '';
    return hasPdfExtension && hasPdfMime;
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeCandidateName.trim() || !resumeFile) {
      setMessage('Name and PDF resume are required');
      return;
    }

    if (!validatePdfFile(resumeFile)) {
      setMessage('Only PDF files are allowed');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await uploadResume(
        resumeFile,
        resumeCandidateName.trim(),
        uploadLinks,
        {
          token: authState?.token,
          email: profile.email || authState?.user?.email || '',
        }
      );

      if (response?.auth?.token && response?.auth?.user) {
        onAuthUpdate(response.auth.token, response.auth.user);
      }

      setResumeFile(null);
      setMessage('Resume updated successfully');
      setViewMode('dashboard');
      await loadDashboardData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await applyToJob(jobId, authState?.token);
      const targetJob = jobListings.find((job) => job.job_id === jobId);
      setJobMatchResult({
        jobTitle: targetJob?.job_title || response?.job?.job_title || 'Selected Job',
        score: Number(response?.match_score || 0),
        matchedSkills: Array.isArray(response?.matched_skills) ? response.matched_skills : [],
        missingSkills: Array.isArray(response?.missing_skills) ? response.missing_skills : [],
      });
      setMessage('Applied successfully');
      await loadDashboardData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account and resume permanently?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteCandidateAccount(authState?.token);
      clearAuth();
      onLogout();
      setCurrentRole(null);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const normalized = (status || 'pending').toLowerCase();
    return <span className={`status-badge ${normalized}`}>{normalized}</span>;
  };

  return (
    <div className="candidate-portal">
      <header className="portal-header">
        <h1>ResumeIQ - Candidate Dashboard</h1>
        <div className="candidate-header-actions">
          <button className="back-btn" onClick={() => setCurrentRole(null)}>
            Back to Home
          </button>
          <button className="back-btn" onClick={handleDeleteAccount} disabled={loading}>
            Delete Account
          </button>
          <button className="back-btn" onClick={() => onLogout()}>
            Logout
          </button>
        </div>
      </header>

      <div className="portal-content candidate-dashboard-layout">
        {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

        {viewMode === 'dashboard' && (
          <>
            <section className="dashboard-container">
              <div className="left-section">
                <section className="portal-card dashboard-section profile-summary-card">
                  <div className="section-header-row">
                    <h2>Profile Summary</h2>
                    <button className="btn btn-secondary" onClick={() => setViewMode('edit-profile')}>
                      Edit Profile
                    </button>
                  </div>

                  {candidate ? (
                    <>
                      <div className="profile-grid profile-summary-grid">
                        <p><strong>Name:</strong> {candidate.candidate_name || 'N/A'}</p>
                        <p><strong>Email:</strong> {candidate.contact?.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {candidate.contact?.phone || 'N/A'}</p>
                      </div>

                      <div className="summary-subsection">
                        <h3>Skills</h3>
                        <div className="skills-list">
                          {(candidate.skills || []).length > 0 ? (
                            (candidate.skills || []).slice(0, 12).map((skill) => (
                              <span key={skill} className="skill-tag">{skill}</span>
                            ))
                          ) : (
                            <p className="inline-muted">No skills parsed yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="summary-subsection">
                        <h3>Education</h3>
                        {(candidate.education || []).length > 0 ? (
                          <div className="summary-lines">
                            {(candidate.education || []).slice(0, 3).map((edu, idx) => (
                              <p key={`edu-summary-${idx}`}>
                                {(edu.degree || edu.raw_line || '').trim() || 'Education entry'}
                                {edu.year ? ` • ${edu.year}` : ''}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="inline-muted">No education data available.</p>
                        )}
                      </div>

                      <div className="summary-subsection">
                        <h3>Experience</h3>
                        {(candidate.experience || []).length > 0 ? (
                          <div className="summary-lines">
                            {(candidate.experience || []).slice(0, 3).map((exp, idx) => (
                              <p key={`exp-summary-${idx}`}>
                                {(exp.role || exp.raw_line || '').trim() || 'Experience entry'}
                                {exp.company ? ` @ ${exp.company}` : ''}
                                {exp.duration ? ` (${exp.duration})` : ''}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="inline-muted">No experience data available.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p>Complete your profile to start applying.</p>
                  )}
                </section>

                <section className="portal-card dashboard-section">
                  <div className="section-header-row">
                    <h2>Resume</h2>
                    <button className="btn btn-secondary" onClick={() => setViewMode('update-resume')}>
                      Update Resume
                    </button>
                  </div>
                  {candidate?.resume_file_name ? (
                    <div className="resume-info-box">
                      <p><strong>File:</strong> {candidate.resume_file_name}</p>
                      <p><strong>Last Updated:</strong> {candidate.updated_at ? new Date(candidate.updated_at).toLocaleString() : 'N/A'}</p>
                      <p>
                        <strong>View:</strong>{' '}
                        <a href={`${API_BASE}${candidate.resume_url || ''}`} target="_blank" rel="noopener noreferrer">
                          Open Resume
                        </a>
                      </p>
                    </div>
                  ) : (
                    <p>No resume uploaded yet.</p>
                  )}
                </section>

                <section className="portal-card dashboard-section">
                  <h2>Applied Jobs</h2>
                  {appliedJobs.length === 0 ? (
                    <p>You have not applied to any jobs yet.</p>
                  ) : (
                    <div className="results-list">
                      {appliedJobs.map((item) => (
                        <article className="result-card" key={item.application_id || `${item.job?.job_id}-${item.applied_at}`}>
                          <div className="result-header">
                            <div className="candidate-header-info">
                              <h3>{item.job?.job_title || 'Untitled role'}</h3>
                              <p className="candidate-email">{item.job?.company_name || 'Company not specified'}</p>
                            </div>
                            <div className="score-display">
                              <div className="overall-score">
                                <span className="score-value">{Number(item.match_score || 0).toFixed(2)}%</span>
                                <span className="score-label">Match</span>
                              </div>
                              {renderStatusBadge(item.status)}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="right-section">
                <section className="portal-card dashboard-section">
                  <h2>Recent Job Openings</h2>
                  {jobListings.length === 0 ? (
                    <p>No job listings available.</p>
                  ) : (
                    <div className="results-list job-list">
                      {jobListings.map((job) => (
                        <article className="result-card" key={job.job_id}>
                          <div className="result-header">
                            <div className="candidate-header-info">
                              <h3>{job.job_title || 'Untitled role'}</h3>
                              <p className="candidate-email">{job.company_name || 'Company not specified'}</p>
                            </div>
                            <button
                              className="btn btn-primary"
                              disabled={loading || job.is_applied}
                              onClick={() => handleApply(job.job_id)}
                            >
                              {job.is_applied ? 'Applied' : 'Apply'}
                            </button>
                          </div>
                          <p>{(job.job_description || '').slice(0, 150)}{(job.job_description || '').length > 150 ? '...' : ''}</p>
                          <div className="skills-list">
                            {(job.required_skills || []).slice(0, 6).map((skill) => (
                              <span key={`${job.job_id}-${skill}`} className="skill-tag">{skill}</span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {jobMatchResult ? (
                    <div className="match-score-box" role="status">
                      <p><strong>Last Applied Role:</strong> {jobMatchResult.jobTitle}</p>
                      <p><strong>Match Score:</strong> {jobMatchResult.score.toFixed(2)}%</p>
                      {jobMatchResult.matchedSkills.length > 0 ? (
                        <p><strong>Matched Skills:</strong> {jobMatchResult.matchedSkills.join(', ')}</p>
                      ) : null}
                      {jobMatchResult.missingSkills.length > 0 ? (
                        <p><strong>Skills to Improve:</strong> {jobMatchResult.missingSkills.join(', ')}</p>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              </div>
            </section>
          </>
        )}

        {viewMode === 'edit-profile' && (
          <section className="portal-card dashboard-section">
            <div className="section-header-row">
              <h2>Edit Profile</h2>
              <button className="btn btn-secondary" onClick={() => setViewMode('dashboard')}>
                Back to Dashboard
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="candidate_name" value={profile.candidate_name} onChange={handleProfileChange} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" name="phone" value={profile.phone} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input type="text" name="linkedin" value={profile.linkedin} onChange={handleProfileChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>GitHub</label>
                  <input type="text" name="github" value={profile.github} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label>LeetCode</label>
                  <input type="text" name="leetcode" value={profile.leetcode} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label>Codeforces</label>
                  <input type="text" name="codeforces" value={profile.codeforces} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label>CodeChef</label>
                  <input type="text" name="codechef" value={profile.codechef} onChange={handleProfileChange} />
                </div>
              </div>

              <section className="form-section">
                <h3>Skills</h3>
                <div className="skills-input">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add skill"
                  />
                  <button type="button" onClick={handleAddSkill} className="btn btn-secondary">Add Skill</button>
                </div>
                <div className="skills-list">
                  {profile.skills.map((skill, index) => (
                    <span key={`${skill}-${index}`} className="skill-tag">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(index)}>x</button>
                    </span>
                  ))}
                </div>
              </section>

              <section className="form-section">
                <h3>Education</h3>
                {profile.education.map((edu, index) => (
                  <div key={`edu-${index}`} className="sub-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Degree</label>
                        <input type="text" value={edu.degree || ''} onChange={(e) => handleEducationChange(index, 'degree', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Field</label>
                        <input type="text" value={edu.field || ''} onChange={(e) => handleEducationChange(index, 'field', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Year</label>
                        <input type="text" value={edu.year || ''} onChange={(e) => handleEducationChange(index, 'year', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={handleAddEducation} className="btn btn-secondary">+ Add Education</button>
              </section>

              <section className="form-section">
                <h3>Experience</h3>
                {profile.experience.map((exp, index) => (
                  <div key={`exp-${index}`} className="sub-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Role</label>
                        <input type="text" value={exp.role || ''} onChange={(e) => handleExperienceChange(index, 'role', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Company</label>
                        <input type="text" value={exp.company || ''} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Duration</label>
                        <input type="text" value={exp.duration || ''} onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={handleAddExperience} className="btn btn-secondary">+ Add Experience</button>
              </section>

              <div className="form-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setViewMode('dashboard')}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
              </div>
            </form>
          </section>
        )}

        {viewMode === 'update-resume' && (
          <section className="portal-card dashboard-section">
            <div className="section-header-row">
              <h2>Update Resume</h2>
              <button className="btn btn-secondary" onClick={() => setViewMode(candidate ? 'dashboard' : 'update-resume')}>
                {candidate ? 'Back to Dashboard' : 'Resume Required'}
              </button>
            </div>

            <form onSubmit={handleResumeUpload} className="upload-form">
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  value={resumeCandidateName}
                  onChange={(e) => setResumeCandidateName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Upload Resume (PDF) *</label>
                <div className="file-upload-area">
                  <input
                    ref={fileInputRef}
                    className="hidden-file-input"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    required
                  />
                  <span className="upload-icon">📄</span>
                  <span className="upload-text">{resumeFile ? resumeFile.name : 'Select your PDF resume file'}</span>
                  <button type="button" className="btn btn-secondary choose-file-btn" onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </button>
                </div>
              </div>

              <section className="form-section upload-links-section">
                <h3>Coding Profile Links</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>GitHub</label>
                    <input type="text" value={uploadLinks.github} onChange={(e) => setUploadLinks((prev) => ({ ...prev, github: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>LeetCode</label>
                    <input type="text" value={uploadLinks.leetcode} onChange={(e) => setUploadLinks((prev) => ({ ...prev, leetcode: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Codeforces</label>
                    <input type="text" value={uploadLinks.codeforces} onChange={(e) => setUploadLinks((prev) => ({ ...prev, codeforces: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>CodeChef</label>
                    <input type="text" value={uploadLinks.codechef} onChange={(e) => setUploadLinks((prev) => ({ ...prev, codechef: e.target.value }))} />
                  </div>
                </div>
              </section>

              <div className="form-actions">
                {candidate && (
                  <button className="btn btn-secondary" type="button" onClick={() => setViewMode('dashboard')}>
                    Cancel
                  </button>
                )}
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Uploading...' : 'Update Resume'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

export default CandidatePortal;
