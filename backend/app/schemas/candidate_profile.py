from pydantic import BaseModel
from typing import Optional


class CandidateProfileCreate(BaseModel):
    phone: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    certifications: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_url: Optional[str] = None


class CandidateProfileResponse(CandidateProfileCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True