"""
Sample test script for backend API
Tests major endpoints without frontend
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(response.json())
    assert response.status_code == 200


def test_manual_candidate_profile():
    """Test manual candidate profile creation"""
    print("\n=== Testing Manual Candidate Profile ===")
    
    profile_data = {
        "candidate_name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "linkedin": "https://linkedin.com/in/johndoe",
        "github": "https://github.com/johndoe",
        "leetcode": "https://leetcode.com/johndoe",
        "codechef": "https://codechef.com/users/johndoe",
        "codeforces": "https://codeforces.com/profile/johndoe",
        "skills": ["Python", "React", "Django", "PostgreSQL", "Docker"],
        "education": [{"degree": "B.Tech", "field": "Computer Science", "year": 2023}],
        "experience": [{"role": "Full-Stack Developer", "company": "Tech Corp", "duration": "2 years"}]
    }
    
    response = requests.post(f"{BASE_URL}/candidate/profile", json=profile_data)
    print(response.json())
    assert response.status_code == 200
    return response.json()['candidate_id']


def test_create_job():
    """Test job creation"""
    print("\n=== Testing Job Creation ===")
    
    job_data = {
        "job_title": "Full-Stack Developer",
        "company_name": "TechCorp",
        "location": "Remote",
        "job_description": """
        We are looking for an experienced Full-Stack Developer with strong skills in:
        - Python and Django
        - React and JavaScript
        - PostgreSQL and MongoDB
        - Docker and Kubernetes
        - REST API design
        - AWS or GCP
        
        You should have experience with microservices, agile development, and team collaboration.
        Minimum 3 years of experience required.
        """,
        "required_skills": ["Python", "Django", "React", "PostgreSQL", "Docker", "AWS"]
    }
    
    response = requests.post(f"{BASE_URL}/recruiter/job/create", json=job_data)
    print(response.json())
    assert response.status_code == 200
    return response.json()['job_id']


def test_match_candidates(job_id, candidate_id):
    """Test candidate matching"""
    print("\n=== Testing Candidate Matching ===")
    
    match_data = {
        "job_id": job_id,
        "candidate_ids": [candidate_id]
    }
    
    response = requests.post(f"{BASE_URL}/recruiter/job/match", json=match_data)
    result = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Total Candidates: {result.get('total_candidates')}")
    
    if 'candidates' in result:
        for candidate in result['candidates']:
            print(f"\nCandidate: {candidate.get('candidate_name')}")
            print(f"  Overall Score: {candidate.get('overall_score')}%")
            print(f"  Skill Match: {candidate.get('skill_match_percentage')}%")
            print(f"  Content Similarity: {candidate.get('content_similarity_score')}%")
            print(f"  Matched Skills: {', '.join(candidate.get('matched_skills', []))}")
            print(f"  Missing Skills: {', '.join(candidate.get('missing_skills', []))}")


def test_get_candidates():
    """Test getting all candidates"""
    print("\n=== Testing Get All Candidates ===")
    
    response = requests.get(f"{BASE_URL}/recruiter/candidates")
    result = response.json()
    
    print(f"Total Candidates: {result.get('total_candidates')}")
    for candidate in result.get('candidates', []):
        print(f"  - {candidate.get('candidate_name')} ({candidate.get('candidate_id')})")


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("ResumeIQ Backend API - Test Suite")
    print("=" * 60)
    
    try:
        # Test health
        test_health()
        
        # Create candidate
        candidate_id = test_manual_candidate_profile()
        
        # Create job
        job_id = test_create_job()
        
        # Match candidates
        test_match_candidates(job_id, candidate_id)
        
        # Get all candidates
        test_get_candidates()
        
        print("\n" + "=" * 60)
        print("All tests completed successfully!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\nTest failed: {e}")
    except Exception as e:
        print(f"\nError: {e}")
        print("Make sure the Flask server is running on http://localhost:5000")


if __name__ == "__main__":
    run_all_tests()
