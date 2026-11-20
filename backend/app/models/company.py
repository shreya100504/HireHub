from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    location = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    recruiter = relationship(
        "User", 
        back_populates="company"
    )

    jobs = relationship("Job", back_populates="company")

    # company = relationship("Company", back_populates="recruiter")