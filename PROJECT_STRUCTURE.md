# ResumeIQ - Complete Project Structure

## Full Directory Tree

```
ResumeIQ/
│
├── 📄 README.md                           ← START HERE for complete overview
├── 📄 PROJECT_SUMMARY.md                  ← Quick navigation to all resources
├── 📄 QUICKSTART.md                       ← 5-minute setup guide
├── 📄 PRESENTATION_GUIDE.md               ← For judges/presentation
├── 📄 DELIVERABLES.md                     ← Checklist of all features
│
├── 🔧 Setup Scripts
├── setup_windows.bat                      ← Windows automated setup
├── setup_macos_linux.sh                   ← Mac/Linux automated setup
├── .env.example                           ← Environment variables template
│
├── 📁 backend/                            ← PYTHON FLASK API (Port 5000)
│   │
│   ├── 🐍 app/                            ← Main application code
│   │   ├── main.py                        ← Flask API & routes
│   │   ├── resume_parser.py               ← Resume parsing logic
│   │   ├── matching_engine.py             ← AI matching algorithm
│   │   └── __init__.py
│   │
│   ├── 📁 uploads/                        ← Uploaded PDF resumes (created at runtime)
│   │
│   ├── 📁 sample_data/                    ← Example data for testing
│   │   ├── resume_sample_1.txt            ← John Doe (Full-Stack Dev, 3+ yrs)
│   │   ├── resume_sample_2.txt            ← Priya Sharma (Data Science, 2+ yrs)
│   │   ├── resume_sample_3.txt            ← Michael Chen (Backend Dev, 4+ yrs)
│   │   ├── resume_sample_4.txt            ← Sarah Johnson (Junior Dev)
│   │   └── sample_job_description.txt     ← Full-Stack Developer job posting
│   │
│   ├── requirements.txt                   ← Python dependencies (pip install -r)
│   ├── test_api.py                        ← Automated API tests
│   ├── .gitignore                         ← Git ignore rules
│   └── README.md                          ← Backend-specific setup
│
├── 📁 frontend/                           ← REACT APPLICATION (Port 3000)
│   │
│   ├── 📁 public/                         ← Static files
│   │   └── index.html                     ← Main HTML template
│   │
│   ├── 📁 src/                            ← React source code
│   │   │
│   │   ├── App.js                         ← Main component with landing page
│   │   ├── index.js                       ← React entry point
│   │   │
│   │   ├── 📁 pages/                      ← Page components
│   │   │   ├── CandidatePortal.js         ← Candidate interface (upload/profile)
│   │   │   └── RecruiterPortal.js         ← Recruiter interface (matching/results)
│   │   │
│   │   ├── 📁 services/                   ← API integration
│   │   │   └── api.js                     ← API client with all endpoints
│   │   │
│   │   └── 📁 styles/                     ← CSS stylesheets
│   │       ├── index.css                  ← Global styles & typography
│   │       ├── App.css                    ← Landing page styles
│   │       ├── CandidatePortal.css        ← Candidate portal styling
│   │       └── RecruiterPortal.css        ← Recruiter portal styling
│   │
│   ├── package.json                       ← Node.js dependencies (npm install)
│   ├── .gitignore                         ← Git ignore rules
│   └── README.md                          ← Frontend-specific setup
│
└── 📁 components/                         ← (Optional, for future expansion)

```

---

## Quick File Locations Reference

### 🔑 Key Files by Purpose

#### **To Start the Application**
1. `setup_windows.bat` (Windows only)
2. `setup_macos_linux.sh` (Mac/Linux only)
3. Then run: `backend/app/main.py`
4. Then run: `frontend/npm start`

#### **To Understand the System**
1. `README.md` - Complete architecture & documentation
2. `PRESENTATION_GUIDE.md` - Algorithm explanation
3. `backend/app/main.py` - API endpoints
4. `backend/app/matching_engine.py` - Core AI algorithm

