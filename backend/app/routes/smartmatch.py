
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.candidate_profile import CandidateProfile
from app.models.company import Company
from app.utils.auth_dependency import get_current_user

router = APIRouter(
    prefix="/api/smartmatch",
    tags=["SmartMatch"]
)

# =====================================================
# SKILL MATCHING HELPER
# =====================================================

def normalize_skills(skills):
    """
    Convert a comma/semicolon/newline-separated skill
    string into a unique, normalized list.
    """

    if not skills:
        return []

    skill_list = re.split(r"[,;\n]+", skills)

    unique_skills = {}

    for skill in skill_list:
        cleaned = re.sub(r"\s+", " ", skill.strip())

        if cleaned:
            normalized = cleaned.casefold()
            unique_skills[normalized] = cleaned

    return unique_skills

def calculate_skill_match(candidate_skills, job_skills):
    """
    Compare candidate skills with required job skills.

    Match Score =
    (Matched Required Skills / Total Required Skills) * 100
    """

    candidate = normalize_skills(candidate_skills)
    required = normalize_skills(job_skills)

    if not required:
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": []
        }

    matched = [
        required[skill]
        for skill in required
        if skill in candidate
    ]

    missing = [
        required[skill]
        for skill in required
        if skill not in candidate
    ]

    score = round(
        (len(matched) / len(required)) * 100,
        2
    )

    return {
        "match_score": score,
        "matched_skills": matched,
        "missing_skills": missing
    }

# =====================================================
# CANDIDATE JOB RECOMMENDATIONS
# =====================================================

@router.get("/recommendations")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can view recommendations"
        )

    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Please create your candidate profile first"
        )

    if not normalize_skills(profile.skills):
        raise HTTPException(
            status_code=400,
            detail="Please add your skills to your candidate profile to use SmartMatch"
        )

    jobs = db.query(Job).filter(
        Job.status == "approved"
    ).all()

    recommendations = []

    for job in jobs:

        result = calculate_skill_match(
            profile.skills,
            job.skills
        )

        recommendations.append({
            "job_id": job.id,
            "title": job.title,
            "location": job.location,
            "skills": job.skills,
            "match_score": result["match_score"],
            "matched_skills": result["matched_skills"],
            "missing_skills": result["missing_skills"],
            "recommended": result["match_score"] > 0
        })

    recommendations.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return recommendations

# =====================================================
# RECRUITER: APPLICANT MATCH SCORES
# =====================================================

@router.get("/jobs/{job_id}/applicants")
def get_applicant_matches(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view applicant matches"
        )

    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    company = db.query(Company).filter(
        Company.id == job.company_id,
        Company.recruiter_id == current_user.id
    ).first()

    if not company:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view these applicants"
        )

    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).all()

    applicant_results = []

    for application in applications:

        candidate = db.query(User).filter(
            User.id == application.candidate_id
        ).first()

        profile = db.query(CandidateProfile).filter(
            CandidateProfile.user_id == application.candidate_id
        ).first()

        candidate_skills = (
            profile.skills if profile else ""
        )

        result = calculate_skill_match(
            candidate_skills,
            job.skills
        )

        applicant_results.append({
            "application_id": application.id,
            "candidate_id": application.candidate_id,
            "candidate_name": (
                candidate.name if candidate else "Unknown Candidate"
            ),
            "status": application.status,
            "cover_letter": application.cover_letter,
            "match_score": result["match_score"],
            "matched_skills": result["matched_skills"],
            "missing_skills": result["missing_skills"]
        })

    applicant_results.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return applicant_results