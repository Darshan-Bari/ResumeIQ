import React, { useEffect, useState } from 'react';

function JobsMarquee() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/recruiter/jobs');
        const data = await response.json();
        if (data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs.map(job => job.job_title || 'Open Position').filter(title => title));
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        setJobs([]);
      }
    };

    fetchJobs();
  }, []);

  const displayText = jobs.length > 0 ? jobs.join(' • ') : 'Job openings coming soon...';
  const shouldLoop = jobs.length > 0;

  return (
    <div className={`jobs-marquee ${shouldLoop ? 'animate-marquee' : 'static'}`}>
      <div className="marquee-content">
        {shouldLoop ? (
          <>
            <span className="marquee-text">{displayText}</span>
            <span className="marquee-text" aria-hidden="true">{displayText}</span>
          </>
        ) : (
          <span className="marquee-text">{displayText}</span>
        )}
      </div>
    </div>
  );
}

export default JobsMarquee;
