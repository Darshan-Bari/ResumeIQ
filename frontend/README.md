# ResumeIQ Frontend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

Server will start on http://localhost:3000

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── CandidatePortal.js
│   │   └── RecruiterPortal.js
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── CandidatePortal.css
│   │   └── RecruiterPortal.css
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Features

- **Candidate Portal**: Upload resumes, enter profile details, add coding profile links
- **Recruiter Portal**: Create job postings, match candidates, view detailed analysis
- **Modern UI**: Clean, responsive design with smooth animations
- **Real-time API Integration**: Connects to Flask backend
