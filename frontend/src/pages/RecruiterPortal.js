import React, { useEffect, useState } from 'react';
import '../styles/RecruiterPortal.css';
import {
  createJob,
  getAllCandidates,
  getRecruiterDashboard,
  matchCandidates,
  updateCandidateShortlist,
  updateCandidateStatus,
} from '../services/api';

const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000/api').replace(/\/api$/, '');

const toClickableLink = (value) => {
  const raw = (value || '').trim();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  return `https://${raw}`;
};

function RecruiterPortal({ setCurrentRole, authState, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [scoreFilter, setScoreFilter] = useState('0');

  const [job, setJob] = useState({
    job_title: '',
    company_name: '',
    location: '',
    job_description: '',
    required_skills: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const recruiterApproved = Boolean(authState?.user?.is_approved);

  const loadDashboard = async () => {
    if (!authState?.token) {
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const [dashboard, candidatesResponse] = await Promise.all([
        getRecruiterDashboard(authState.token),
        getAllCandidates(),
      ]);
      setJobs(dashboard.jobs || []);
      setAllCandidates(candidatesResponse.candidates || []);
      if (!selectedJobId && dashboard.jobs?.length) {
        setSelectedJobId(dashboard.jobs[0].job.job_id);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [authState?.token]);

  const handleJobChange = (e) => {
    const { name, value } = e.target;
    setJob((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setJob((prev) => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index) => {
    setJob((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index),
    }));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!recruiterApproved) {
      setMessage('Your account is under review');
      return;
    }
    if (!job.job_title || !job.job_description) {
      setMessage('Error: Job title and description are required');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await createJob(job, authState.token);
      setJob({
        job_title: '',
        company_name: '',
        location: '',
        job_description: '',
        required_skills: [],
      });
      setSkillInput('');
      setMessage('Job created successfully');
      await loadDashboard();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateToggle = (candidateId) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId));
    } else {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    }
  };

  const handleSaveCandidatesForJob = async () => {
    if (!recruiterApproved) {
      setMessage('Your account is under review');
      return;
    }
    if (!selectedJobId) {
      setMessage('Error: Select a job first');
      return;
    }
    if (selectedCandidates.length === 0) {
      setMessage('Error: Select at least one candidate');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await matchCandidates(selectedJobId, selectedCandidates);
      setMessage('Candidates saved for this job');
      setSelectedCandidates([]);
      await loadDashboard();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetStatus = async (jobId, candidateId, status) => {
    if (!recruiterApproved) {
      setMessage('Your account is under review');
      return;
    }
    try {
      await updateCandidateStatus(jobId, candidateId, status, authState.token);
      setMessage(`Candidate marked as ${status}`);
      await loadDashboard();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleToggleShortlist = async (jobId, candidateId, shortlisted) => {
    if (!recruiterApproved) {
      setMessage('Your account is under review');
      return;
    }
    try {
      await updateCandidateShortlist(jobId, candidateId, !shortlisted, authState.token);
      setMessage(!shortlisted ? 'Candidate shortlisted' : 'Candidate removed from shortlist');
      await loadDashboard();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const renderStatusBadge = (status) => {
    const normalized = (status || 'pending').toLowerCase();
    return <span className={`status-badge ${normalized}`}>{normalized}</span>;
  };

  return (
    <div className="recruiter-portal">
      <header className="portal-header">
        <h1>ResumeIQ - Recruiter Dashboard</h1>
        <div className="candidate-header-actions">
          <button className="back-btn" onClick={() => setCurrentRole(null)}>Back to Home</button>
          <button className="back-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="portal-content full-width">
        <div className="results-container">
          {!recruiterApproved && (
            <div className="message error" style={{ marginBottom: 20 }}>
              Your account is under review
            </div>
          )}

          <div className="portal-card" style={{ marginBottom: 20 }}>
            <h2>Create Job</h2>
            <form onSubmit={handleCreateJob} className="job-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Job Title *</label>
                  <input type="text" name="job_title" value={job.job_title} onChange={handleJobChange} required />
                </div>
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" name="company_name" value={job.company_name} onChange={handleJobChange} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" value={job.location} onChange={handleJobChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Job Description *</label>
                <textarea name="job_description" value={job.job_description} onChange={handleJobChange} rows="5" required />
              </div>

              <div className="form-group">
                <label>Required Skills</label>
                <div className="skills-input">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add skill"
                  />
                  <button type="button" onClick={handleAddSkill} className="btn btn-secondary">Add</button>
                </div>
                <div className="skills-list">
                  {job.required_skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(index)}>x</button>
                    </span>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Job'}
              </button>
            </form>
          </div>

          <div className="portal-card" style={{ marginBottom: 20 }}>
            <h2>Attach Candidates to Job</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Select Job</label>
                <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
                  <option value="">Choose job</option>
                  {jobs.map((entry) => (
                    <option key={entry.job.job_id} value={entry.job.job_id}>
                      {entry.job.job_title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="candidates-list">
              {allCandidates.map((candidate) => (
                <div key={candidate.candidate_id} className="candidate-item">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.candidate_id)}
                    onChange={() => handleCandidateToggle(candidate.candidate_id)}
                  />
                  <div className="candidate-info-compact">
                    <h4>{candidate.candidate_name}</h4>
                    <p>{candidate.contact?.email || 'No email'}</p>
                    <div className="skills-preview">
                      {(candidate.skills || []).slice(0, 5).map((skill) => (
                        <span key={`${candidate.candidate_id}-${skill}`} className="skill-badge">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-primary" onClick={handleSaveCandidatesForJob} disabled={loading}>
              {loading ? 'Saving...' : 'Save Candidates for Job'}
            </button>
          </div>

          <div className="portal-card">
            <h2>My Jobs and Candidates</h2>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Filter Candidates By Minimum Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                />
              </div>
            </div>
            {loading && <p>Loading...</p>}
            {!loading && jobs.length === 0 && <p>No jobs created yet.</p>}

            {!loading && jobs.map((entry) => (
              <div key={entry.job.job_id} className="detail-section" style={{ marginBottom: 16 }}>
                <h4>{entry.job.job_title}</h4>
                <p><strong>Company:</strong> {entry.job.company_name || 'N/A'}</p>
                <p><strong>Location:</strong> {entry.job.location || 'N/A'}</p>
                <p><strong>Description:</strong> {entry.job.job_description}</p>
                <p><strong>Total Candidates:</strong> {entry.candidates.length}</p>

                <div style={{ marginTop: 10 }}>
                  <strong>Candidates:</strong>
                  {entry.candidates.length === 0 && <p>No candidates attached to this job yet.</p>}
                  {entry.candidates
                    .filter((candidate) => Number(candidate.match_score || 0) >= Number(scoreFilter || 0))
                    .map((candidate) => (
                    <div key={candidate.candidate_id} className="sub-form candidate-record-card" style={{ marginTop: 10 }}>
                      <div className="candidate-record-head">
                        <p><strong>Rank:</strong> #{candidate.rank || '-'}</p>
                        <p><strong>Name:</strong> {candidate.candidate_name || 'N/A'}</p>
                        <p><strong>Email:</strong> {candidate.contact?.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {candidate.contact?.phone || 'N/A'}</p>
                      </div>
                      <p><strong>Match Score:</strong> {Number(candidate.match_score || 0).toFixed(2)}%</p>
                      <div className="progress-bar" style={{ marginBottom: 8 }}>
                        <div
                          className="progress-fill skill-bar"
                          style={{ width: `${Math.max(0, Math.min(100, Number(candidate.match_score || 0)))}%` }}
                        />
                      </div>
                      <p><strong>Status:</strong> {renderStatusBadge(candidate.status)}</p>
                      <p><strong>Skills:</strong> {(candidate.skills || []).join(', ') || 'N/A'}</p>
                      <div className="skill-list" style={{ marginBottom: 10 }}>
                        {(candidate.matched_skills || []).map((skill) => (
                          <span key={`${candidate.candidate_id}-m-${skill}`} className="skill-badge matched">{skill}</span>
                        ))}
                        {(candidate.missing_skills || []).map((skill) => (
                          <span key={`${candidate.candidate_id}-x-${skill}`} className="skill-badge missing">{skill}</span>
                        ))}
                      </div>
                      <p><strong>Education:</strong> {(candidate.education || []).map((e) => e.degree || e.raw_line || '').filter(Boolean).join(', ') || 'N/A'}</p>
                      <p><strong>Experience:</strong> {(candidate.experience || []).map((e) => e.role || e.raw_line || '').filter(Boolean).join(', ') || 'N/A'}</p>

                      {candidate.resume_url && (
                        <p>
                          <strong>Resume PDF:</strong>{' '}
                          <a href={`${API_BASE}${candidate.resume_url}`} target="_blank" rel="noopener noreferrer">Open Resume</a>
                        </p>
                      )}

                      <div className="coding-links" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {toClickableLink(candidate.coding_profiles?.github) && (
                          <a href={toClickableLink(candidate.coding_profiles.github)} target="_blank" rel="noopener noreferrer">GitHub</a>
                        )}
                        {toClickableLink(candidate.coding_profiles?.leetcode) && (
                          <a href={toClickableLink(candidate.coding_profiles.leetcode)} target="_blank" rel="noopener noreferrer">LeetCode</a>
                        )}
                        {toClickableLink(candidate.coding_profiles?.codeforces) && (
                          <a href={toClickableLink(candidate.coding_profiles.codeforces)} target="_blank" rel="noopener noreferrer">Codeforces</a>
                        )}
                        {toClickableLink(candidate.coding_profiles?.codechef) && (
                          <a href={toClickableLink(candidate.coding_profiles.codechef)} target="_blank" rel="noopener noreferrer">CodeChef</a>
                        )}
                      </div>

                      <div className="candidate-action-row">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleSetStatus(entry.job.job_id, candidate.candidate_id, 'selected')}
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleSetStatus(entry.job.job_id, candidate.candidate_id, 'rejected')}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleToggleShortlist(entry.job.job_id, candidate.candidate_id, Boolean(candidate.shortlisted))}
                        >
                          {candidate.shortlisted ? 'Remove Shortlist' : 'Shortlist'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}
        </div>
      </div>
    </div>
  );
}

export default RecruiterPortal;