#### **To Test the System**
1. `backend/test_api.py` - Automated API tests
2. Manual testing using the web UI

#### **To Find Sample Data**
1. `backend/sample_data/resume_sample_*.txt` - Example resumes
2. `backend/sample_data/sample_job_description.txt` - Example job

#### **To Modify Code**
1. **Add new skills**: `backend/app/resume_parser.py` (line ~70)
2. **Change matching weights**: `backend/app/matching_engine.py` (line ~150)
3. **Change UI colors**: `frontend/src/styles/index.css` (line ~4)
4. **Add new pages**: `frontend/src/pages/*.js`

#### **To Deploy to Production**
1. Follow instructions in `README.md` - Future Enhancements
2. Set up PostgreSQL database
3. Deploy backend to cloud (Heroku/AWS)
4. Deploy frontend to CDN (Vercel/Netlify)

---

## File Size & Complexity Overview

```
Backend Implementation (~1000 LOC):
├── main.py          (300 lines) - Flask API with 7 endpoints
├── resume_parser.py (250 lines) - PDF parsing + extraction
├── matching_engine.py (350 lines) - TF-IDF + matching logic
└── test_api.py     (100 lines) - Automated tests

Frontend Implementation (~1500 LOC):
├── App.js           (150 lines) - Landing page
├── CandidatePortal.js (400 lines) - Candidate interface
├── RecruiterPortal.js (450 lines) - Recruiter interface
├── api.js           (130 lines) - API client
└── Styles          (400 lines) - CSS across 4 files

Documentation (~2500 lines):
├── README.md (~800 lines)
├── PRESENTATION_GUIDE.md (~700 lines)
├── QUICKSTART.md (~300 lines)
├── PROJECT_SUMMARY.md (~400 lines)
└── DELIVERABLES.md (~300 lines)

Total: ~7000 lines of code and documentation
```

---

## How to Navigate

### 🟢 **I want to run the application**
1. Read `QUICKSTART.md` (5 minutes)
2. Run setup script
3. Open http://localhost:3000

### 🟢 **I want to understand the system**
1. Read `README.md` - Overview
2. Read `PRESENTATION_GUIDE.md` - Algorithm details
3. Look at `backend/app/matching_engine.py` - Core logic

### 🟢 **I want to present to judges**
1. Review `PRESENTATION_GUIDE.md`
2. Practice the demo (create candidate → create job → match)
3. Have `README.md` ready for technical questions

### 🟢 **I want to modify the code**
1. Start with the relevant file listed above
2. Check comments in the code
3. Update and test
4. Run `test_api.py` for backend changes

### 🟢 **I want to add new features**
1. Check `DELIVERABLES.md` - What's already done
2. Design your feature (sketch on paper)
3. Implement in appropriate file
4. Test thoroughly
5. Update documentation

### 🟢 **I want to deploy to production**
1. Read "Future Enhancements" in `README.md`
2. Set up PostgreSQL
3. Update `backend/app/main.py` to use database
4. Deploy using cloud platform of choice

---

## Dependency Tree

### Backend Dependencies
```
Flask 3.0
├── PyPDF2 (PDF reading fallback)
├── pdfplumber (PDF reading primary)
├── PyResparser (Resume parsing)
├── scikit-learn (TF-IDF, vectorization)
│   ├── NumPy
│   └── SciPy
└── Pandas (Data manipulation)
```

### Frontend Dependencies
```
React 18
├── React DOM
├── React Router DOM
├── Axios (HTTP client)
└── Other utilities
```

---

## Environment Setup Summary

### Backend Environment
```bash
Python 3.8+
Virtual Environment: /backend/venv
Port: 5000
Database: In-memory (for prototype)
File Upload: /backend/uploads
```

### Frontend Environment
```bash
Node.js 14+
npm packages: /frontend/node_modules
Port: 3000
API Base: http://localhost:5000/api
```

