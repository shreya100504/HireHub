from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyResponse
from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/api/companies",
    tags=["Company"]
)


@router.post("/profile", response_model=CompanyResponse)
def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can create a company profile"
        )

    existing_company = db.query(Company).filter(
        Company.recruiter_id == current_user.id
    ).first()

    if existing_company:
        raise HTTPException(
            status_code=400,
            detail="Company profile already exists"
        )

    company = Company(
        recruiter_id=current_user.id,
        company_name=company_data.company_name,
        description=company_data.description,
        website=company_data.website,
        location=company_data.location
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return company


@router.get("/profile", response_model=CompanyResponse)
def get_company(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view a company profile"
        )

    company = db.query(Company).filter(
        Company.recruiter_id == current_user.id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company profile not found"
        )

    return company