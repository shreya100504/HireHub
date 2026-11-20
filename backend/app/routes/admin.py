from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.interview import Interview
from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


@router.put("/jobs/{job_id}/approve")
def approve_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Only admins can approve jobs
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can approve jobs"
        )

    # Find the job
    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Approve the job
    job.status = "approved"

    db.commit()
    db.refresh(job)

    return {
        "message": "Job approved successfully",
        "job_id": job.id,
        "status": job.status
    }

@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access the dashboard"
        )

    total_users = db.query(User).count()

    total_candidates = db.query(User).filter(
        User.role == "candidate"
    ).count()

    total_recruiters = db.query(User).filter(
        User.role == "recruiter"
    ).count()

    total_jobs = db.query(Job).count()

    approved_jobs = db.query(Job).filter(
        Job.status == "approved"
    ).count()

    total_applications = db.query(Application).count()

    shortlisted_applications = db.query(Application).filter(
        Application.status == "shortlisted"
    ).count()

    total_interviews = db.query(Interview).count()

    return {
        "total_users": total_users,
        "total_candidates": total_candidates,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs,
        "approved_jobs": approved_jobs,
        "total_applications": total_applications,
        "shortlisted_applications": shortlisted_applications,
        "total_interviews": total_interviews
    }

@router.get("/jobs/pending")
def get_pending_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admins can view pending jobs
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view pending jobs"
        )

    pending_jobs = db.query(Job).filter(
        Job.status == "pending"
    ).all()

    return pending_jobs