from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from sqlalchemy.orm import Session

from pathlib import Path
from uuid import uuid4

from app.database import get_db

from app.models.candidate_profile import CandidateProfile

from app.schemas.candidate_profile import (
    CandidateProfileCreate,
    CandidateProfileResponse
)

from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/api/candidates",
    tags=["Candidate"]
)


# =====================================================
# CREATE PROFILE
# =====================================================

@router.post(
    "/profile",
    response_model=CandidateProfileResponse
)
def create_profile(
    profile: CandidateProfileCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can create a candidate profile"
        )

    existing_profile = (
        db.query(CandidateProfile)
        .filter(
            CandidateProfile.user_id == current_user.id
        )
        .first()
    )

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Candidate profile already exists"
        )

    new_profile = CandidateProfile(
        user_id=current_user.id,
        **profile.model_dump()
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


# =====================================================
# GET PROFILE
# =====================================================

@router.get(
    "/profile",
    response_model=CandidateProfileResponse
)
def get_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can access this profile"
        )

    profile = (
        db.query(CandidateProfile)
        .filter(
            CandidateProfile.user_id == current_user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    return profile


# =====================================================
# UPDATE PROFILE
# =====================================================

@router.put(
    "/profile",
    response_model=CandidateProfileResponse
)
def update_profile(
    profile: CandidateProfileCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can update a candidate profile"
        )

    existing_profile = (
        db.query(CandidateProfile)
        .filter(
            CandidateProfile.user_id == current_user.id
        )
        .first()
    )

    if not existing_profile:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    profile_data = profile.model_dump(
        exclude_unset=True
    )

    for field, value in profile_data.items():
        setattr(
            existing_profile,
            field,
            value
        )

    db.commit()
    db.refresh(existing_profile)

    return existing_profile


# =====================================================
# RESUME UPLOAD
# =====================================================

@router.post("/resume")
async def upload_resume(
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can upload resumes"
        )

    allowed_extensions = {
        ".pdf",
        ".doc",
        ".docx"
    }

    extension = Path(
        resume.filename or ""
    ).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOC, and DOCX files are allowed"
        )

    upload_dir = (
        Path(__file__).resolve().parents[2]
        / "uploads"
        / "resumes"
    )

    upload_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    filename = (
        f"candidate_"
        f"{current_user.id}_"
        f"{uuid4().hex}"
        f"{extension}"
    )

    file_path = upload_dir / filename

    contents = await resume.read()

    max_size = 5 * 1024 * 1024

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Resume file must be 5 MB or smaller"
        )

    file_path.write_bytes(contents)

    resume_url = (
        f"/uploads/resumes/{filename}"
    )

    # Save resume URL into candidate profile
    profile = (
        db.query(CandidateProfile)
        .filter(
            CandidateProfile.user_id == current_user.id
        )
        .first()
    )

    if profile:
        profile.resume_url = resume_url
        db.commit()

    return {
        "message": "Resume uploaded successfully",
        "filename": filename,
        "resume_url": resume_url
    }