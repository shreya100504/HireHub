from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False
    )

    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    skills = Column(String(500), nullable=True)
    experience_level = Column(String(100), nullable=True)
    employment_type = Column(String(50), nullable=True)
    location = Column(String(150), nullable=True)
    is_remote = Column(Boolean, default=False)

    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)

    openings = Column(Integer, default=1)
    application_deadline = Column(DateTime, nullable=True)

    status = Column(String(50), default="pending")

    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="jobs")

    applications = relationship("Application", back_populates="job")

    saved_jobs = relationship("SavedJob", back_populates="job")