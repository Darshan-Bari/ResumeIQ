# ResumeIQ - Intelligent Hiring Assistant 🚀

A complete AI-powered resume screener and job matcher that helps recruiters compare candidate resumes with job descriptions and rank candidates based on relevance.

## Project Overview

ResumeIQ is a full-stack web application built for the Datathon competition. It uses advanced natural language processing and machine learning techniques to automatically match candidate profiles with job postings.

### Live Demo Features

- **Candidate Portal**: Upload resumes (PDF), enter profile details manually, add coding profile links (LeetCode, CodeChef, Codeforces)
- **Recruiter Portal**: Create job postings, select candidates to match, view ranked results with detailed analysis
- **AI Matching Engine**: TF-IDF + Cosine Similarity-based resume screening
- **Skill Gap Analysis**: Identifies matched and missing skills for each candidate
- **Modern UI**: Beautiful, responsive design optimized for both desktop and mobile

---

## Tech Stack

### Frontend
- **React.js 18** - Modern UI framework
- **CSS3** - Custom styling with modern CSS features
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing

### Backend
- **Python 3.8+** - Server language
- **Flask 3.0** - Lightweight web framework
- **Flask-CORS** - Cross-origin resource sharing
- **PyResparser 1.0** - Resume parsing
- **PyPDF2 & pdfplumber** - PDF text extraction
- **scikit-learn 1.3** - Machine learning library
- **Pandas & NumPy** - Data processing

### Storage
- **In-memory JSON storage** (for prototype)
- **File system** for uploaded PDFs

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CANDIDATE PORTAL                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Upload Resume (PDF) or Enter Profile Details    │   │
│  │ 2. Add Skills, Education, Experience              │   │
│  │ 3. Add Coding Profile Links (Optional)            │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │   FLASK BACKEND API              │
         │  ┌──────────────────────────┐   │
         │  │ Resume Parser Module     │   │
         │  │ - Extract skills         │   │
         │  │ - Extract education      │   │
         │  │ - Extract contact info   │   │
         │  └──────────────────────────┘   │
         │  ┌──────────────────────────┐   │
         │  │ Matching Engine Module   │   │
         │  │ - TF-IDF Vectorizer      │   │
         │  │ - Cosine Similarity      │   │
         │  │ - Skill Matching         │   │
         │  └──────────────────────────┘   │
         └──────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
┌─────────────────────────┐  ┌──────────────────────────┐
│  CANDIDATE DATABASE     │  │  JOB DATABASE            │
│  - Parsed Resumes       │  │  - Job Postings         │
│  - Profile Data         │  │  - Required Skills      │
│  - Coding Profiles      │  │  - Job Descriptions     │
└─────────────────────────┘  └──────────────────────────┘
            │                             │
            └──────────────┬──────────────┘
                           ▼
         ┌──────────────────────────────┐
         │  MATCHING ENGINE             │
         │  - Calculate Match Scores    │
         │  - Rank Candidates           │
         │  - Generate Analysis         │
         └──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    RECRUITER PORTAL                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. View Job Created with Extracted Skills          │   │
│  │ 2. Select Candidates to Match                      │   │
│  │ 3. View Ranked Candidates with Scores              │   │
│  │ 4. See Skill Gap Analysis for Each Candidate       │   │
│  │ 5. Access Candidate Contact & Coding Profiles      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation & Setup

### Prerequisites
- **Python 3.8+**
- **Node.js 14+** and **npm**
- **Git**

### Backend Setup

1. **Clone and navigate to backend directory**
   ```bash
   cd ResumeIQ/backend
   ```

2. **Create Python virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Flask server**
   ```bash
   python -m app.main 
   ```
   
   You should see:
   ```
   Starting ResumeIQ API Server...
   Server running on http://localhost:5000
   ```

### Frontend Setup

