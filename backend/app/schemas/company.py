from pydantic import BaseModel
from typing import Optional


class CompanyCreate(BaseModel):
    company_name: str
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None


class CompanyResponse(BaseModel):
    id: int
    recruiter_id: int
    company_name: str
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None

    class Config:
        from_attributes = True