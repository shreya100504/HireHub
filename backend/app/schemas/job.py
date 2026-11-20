from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobCreate(BaseModel):
    title: str
    description: str
    skills: Optional[str] = None
    experience_level: Optional[str] = None
    employment_type: Optional[str] = None
    location: Optional[str] = None
    is_remote: bool = False
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    openings: int = 1
    application_deadline: Optional[datetime] = None


class JobResponse(BaseModel):
    id: int
    company_id: int
    title: str
    description: str
    skills: Optional[str]
    experience_level: Optional[str]
    employment_type: Optional[str]
    location: Optional[str]
    is_remote: bool
    salary_min: Optional[int]
    salary_max: Optional[int]
    openings: int
    application_deadline: Optional[datetime]
    status: str

    class Config:
        from_attributes = True