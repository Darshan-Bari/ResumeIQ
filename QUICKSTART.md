QUICK START GUIDE
=================

This is a quick reference guide to get ResumeIQ running in minutes!

1. BACKEND SETUP (Terminal 1)
============================

Windows:
  cd backend
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  python -m app.main

Mac/Linux:
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  python -m app.main

For complete setup, run:
  - Windows: setup_windows.bat
  - Mac/Linux: bash setup_macos_linux.sh

Expected output:
  Starting ResumeIQ API Server...
  Server running on http://localhost:5000

2. FRONTEND SETUP (Terminal 2)
=============================

  cd frontend
  npm install
  npm start

This will automatically open: http://localhost:3000

3. TEST THE APPLICATION
=======================

Quick Test Steps:

a) Create a Candidate Profile:
   - Go to http://localhost:3000
   - Click "I'm a Candidate"
   - Enter name: "John Doe"
   - Add email: "john@example.com"
   - Add skills: "Python", "React", "Django", "PostgreSQL", "Docker"
   - Submit

b) Create a Job Posting:
   - Click "I'm a Recruiter"
   - Job Title: "Full-Stack Developer"
   - Job Description: Paste from sample_job_description.txt
   - Add required skills
   - Create Job

c) Match Candidates:
   - Select the candidate you created
   - Click "Match Candidates"
   - See results with scores!

4. SAMPLE DATA
==============

Sample Resumes (Text Format):
  - backend/sample_data/resume_sample_1.txt (John Doe - Full-Stack)
  - backend/sample_data/resume_sample_2.txt (Priya Sharma - Data Science)
  - backend/sample_data/resume_sample_3.txt (Michael Chen - Backend)
  - backend/sample_data/resume_sample_4.txt (Sarah Johnson - Junior Dev)

Sample Job Description:
  - backend/sample_data/sample_job_description.txt

You can manually enter these resumes as candidate profiles!

5. API TESTING
==============

Automated API Tests:
  cd backend
  python test_api.py

This will test:
  - Health check
  - Manual profile creation
  - Job creation
  - Candidate matching
  - Results retrieval

6. TROUBLESHOOTING
==================

Port conflicts:
  - Flask on 5000: Check if something else is running
  - React on 3000: Check if browser tab already exists

Missing dependencies:
  - Run: pip install --upgrade -r requirements.txt
  - For npm: Delete node_modules and run npm install again

API not found:
  - Ensure Flask server is running on http://localhost:5000
  - Check CORS settings in backend/app/main.py

More details:
  - See main README.md for complete documentation
  - Check browser console (F12) for error messages

7. KEY FEATURES TO EXPLORE
===========================

Candidate Portal:
  ✓ Upload resume (manual entry works better for demo)
  ✓ Add multiple skills
  ✓ Add education and experience
  ✓ Link coding profiles (LeetCode, CodeChef, etc.)

Recruiter Portal:
  ✓ Create job with auto-extracted skills
  ✓ Select candidates to evaluate
  ✓ See ranked results with match scores
  ✓ View detailed skill analysis
  ✓ Access candidate contact info & profiles

Matching Algorithm:
  ✓ Skill-based matching (40% weight)
  ✓ Content similarity via TF-IDF (60% weight)
  ✓ Combined score ranking
  ✓ Detailed skill gap analysis

8. PRESENTATION TIPS
====================

For Demo/Presentation:
  1. Pre-populate a few candidates using manual entry
  2. Create a realistic job posting
  3. Run matching to show ranked results
  4. Expand candidate cards to show detailed analysis
  5. Highlight matched/missing skills
  6. Show different scenarios with different jobs

Performance Notes:
  - Matching is instant (<1 second)
  - Clean UI with smooth animations
  - Responsive design on all devices
  - Real-time feedback and validation

Ready to Go! 🚀

If you have any issues, refer to the main README.md or troubleshooting section.

Good luck with your datathon! 🎯
