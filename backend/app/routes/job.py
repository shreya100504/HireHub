from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.job import Job
from app.models.company import Company
from app.models.saved_job import SavedJob
from app.schemas.job import JobCreate, JobResponse
from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)


# =====================================================
# CREATE JOB
# =====================================================

@router.post("/", response_model=JobResponse)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can create jobs"
        )

    company = db.query(Company).filter(
        Company.recruiter_id == current_user.id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company profile not found"
        )

    new_job = Job(
        company_id=company.id,
        title=job_data.title,
        description=job_data.description,
        skills=job_data.skills,
        experience_level=job_data.experience_level,
        employment_type=job_data.employment_type,
        location=job_data.location,
        is_remote=job_data.is_remote,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
        openings=job_data.openings,
        application_deadline=job_data.application_deadline,
        status="pending"
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


# =====================================================
# GET APPROVED JOBS WITH ADVANCED FILTERS
# =====================================================

@router.get("/", response_model=list[JobResponse])
def get_jobs(
    keyword: str = Query(None),
    location: str = Query(None),
    experience_level: str = Query(None),
    employment_type: str = Query(None),
    is_remote: bool = Query(None),
    min_salary: int = Query(None),
    max_salary: int = Query(None),

    db: Session = Depends(get_db)
):

    # Only show approved jobs
    query = db.query(Job).filter(
        Job.status == "approved"
    )

    # Search by title, skills or description
    if keyword:
        search = f"%{keyword.strip().lower()}%"

        query = query.filter(
            (func.lower(Job.title).like(search)) |
            (func.lower(Job.skills).like(search)) |
            (func.lower(Job.description).like(search))
        )

    # Filter by location
    if location:
        query = query.filter(
            func.lower(Job.location).like(
                f"%{location.strip().lower()}%"
            )
        )

    # Filter by experience
    if experience_level:
        query = query.filter(
            func.lower(Job.experience_level) ==
            experience_level.strip().lower()
        )

    # Filter by employment type
    if employment_type:
        query = query.filter(
            func.lower(Job.employment_type) ==
            employment_type.strip().lower()
        )

    # Filter remote / on-site jobs
    if is_remote is not None:
        query = query.filter(
            Job.is_remote == is_remote
        )

    # Minimum salary filter
    if min_salary is not None:
        query = query.filter(
            Job.salary_max >= min_salary
        )

    # Maximum salary filter
    if max_salary is not None:
        query = query.filter(
            Job.salary_min <= max_salary
        )

    return query.order_by(
        Job.created_at.desc()
    ).all()

# =====================================================
# GET RECRUITER'S OWN JOBS
# =====================================================

@router.get("/my-jobs", response_model=list[JobResponse])
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view their jobs"
        )

    company = db.query(Company).filter(
        Company.recruiter_id == current_user.id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company profile not found"
        )

    jobs = db.query(Job).filter(
        Job.company_id == company.id
    ).all()

    return jobs


# =====================================================
# EDIT JOB
# =====================================================

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can edit jobs"
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
            detail="You are not authorized to edit this job"
        )

    job.title = job_data.title
    job.description = job_data.description
    job.skills = job_data.skills
    job.experience_level = job_data.experience_level
    job.employment_type = job_data.employment_type
    job.location = job_data.location
    job.is_remote = job_data.is_remote
    job.salary_min = job_data.salary_min
    job.salary_max = job_data.salary_max
    job.openings = job_data.openings
    job.application_deadline = job_data.application_deadline

    # Edited jobs require admin approval again.
    job.status = "pending"

    db.commit()
    db.refresh(job)

    return job


# =====================================================
# CLOSE JOB
# =====================================================

@router.put("/{job_id}/close", response_model=JobResponse)
def close_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can close jobs"
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
            detail="You are not authorized to close this job"
        )

    job.status = "closed"

    db.commit()
    db.refresh(job)

    return job


# =====================================================
# SAVE JOB
# =====================================================

@router.post("/{job_id}/save")
def save_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can save jobs"
        )

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.status == "approved"
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Approved job not found"
        )

    existing = db.query(SavedJob).filter(
        SavedJob.candidate_id == current_user.id,
        SavedJob.job_id == job_id
    ).first()

    if existing:
        return {
            "message": "Job already saved",
            "job_id": job_id
        }

    saved_job = SavedJob(
        candidate_id=current_user.id,
        job_id=job_id
    )

    db.add(saved_job)
    db.commit()

    return {
        "message": "Job saved successfully",
        "job_id": job_id
    }


# =====================================================
# UNSAVE JOB
# =====================================================

@router.delete("/{job_id}/save")
def unsave_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can manage saved jobs"
        )

    saved_job = db.query(SavedJob).filter(
        SavedJob.candidate_id == current_user.id,
        SavedJob.job_id == job_id
    ).first()

    if not saved_job:
        raise HTTPException(
            status_code=404,
            detail="Job is not saved"
        )

    db.delete(saved_job)
    db.commit()

    return {
        "message": "Job removed from saved jobs",
        "job_id": job_id
    }


# =====================================================
# GET SAVED JOBS
# =====================================================

@router.get("/saved")
def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can view saved jobs"
        )

    saved_jobs = (
        db.query(Job)
        .join(
            SavedJob,
            SavedJob.job_id == Job.id
        )
        .filter(
            SavedJob.candidate_id == current_user.id
        )
        .all()
    )

    return saved_jobs