1. **Navigate to frontend directory** (in another terminal)
   ```bash
   cd ResumeIQ/frontend
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   
   This will open http://localhost:3000 in your browser

---

## Usage Guide

### For Candidates

1. **Open the application** at http://localhost:3000
2. **Click "I'm a Candidate"** on the landing page
3. **Choose one of two options**:
   - **Upload Resume**: Upload a PDF resume (sample resumes provided)
   - **Manual Entry**: Fill in profile details manually
4. **Complete Profile**: Add skills, education, experience
5. **Add Coding Profiles** (Optional): Enter LeetCode, CodeChef, Codeforces links
6. **Submit**: Your profile is saved with a unique Candidate ID

### For Recruiters

1. **Open the application** at http://localhost:3000
2. **Click "I'm a Recruiter"** on the landing page
3. **Create Job Posting**:
   - Enter job title, company, location
   - Paste detailed job description
   - Add required skills (auto-extracted from description)
4. **Select Candidates**:
   - Choose candidates to match against this job
   - See their profile summaries
5. **View Results**:
   - Candidates ranked by overall match score
   - See skill breakdown (matched vs. missing)
   - View detailed candidate information
   - Access coding profile links

---

## API Endpoints

### Candidate Endpoints

**POST** `/api/candidate/upload-resume`
- Upload and parse a resume PDF
- **Body**: FormData with `resume` file and `candidate_name`
- **Returns**: Parsed candidate data with skills, education, contact info

**POST** `/api/candidate/profile`
- Save candidate profile manually
- **Body**: JSON with candidate details, skills, education, coding profiles
- **Returns**: Candidate ID and confirmation

### Recruiter Endpoints

**POST** `/api/recruiter/job/create`
- Create a new job posting
- **Body**: JSON with job_title, job_description, required_skills, etc.
- **Returns**: Job ID

**POST** `/api/recruiter/job/match`
- Match candidates to a job
- **Body**: JSON with job_id and candidate_ids
- **Returns**: Ranked candidates with match scores and analysis

**GET** `/api/recruiter/candidates`
- Get all candidates in system
- **Returns**: List of all candidate profiles

**GET** `/api/recruiter/candidate/<candidate_id>`
- Get detailed candidate information
- **Returns**: Full candidate profile with all details

### Utility Endpoints

**GET** `/api/health`
- Health check endpoint
- **Returns**: Server status

**GET** `/api/stats`
- Get system statistics
- **Returns**: Total candidates, jobs, IDs

---

## Matching Algorithm

The AI matching engine uses a hybrid approach:

### 1. **Skill-Based Matching (40% weight)**
- Extracts skills from resume
- Compares with job requirements
- Calculates skill match percentage
- **Formula**: `(Matched Skills / Required Skills) × 100`

### 2. **Content Similarity (60% weight)**
- Uses TF-IDF vectorization to convert text to numerical features
- Calculates cosine similarity between resume and job description
- Captures contextual relevance beyond keywords
- **Formula**: `Cosine Similarity(Resume Vectors, JD Vectors)`

### 3. **Overall Score**
```
Overall Score = (Skill_Match × 0.4) + (Content_Similarity × 0.6)
Score is normalized to 0-100%
```

### Skill Gap Analysis
- **Matched Skills**: Skills found in both resume and job description
- **Missing Skills**: Required skills not found in resume
- **Extra Skills**: Skills in resume not mentioned in job description

---

## Sample Data

The project includes 4 sample resumes for testing:

1. **John Doe** - Full-Stack Developer with 3+ years experience
2. **Priya Sharma** - Data Science Engineer with 2+ years experience
3. **Michael Chen** - Senior Backend Engineer with 4+ years experience
4. **Sarah Johnson** - Recent graduate with full-stack web development skills

### Sample Job Descriptions

**Full-Stack Developer Role**
- Required skills: Python, Django, React, PostgreSQL, Docker, AWS
- Experience needed: 3+ years
- Responsibilities: Backend & frontend development

**Data Science Position**
- Required skills: Python, TensorFlow, scikit-learn, SQL, Pandas
- Experience needed: 2+ years
- Focus: ML models, data analysis

---

## Testing the Application

### Quick Test with Sample Resume

1. **Backend is running** (http://localhost:5000)
2. **Frontend is running** (http://localhost:3000)
3. **Create a candidate profile** (manual entry):
   - Name: John Doe
   - Skills: Python, React, Django, PostgreSQL, Docker
   - Email: john@example.com
4. **Create a job posting** (as recruiter):
   - Title: Full-Stack Developer
   - Description: Looking for Python Django and React developer
   - Skills: Python, Django, React, PostgreSQL, Docker, AWS
5. **Match candidates**:
   - Select the candidate created above
   - See the match results

### Running Automated Tests

```bash
cd ResumeIQ/backend
python test_api.py
```

This runs automated tests for all main API endpoints.

---

## File Structure

```
ResumeIQ/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Flask app and routes
│   │   ├── resume_parser.py     # Resume parsing logic
│   │   ├── matching_engine.py   # TF-IDF matching
│   │   └── utils/
│   ├── uploads/                 # Uploaded resume PDFs
│   ├── sample_data/             # Sample resumes
│   ├── requirements.txt
│   ├── test_api.py
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── CandidatePortal.js
│   │   │   └── RecruiterPortal.js
│   │   ├── services/
│   │   │   └── api.js           # API service
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   ├── App.css
│   │   │   ├── CandidatePortal.css
│   │   │   └── RecruiterPortal.css
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
└── README.md (this file)
```

---

## Key Features & Implementation Details

### 1. Resume Parsing
- **Multi-method approach**: pdfplumber (primary) + PyPDF2 (fallback)
- **Extracts**: Skills, education, experience, contact information
- **Skill recognition**: 100+ technical and soft skills database
- **Fallback handling**: Works even if PDF parsing partially fails

### 2. Matching Engine
- **TF-IDF Vectorization**: Converts text to high-dimensional vectors
- **Cosine Similarity**: Measures angular similarity between document vectors
- **Weighted scoring**: Skill matching (40%) + Content similarity (60%)
- **Ranking**: Candidates sorted by overall relevance score
- **Analysis generation**: Detailed skill gap reports

### 3. User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Modern Aesthetics**: Gradient backgrounds, smooth animations, card-based layout
- **Smooth Transitions**: CSS animations for engaging user experience
- **Form Validation**: Client-side validation with helpful error messages
- **Real-time Feedback**: Loading states, success/error messages

### 4. Data Management
- **In-Memory Storage**: Fast access for prototype demo
- **File Uploads**: Secure handling of PDF files
- **Unique IDs**: UUID-based identification for candidates and jobs
- **Data Persistence**: Session-based storage during runtime

---

## Performance Characteristics

- **Resume Parsing**: 2-5 seconds for typical resume
- **Candidate Matching**: <1 second for 10 candidates
- **Matching Result**: Real-time ranking without server delays
- **API Response Time**: <500ms for all endpoints

---

## Future Enhancements

1. **Database Integration**: Replace in-memory storage with PostgreSQL
2. **Advanced ML**: BERT embeddings for better semantic understanding
3. **Bulk Upload**: Support for uploading multiple resumes at once
4. **Admin Panel**: Dashboard for system administrators
5. **Email Integration**: Automatic candidate notifications
6. **Resume Rating**: AI-powered resume improvement suggestions
7. **Analytics**: Hiring flow metrics and insights
8. **Multi-language**: Support for resumes in multiple languages

---

## Troubleshooting

### Port Already in Use
- **Flask (5000)**: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)
- **React (3000)**: `lsof -ti:3000 | xargs kill -9` (Mac/Linux)

### PDF Upload Issues
- Ensure PDF file is valid and not corrupted
- File size should be <50MB
- Use UTF-8 encoded resumes for best results

### API Connection Issues
- Verify Flask server is running on http://localhost:5000
- Check CORS settings in backend/app/main.py
- Browser console (F12) shows detailed error messages

### Dependency Issues
- Clear pip cache: `pip cache purge`
- Reinstall dependencies: `pip install --upgrade -r requirements.txt`
- Use specific Python version: `python3.8 -m venv venv`

---

## Team & Credits

**Built for**: Datathon Prototype Challenge
**Development Time**: Complete full-stack application
**Technologies**: React, Python, Flask, scikit-learn, Modern CSS3

---

## License

This project is created for educational and competition purposes.

---

## Contact & Support

For questions or issues:
- Check the troubleshooting section above
- Review API endpoint documentation
- Examine sample data in `backend/sample_data/`
- Check browser console for detailed error messages

---

**Happy Recruiting! 🎯** 

Ready to hire faster and smarter with ResumeIQ!
