"""
Matching Engine Module
Implements resume-to-job-description matching using TF-IDF and Cosine Similarity
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import Dict, List, Any
import re


class MatchingEngine:
    """Match candidates to job descriptions based on skills and content similarity"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1
        )
    
    def preprocess_text(self, text: str) -> str:
        """
        Clean and preprocess text
        
        Args:
            text: Raw text
            
        Returns:
            Cleaned text
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s+#.]', ' ', text)
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        return text
    
    def calculate_skill_match(self, resume_skills: List[str], 
                             job_skills: List[str]) -> Dict[str, Any]:
        """
        Calculate skill-based matching
        
        Args:
            resume_skills: List of skills from resume
            job_skills: List of skills required by job
            
        Returns:
            Dictionary with matched, missing, and extra skills
        """
        resume_skills_set = set([s.lower().strip() for s in resume_skills])
        job_skills_set = set([s.lower().strip() for s in job_skills])
        
        matched_skills = list(resume_skills_set & job_skills_set)
        missing_skills = list(job_skills_set - resume_skills_set)
        extra_skills = list(resume_skills_set - job_skills_set)
        
        # Calculate skill match percentage
        if len(job_skills_set) > 0:
            skill_match_percentage = (len(matched_skills) / len(job_skills_set)) * 100
        else:
            skill_match_percentage = 0
        
        return {
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'extra_skills': extra_skills,
            'skill_match_percentage': round(skill_match_percentage, 2)
        }
    
    def extract_job_skills(self, job_description: str) -> List[str]:
        """
        Extract required skills from job description
        
        Args:
            job_description: Job description text
            
        Returns:
            List of required skills
        """
        # Common skill keywords to look for
        technical_skills = {
            # Programming Languages
            'python', 'java', 'javascript', 'c++', 'c#', 'typescript', 'ruby', 'php',
            'swift', 'kotlin', 'rust', 'golang', 'go', 'scala', 'perl', 'r', 'matlab',
            'sql', 'nosql', 'plsql', 'html', 'css', 'xml', 'json',
            
            # Web Frameworks
            'react', 'angular', 'vue', 'nodejs', 'node.js', 'express', 'django', 'flask',
            'spring', 'asp.net', 'laravel', 'fastapi', 'nextjs', 'next.js',
            
            # Databases
            'mysql', 'postgresql', 'mongodb', 'dynamodb', 'cassandra', 'redis',
            'elasticsearch', 'oracle', 'sqlserver', 'firebase', 'cosmos',
            
            # Cloud & DevOps
            'aws', 'aws s3', 'aws ec2', 'aws lambda', 'azure', 'gcp', 'google cloud',
            'docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab ci', 'github actions',
            'terraform', 'ansible', 'cloudformation', 'heroku',
            
            # Data & ML
            'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'pandas', 'numpy',
            'matplotlib', 'seaborn', 'spark', 'hadoop', 'hive', 'big data',
            'machine learning', 'deep learning', 'nlp', 'computer vision',
            
            # Tools & Technologies
            'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
            'rest api', 'graphql', 'microservices',
            
            # Soft Skills
            'leadership', 'communication', 'teamwork', 'problem solving',
            'analysis', 'project management', 'agile', 'scrum',
        }
        
        job_desc_lower = job_description.lower()
        found_skills = set()
        
        for skill in technical_skills:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, job_desc_lower):
                found_skills.add(skill)
        
        return sorted(list(found_skills))
    
    def calculate_content_similarity(self, resume_text: str, 
                                    job_description: str) -> float:
        """
        Calculate content similarity using TF-IDF and Cosine Similarity
        
        Args:
            resume_text: Resume content
            job_description: Job description content
            
        Returns:
            Similarity score (0 to 1)
        """
        # Preprocess texts
        resume_processed = self.preprocess_text(resume_text)
        job_processed = self.preprocess_text(job_description)
        
        # Vectorize
        try:
            vectors = self.vectorizer.fit_transform([job_processed, resume_processed])
            similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
            return float(similarity)
        except Exception as e:
            print(f"Error in content similarity: {e}")
            return 0.0
    
    def calculate_match_score(self, candidate_data: Dict[str, Any], 
                             job_description: str,
                             job_skills: List[str] = None) -> Dict[str, Any]:
        """
        Calculate overall match score for a candidate
        
        Args:
            candidate_data: Parsed resume data
            job_description: Job description text
            job_skills: List of required skills (auto-extracted if not provided)
            
        Returns:
            Match score and analysis
        """
        # Extract job skills if not provided
        if job_skills is None:
            job_skills = self.extract_job_skills(job_description)
        
        # Get candidate skills
        candidate_skills = candidate_data.get('skills', [])
        candidate_full_text = candidate_data.get('full_text', '')
        candidate_experience = candidate_data.get('experience', [])
        candidate_experience_years = candidate_data.get('estimated_experience_years', 0.0)
        
        # Calculate skill match
        skill_analysis = self.calculate_skill_match(candidate_skills, job_skills)
        
        # Calculate content similarity
        if candidate_full_text:
            content_similarity = self.calculate_content_similarity(
                candidate_full_text, 
                job_description
            )
        else:
            content_similarity = 0.0
        
        # Calculate skill match score (50% weight)
        skill_score = skill_analysis['skill_match_percentage'] / 100
        
        # Calculate content similarity score (30% weight)
        content_score = content_similarity

        # Experience relevance score (20% weight)
        if candidate_experience_years:
            experience_score = min(float(candidate_experience_years) / 5.0, 1.0)
        else:
            experience_score = min(len(candidate_experience) / 5.0, 1.0)
        
        # Overall match score
        overall_score = (
            (skill_score * 0.50)
            + (content_score * 0.30)
            + (experience_score * 0.20)
        )
        overall_score = round(overall_score * 100, 2)
        
        return {
            'overall_score': overall_score,
            'score_breakdown': {
                'skill_score': round(skill_score * 100, 2),
                'content_score': round(content_score * 100, 2),
                'experience_score': round(experience_score * 100, 2),
            },
            'match_score': overall_score,
            'skill_match_percentage': skill_analysis['skill_match_percentage'],
            'content_similarity_score': round(content_similarity * 100, 2),
            'experience_relevance_score': round(experience_score * 100, 2),
            'matched_skills': skill_analysis['matched_skills'],
            'missing_skills': skill_analysis['missing_skills'],
            'extra_skills': skill_analysis['extra_skills'],
            'job_required_skills': job_skills
        }
    
    def rank_candidates(self, candidates: List[Dict[str, Any]], 
                       job_description: str) -> List[Dict[str, Any]]:
        """
        Rank multiple candidates for a job
        
        Args:
            candidates: List of candidate data dictionaries
            job_description: Job description text
            
        Returns:
            Sorted list of candidates with match scores
        """
        # Extract job skills once
        job_skills = self.extract_job_skills(job_description)
        
        ranked_candidates = []
        
        for idx, candidate in enumerate(candidates):
            match_result = self.calculate_match_score(
                candidate,
                job_description,
                job_skills
            )
            
            candidate_with_score = {
                'candidate_id': candidate.get('candidate_id', idx),
                'candidate_name': candidate.get('candidate_name', f'Candidate {idx + 1}'),
                'contact': candidate.get('contact', {}),
                'education': candidate.get('education', []),
                'experience': candidate.get('experience', []),
                'projects': candidate.get('projects', []),
                'skills': candidate.get('skills', []),
                'coding_profiles': candidate.get('coding_profiles', {}),
                'profile_insights': candidate.get('profile_insights', {}),
                'links': candidate.get('links', []),
                'resume_summary': {
                    'education': candidate.get('education', []),
                    'experience': candidate.get('experience', []),
                    'projects': candidate.get('projects', []),
                },
                **match_result  # Add all match scores and analysis
            }
            
            ranked_candidates.append(candidate_with_score)
        
        # Sort by overall score (descending)
        ranked_candidates.sort(key=lambda x: x['overall_score'], reverse=True)
        
        # Add rank
        for rank, candidate in enumerate(ranked_candidates, 1):
            candidate['rank'] = rank
        
        return ranked_candidates
