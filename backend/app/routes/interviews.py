from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.interview import Interview
from app.models.application import Application
from app.models.job import Job
from app.models.company import Company
from app.models.user import User
from app.utils.auth_dependency import get_current_user
from app.models.notification import Notification


router = APIRouter(
    prefix="/api/interviews",
    tags=["Interviews"]
)


# Request body for scheduling an interview
class InterviewCreate(BaseModel):
    application_id: int
    scheduled_at: datetime
    interview_type: str
    meeting_link: str | None = None
    venue: str | None = None


# --------------------------------------------------
# Recruiter: Schedule Interview
# --------------------------------------------------

@router.post("/")
def schedule_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only recruiters can schedule interviews
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can schedule interviews"
        )

    # Find application
    application = db.query(Application).filter(
        Application.id == interview_data.application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # Find job
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

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    # Make sure this recruiter owns the company
    if company.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to schedule this interview"
        )

    # Create interview
    interview = Interview(
        application_id=interview_data.application_id,
        scheduled_at=interview_data.scheduled_at,
        interview_type=interview_data.interview_type,
        meeting_link=interview_data.meeting_link,
        venue=interview_data.venue,
        status="scheduled"
    )

    db.add(interview)

    # Notify the candidate about the scheduled interview
    notification = Notification(
        user_id=application.candidate_id,
        message=f"An interview has been scheduled for your application to {job.title}."
    )

    db.add(notification)

    # Save both interview and notification
    db.commit()
    db.refresh(interview)


    return {
        "message": "Interview scheduled successfully",
        "interview_id": interview.id,
        "application_id": interview.application_id,
        "scheduled_at": interview.scheduled_at,
        "status": interview.status
    }


# --------------------------------------------------
# Candidate: View My Interviews
# --------------------------------------------------

@router.get("/my")
def get_my_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can view their interviews"
        )

    interviews = (
        db.query(Interview)
        .join(Application)
        .filter(Application.candidate_id == current_user.id)
        .all()
    )

    return interviews


# --------------------------------------------------
# Recruiter: View Interviews
# --------------------------------------------------

@router.get("/recruiter")
def get_recruiter_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view interviews"
        )

    interviews = (
        db.query(Interview)
        .join(Application)
        .join(Job)
        .join(Company)
        .filter(Company.recruiter_id == current_user.id)
        .all()
    )

    return interviews