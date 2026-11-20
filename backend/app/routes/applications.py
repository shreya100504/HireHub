from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.utils.auth_dependency import get_current_user
from app.models.company import Company
from app.models.notification import Notification

router = APIRouter(
    prefix="/api/jobs",
    tags=["Applications"]
)


class ApplicationCreate(BaseModel):
    cover_letter: Optional[str] = None


@router.post("/{job_id}/apply")
def apply_for_job(
    job_id: int,
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # 1. Only candidates can apply
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can apply for jobs"
        )

    # 2. Check whether the job exists
    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # 3. Check whether the job is approved
    if job.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="This job is not available for applications"
        )

    # 4. Check whether the candidate already applied
    existing_application = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_id == current_user.id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    # 5. Create the application
    new_application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        status="applied",
        cover_letter=application_data.cover_letter
    )

    # 6. Save application to database
    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # Notify the recruiter about the new application
    company = db.query(Company).filter(
        Company.id == job.company_id
    ).first()

    if company:
        notification = Notification(
            user_id=company.recruiter_id,
            message=f"{current_user.name} applied for the job: {job.title}"
        )

        db.add(notification)
        db.commit()

    return {
        "message": "Application submitted successfully",
        "application_id": new_application.id,
        "job_id": new_application.job_id,
        "candidate_id": new_application.candidate_id,
        "status": new_application.status
    }

@router.get("/my-applications")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can view their applications"
        )

    applications = db.query(Application).filter(
        Application.candidate_id == current_user.id
    ).all()

    return applications

@router.get("/{job_id}/applications")
def get_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view applicants"
        )

    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    company = db.query(Company).filter(
        Company.id == job.company_id
    ).first()

    if company is None or company.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view applicants for this job"
        )

    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).all()

    return applications

class ApplicationStatusUpdate(BaseModel):
    status: str

@router.put("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    status_data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only recruiters can update application status
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can update application status"
        )

    # Find application
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # Find the job
    job = db.query(Job).filter(
        Job.id == application.job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Find company
    company = db.query(Company).filter(
        Company.id == job.company_id
    ).first()

    if company is None or company.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to update this application"
        )

    # Validate status
    allowed_statuses = [
        "applied",
        "shortlisted",
        "rejected",
        "accepted"
    ]

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    # Update status
    application.status = status_data.status

    # Notify the candidate
    notification = Notification(
        user_id=application.candidate_id,
        message=f"Your application status for {job.title} has been updated to {status_data.status}."
    )

    db.add(notification)    

    # Save changes
    db.commit()
    db.refresh(application)

    return {
        "message": "Application status updated successfully",
        "application_id": application.id,
        "status": application.status
    }