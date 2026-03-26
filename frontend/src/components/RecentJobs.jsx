import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { applyToRecentJob, getRecentJobs } from '../services/api';

const TOKEN_KEY = 'resumeiq-token';
const USER_KEY = 'resumeiq-user';
const REDIRECT_JOB_KEY = 'redirectJobId';

const readStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

function RecentJobs({ authState, onRequireLogin }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingMap, setApplyingMap] = useState({});

  const authContext = useMemo(() => {
    const token = authState?.token || localStorage.getItem(TOKEN_KEY) || '';
    const user = authState?.user || readStoredUser();
    return {
      token,
      user,
      isAuthenticated: Boolean(token || user),
      userId: user?.user_id || '',
    };
  }, [authState?.token, authState?.user]);

  const loadRecentJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getRecentJobs();
      setJobs(Array.isArray(response?.jobs) ? response.jobs : []);
    } catch (err) {
      setError(err.message || 'Unable to load recent job openings right now.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentJobs();
  }, []);

  const handleApply = useCallback(async (jobId, forceAuthContext = null) => {
    const currentAuth = forceAuthContext || authContext;
    if (!currentAuth.isAuthenticated) {
      localStorage.setItem(REDIRECT_JOB_KEY, jobId);
      setError('Please login to apply for jobs. Redirecting to login...');
      if (typeof onRequireLogin === 'function') {
        onRequireLogin();
      }
      return;
    }

    if (!currentAuth.userId) {
      setError('Unable to identify your account. Please login again and retry.');
      return;
    }

    setApplyingMap((prev) => ({ ...prev, [jobId]: true }));
    try {
      const response = await applyToRecentJob(jobId, currentAuth.userId, currentAuth.token);
      const latestApplicants = Number(response?.applicants || 0);
      const matchResult = {
        score: Number(response?.match_score || 0),
        matchedSkills: Array.isArray(response?.matched_skills) ? response.matched_skills : [],
        missingSkills: Array.isArray(response?.missing_skills) ? response.missing_skills : [],
      };
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                applicants: latestApplicants,
                hasApplied: true,
                matchResult,
              }
            : job
        )
      );
      localStorage.removeItem(REDIRECT_JOB_KEY);
    } catch (err) {
      setError(err.message || 'Could not submit your application. Please try again.');
    } finally {
      setApplyingMap((prev) => ({ ...prev, [jobId]: false }));
    }
  }, [authContext, onRequireLogin]);

  useEffect(() => {
    const redirectJobId = localStorage.getItem(REDIRECT_JOB_KEY);
    if (!redirectJobId || !authContext.isAuthenticated || !authContext.userId || jobs.length === 0) {
      return;
    }

    const targetJob = jobs.find((job) => job.id === redirectJobId);
    if (!targetJob || targetJob.hasApplied || applyingMap[redirectJobId]) {
      localStorage.removeItem(REDIRECT_JOB_KEY);
      return;
    }

    handleApply(redirectJobId, authContext);
  }, [applyingMap, authContext, handleApply, jobs]);

  return (
    <section className="recent-jobs-section" id="recent-jobs">
      <div className="recent-jobs-header">
        <h2>Recent Job Openings</h2>
        <p>Fresh roles posted by recruiters across top teams.</p>
      </div>

      {error ? (
        <div className="recent-jobs-alert" role="status">
          <span>{error}</span>
          <button type="button" className="recent-jobs-retry" onClick={loadRecentJobs}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <p className="recent-jobs-empty">Loading recent roles...</p> : null}

      {!loading && !error && jobs.length === 0 ? (
        <p className="recent-jobs-empty">No recent openings yet. Check back soon for new roles.</p>
      ) : null}

      {!loading && jobs.length > 0 ? (
        <div className="recent-jobs-grid">
          {jobs.map((job) => {
            const isApplying = Boolean(applyingMap[job.id]);
            return (
              <article className="recent-job-card" key={job.id}>
                <h3>{job.title}</h3>
                <p className="recent-job-company">{job.company}</p>

                <div className="recent-job-skills">
                  {(job.skills || []).map((skill) => (
                    <span key={`${job.id}-${skill}`}>{skill}</span>
                  ))}
                </div>

                <div className="recent-job-footer">
                  <p>{job.applicants} applicants</p>
                  <button
                    type="button"
                    className="apply-btn"
                    onClick={() => handleApply(job.id)}
                    disabled={isApplying || job.hasApplied}
                  >
                    {job.hasApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply'}
                  </button>
                </div>

                {job.matchResult ? (
                  <div className="match-result" role="status">
                    <p>
                      <strong>Match Score:</strong> {Math.round(job.matchResult.score)}%
                    </p>
                    <p>
                      <strong>Matched Skills:</strong>{' '}
                      {job.matchResult.matchedSkills.length > 0 ? (
                        <span className="match-skills match-skills-good">
                          {job.matchResult.matchedSkills.join(', ')}
                        </span>
                      ) : (
                        <span className="match-skills">No strong matches yet</span>
                      )}
                    </p>
                    <p>
                      <strong>Skills to Improve:</strong>{' '}
                      {job.matchResult.missingSkills.length > 0 ? (
                        <span className="match-skills match-skills-missing">
                          {job.matchResult.missingSkills.join(', ')}
                        </span>
                      ) : (
                        <span className="match-skills match-skills-good">None. Great fit!</span>
                      )}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default RecentJobs;
