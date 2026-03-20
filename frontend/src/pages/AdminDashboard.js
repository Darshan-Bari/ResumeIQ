import React, { useEffect, useState } from 'react';
import {
  approveAdminRecruiter,
  deleteAdminRecruiter,
  deleteAdminCandidate,
  deleteAdminJob,
  getAdminCandidates,
  getAdminJobs,

} 

function AdminDashboard({ token, onLogout, setCurrentRole }) {
  const [stats, setStats] = useState({ total_candidates: 0, total_jobs: 0, total_users: 0 });
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadAdminData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const [overview, candidateData, jobData, recruiterData] = await Promise.all([
        getAdminOverview(token),
        getAdminCandidates(token),
        getAdminJobs(token),
        getAdminRecruiters(token),
      ]);

      setStats(overview.stats || { total_candidates: 0, total_jobs: 0, total_users: 0 });
      setCandidates(candidateData.candidates || []);
      setJobs(jobData.jobs || []);
      // setRecruiters(recruiterData.recruiters || []);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm('Delete this candidate account and resume?')) {
      return;
    }

    try {
      await deleteAdminCandidate(candidateId, token);
      setMessage('Candidate deleted');
      await loadAdminData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) {
      return;
    }

    try {
      await deleteAdminJob(jobId, token);
      setMessage('Job deleted');
      await loadAdminData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleApproveRecruiter = async (recruiterId) => {
    try {
      await approveAdminRecruiter(recruiterId, token);
      setMessage('Recruiter approved');
      await loadAdminData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleDeleteRecruiter = async (recruiterId) => {
    if (!window.confirm('Delete this recruiter account and all jobs created by this recruiter?')) {
      return;
    }

    try {
      await deleteAdminRecruiter(recruiterId, token);
      setMessage('Recruiter deleted');
      await loadAdminData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="recruiter-portal">
      <header className="portal-header">
        <h1>ResumeIQ - Admin Panel</h1>
        <div className="candidate-header-actions">
          <button className="back-btn" onClick={() => setCurrentRole(null)}>
            Back to Home
          </button>
          <button className="back-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="portal-content full-width">
        <div className="results-container">
          <div className="results-header">
            <h2>System Overview</h2>
            <p className="results-count">Manage candidates, jobs, and platform health.</p>
          </div>

          <div className="features-grid" style={{ marginBottom: 24 }}>
            <div className="feature"><h4>Total Users</h4><p>{stats.total_users}</p></div>
            <div className="feature"><h4>Total Candidates</h4><p>{stats.total_candidates}</p></div>
            <div className="feature"><h4>Total Jobs</h4><p>{stats.total_jobs}</p></div>
          </div>

          {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}
          {loading && <div className="message">Loading admin data...</div>}

          <section className="portal-card" style={{ marginBottom: 24 }}>
            <h3>Recruiters</h3>
            {recruiters.length === 0 ? (
              <p>No recruiters available.</p>
            ) : (
              <div className="results-list">
                {recruiters.map((recruiter) => (
                  <article className="result-card" key={recruiter.user_id}>
                    <div className="result-header">
                      <div className="candidate-header-info">
                        <h3>{recruiter.email}</h3>
                        <p className="candidate-email">Approval: {recruiter.is_approved ? 'Approved' : 'Pending'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {!recruiter.is_approved && (
                          <button className="btn btn-primary" onClick={() => handleApproveRecruiter(recruiter.user_id)}>
                            Approve
                          </button>
                        )}
                        <button className="btn btn-secondary" onClick={() => handleDeleteRecruiter(recruiter.user_id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="portal-card" style={{ marginBottom: 24 }}>
            <h3>Job Postings</h3>
            {jobs.length === 0 ? (
              <p>No jobs available.</p>
            ) : (
              <div className="results-list">
                {jobs.map((job) => (
                  <article className="result-card" key={job.job_id}>
                    <div className="result-header">
                      <div className="candidate-header-info">
                        <h3>{job.job_title || 'Untitled job'}</h3>
                        <p className="candidate-email">{job.company_name || 'No company'} | {job.location || 'No location'}</p>
                      </div>
                      <button className="btn btn-secondary" onClick={() => handleDeleteJob(job.job_id)}>
                        Delete
                      </button>
                    </div>
                    <p>{(job.job_description || '').slice(0, 200)}{(job.job_description || '').length > 200 ? '...' : ''}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="portal-card">
            <h3>Candidates</h3>
            {candidates.length === 0 ? (
              <p>No candidates available.</p>
            ) : (
              <div className="results-list">
                {candidates.map((candidate) => (
                  <article className="result-card" key={candidate.candidate_id}>
                    <div className="result-header">
                      <div className="candidate-header-info">
                        <h3>{candidate.candidate_name || 'Unnamed candidate'}</h3>
                        <p className="candidate-email">{candidate.contact?.email || 'No email'}</p>
                      </div>
                      <button className="btn btn-secondary" onClick={() => handleDeleteCandidate(candidate.candidate_id)}>
                        Delete
                      </button>
                    </div>

                    <p><strong>Phone:</strong> {candidate.contact?.phone || 'N/A'}</p>
                    <p><strong>GitHub:</strong> {candidate.contact?.github || 'N/A'}</p>
                    <p><strong>LeetCode:</strong> {candidate.coding_profiles?.leetcode || 'N/A'}</p>
                    <p><strong>Codeforces:</strong> {candidate.coding_profiles?.codeforces || 'N/A'}</p>
                    <p><strong>CodeChef:</strong> {candidate.coding_profiles?.codechef || 'N/A'}</p>
                    <p><strong>Skills:</strong> {(candidate.skills || []).join(', ') || 'N/A'}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
