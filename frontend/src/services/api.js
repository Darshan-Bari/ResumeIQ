/**
 * API Service
 * Handles all backend API calls and auth token persistence.
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
// const API_BASE_URL = "http://127.0.0.1:5000";
console.log("API_BASE_URL:", API_BASE_URL);
const TOKEN_KEY = 'resumeiq-token';
const USER_KEY = 'resumeiq-user';

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const buildHeaders = (token, hasJsonBody = true) => {
  const headers = {};
  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(body.error || 'Request failed');
  }
  return body;
};

export const saveAuth = (token, user) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getAuthState = () => {
  const token = localStorage.getItem(TOKEN_KEY) || '';
  const userRaw = localStorage.getItem(USER_KEY);
  let user = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      user = null;
    }
  }
  return { token, user };
};

// ============ AUTH ENDPOINTS ============

export const signup = async (email, password) => {
  const data = await request('/api/signup', {
    method: 'POST',
    headers: buildHeaders('', true),
    body: JSON.stringify({ email, password }),
  });
  if (data.token && data.user) {
    saveAuth(data.token, data.user);
  }
  return data;
};

export const login = async (email, password, role = '') => {
  const data = await request('/api/login', {
    method: 'POST',
    headers: buildHeaders('', true),
    body: JSON.stringify({ email, password, role: role || undefined }),
  });
  if (data.token && data.user) {
    saveAuth(data.token, data.user);
  }
  return data;
};

export const adminLogin = async (email, password) => {
  const data = await request('/api/admin/login', {
    method: 'POST',
    headers: buildHeaders('', true),
    body: JSON.stringify({ email, password }),
  });
  if (data.token && data.user) {
    saveAuth(data.token, data.user);
  }
  return data;
};

export const getMe = async (token) => {
  return await request('/api/auth/me', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

// ============ CANDIDATE ENDPOINTS ============

export const uploadResume = async (file, candidateName, codingProfiles = {}, authPayload = {}) => {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('candidate_name', candidateName);
  formData.append('github', codingProfiles.github || '');
  formData.append('leetcode', codingProfiles.leetcode || '');
  formData.append('codeforces', codingProfiles.codeforces || '');
  formData.append('codechef', codingProfiles.codechef || '');
  if (authPayload.email) {
    formData.append('email', authPayload.email);
  }
  if (authPayload.password) {
    formData.append('password', authPayload.password);
  }

  const response = await fetch(`${API_BASE_URL}/api/candidate/upload-resume`, {
    method: 'POST',
    headers: authPayload.token ? { Authorization: `Bearer ${authPayload.token}` } : {},
    body: formData,
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload resume');
  }

  if (data?.auth?.token && data?.auth?.user) {
    saveAuth(data.auth.token, data.auth.user);
  }

  return data;
};

export const saveCandidateProfile = async (profileData, token) => {
  return await request('/api/candidate/profile', {
    method: 'PUT',
    headers: buildHeaders(token, true),
    body: JSON.stringify(profileData),
  });
};

export const getCandidateDashboard = async (token) => {
  return await request('/api/candidate/dashboard', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

export const getCandidateAvailableJobs = async (token) => {
  return await request('/api/candidate/jobs', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

export const applyToJob = async (jobId, token) => {
  return await request(`/api/candidate/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: buildHeaders(token, false),
  });
};

export const getAppliedJobs = async (token) => {
  return await request('/api/candidate/applied-jobs', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

export const deleteCandidateAccount = async (token) => {
  return await request('/api/candidate/account', {
    method: 'DELETE',
    headers: buildHeaders(token, false),
  });
};

// ============ RECRUITER ENDPOINTS ============

export const createJob = async (jobData, token = '') => {
  return await request('/api/recruiter/job/create', {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(jobData),
  });
};

export const getJobs = async () => {
  return await request('/api/recruiter/jobs', { method: 'GET' });
};

export const matchCandidates = async (jobId, candidateIds = null, jobData = null) => {
  const payload = { job_id: jobId };
  if (candidateIds) {
    payload.candidate_ids = candidateIds;
  }
  if (jobData) {
    payload.job_description = jobData.job_description;
    payload.required_skills = jobData.required_skills;
  }

  return await request('/api/recruiter/job/match', {
    method: 'POST',
    headers: buildHeaders(getAuthState().token, true),
    body: JSON.stringify(payload),
  });
};

export const recruiterSignup = async (email, password) => {
  const data = await request('/api/recruiter/signup', {
    method: 'POST',
    headers: buildHeaders('', true),
    body: JSON.stringify({ email, password }),
  });
  if (data.token && data.user) {
    saveAuth(data.token, data.user);
  }
  return data;
};

export const recruiterLogin = async (email, password) => {
  const data = await request('/api/recruiter/login', {
    method: 'POST',
    headers: buildHeaders('', true),
    body: JSON.stringify({ email, password }),
  });
  if (data.token && data.user) {
    saveAuth(data.token, data.user);
  }
  return data;
};

export const getRecruiterDashboard = async (token) => {
  return await request('/api/recruiter/dashboard', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

export const updateCandidateStatus = async (jobId, candidateId, status, token) => {
  return await request(`/api/recruiter/job/${jobId}/candidate/${candidateId}/status`, {
    method: 'PUT',
    headers: buildHeaders(token, true),
    body: JSON.stringify({ status }),
  });
};

export const updateCandidateShortlist = async (jobId, candidateId, shortlisted, token) => {
  return await request(`/api/recruiter/job/${jobId}/candidate/${candidateId}/shortlist`, {
    method: 'PUT',
    headers: buildHeaders(token, true),
    body: JSON.stringify({ shortlisted }),
  });
};

export const getAllCandidates = async () => {
  return await request('/api/recruiter/candidates', { method: 'GET' });
};

export const getCandidateDetails = async (candidateId) => {
  return await request(`/api/recruiter/candidate/${candidateId}`, { method: 'GET' });
};

// ============ ADMIN ENDPOINTS ============

export const getAdminOverview = async (token) => {
  return await request('/api/admin/overview', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

export const getAdminCandidates = async (token) => {
  return await request('/api/admin/candidates', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

export const deleteAdminCandidate = async (candidateId, token) => {
  return await request(`/api/admin/candidates/${candidateId}`, {
    method: 'DELETE',
    headers: buildHeaders(token, false),
  });
};

export const getAdminJobs = async (token) => {
  return await request('/api/admin/jobs', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

export const deleteAdminJob = async (jobId, token) => {
  return await request(`/api/admin/jobs/${jobId}`, {
    method: 'DELETE',
    headers: buildHeaders(token, false),
  });


  
};

// ============ UTILITY ENDPOINTS ============

export const healthCheck = async () => {
  return await request('/health', { method: 'GET' });

};

export const getAdminRecruiters = async (token) => {
  return await request('/api/admin/recruiters', {
    method: 'GET',
    headers: buildHeaders(token, false),
  });
};

export const approveAdminRecruiter = async (recruiterId, token) => {
  return await request(`/api/admin/recruiters/${recruiterId}/approve`, {
    method: 'PUT',
    headers: buildHeaders(token, false),
  });
};

export const deleteAdminRecruiter = async (recruiterId, token) => {
  return await request(`/api/admin/recruiters/${recruiterId}`, {
    method: 'DELETE',
    headers: buildHeaders(token, false),
  });
};