### System Requirements
```
RAM: 2GB minimum
Disk Space: 1GB
Internet: Not required (local only)
Browsers: Chrome, Firefox, Safari, Edge
OS: Windows, macOS, Linux
```

---

## API Endpoint Overview

```
CANDIDATE ENDPOINTS:
├── POST /api/candidate/upload-resume
│   ├── Accept: PDF file + candidate name
│   └── Return: Parsed resume data
└── POST /api/candidate/profile
    ├── Accept: JSON profile data
    └── Return: Candidate ID

RECRUITER ENDPOINTS:
├── POST /api/recruiter/job/create
│   ├── Accept: Job details
│   └── Return: Job ID
├── POST /api/recruiter/job/match
│   ├── Accept: Job ID + Candidate IDs
│   └── Return: Ranked candidates with scores
├── GET /api/recruiter/candidates
│   └── Return: All candidates
└── GET /api/recruiter/candidate/<id>
    └── Return: Single candidate details

UTILITY ENDPOINTS:
├── GET /api/health
│   └── Return: Server status
└── GET /api/stats
    └── Return: System statistics
```

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:3000
- [ ] Can create candidate profile
- [ ] Can create job posting
- [ ] Can match candidates
- [ ] Results show with scores
- [ ] Skill analysis displays correctly
- [ ] Clicking expand shows details
- [ ] All links are clickable
- [ ] Form validation works
- [ ] Error messages appear on errors
- [ ] Responsive on mobile size
- [ ] Animations are smooth
- [ ] API tests pass

---

## Troubleshooting by File

| If Error In | Check File |
|------------|-----------|
| Backend won't start | `backend/requirements.txt` |
| API endpoint errors | `backend/app/main.py` |
| Resume parsing fails | `backend/app/resume_parser.py` |
| Matching scores wrong | `backend/app/matching_engine.py` |
| Frontend won't load | `frontend/package.json` |
| Candidate form issues | `frontend/src/pages/CandidatePortal.js` |
| Recruiter form issues | `frontend/src/pages/RecruiterPortal.js` |
| API connection fails | `frontend/src/services/api.js` |
| Styling problems | `frontend/src/styles/*.css` |
| Landing page issues | `frontend/src/App.js` |

---

## Version Information

```
Created: March 2024
Framework: React 18 + Flask 3.0
Python: 3.8+
Node.js: 14+
Status: Production-Ready for Demo
```

---

## Support Resources

### Quick Links
- **Setup Help**: `QUICKSTART.md`
- **Full Documentation**: `README.md`
- **Presentation**: `PRESENTATION_GUIDE.md`
- **Features List**: `DELIVERABLES.md`
- **This Guide**: `PROJECT_STRUCTURE.md`

### Getting Help
1. Check the appropriate **md file above
2. Look at code **comments** in relevant file
3. Run `backend/test_api.py` for API issues
4. Check browser **console** (F12) for frontend issues
5. See **Troubleshooting** section in files

---

## Next Steps

### Immediate (Today)
1. ✅ Run setup script
2. ✅ Start both servers
3. ✅ Test with sample data
4. ✅ Practice demo flow

### Short-term (This week)
1. 🔲 Review all documentation
2. 🔲 Practice presentation
3. 🔲 Make any custom tweaks
4. 🔲 Prepare for judging

### Medium-term (After datathon)
1. 🔲 Deploy to production
2. 🔲 Set up database
3. 🔲 Add authentication
4. 🔲 Implement more features

### Long-term (Months)
1. 🔲 User feedback integration
2. 🔲 Advanced ML models
3. 🔲 Integration with ATS systems
4. 🔲 Mobile app development

---

**You're all set! 🚀**

Everything you need is here. Start with `QUICKSTART.md` for immediate setup, then explore the rest.

Questions? Check the documentation first - answers are there!

Good luck with your datathon! 🏆
