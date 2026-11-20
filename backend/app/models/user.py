from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate_profile = relationship(
        "CandidateProfile",
        back_populates="user",
        uselist=False
    )

    company = relationship(
        "Company",
        back_populates="recruiter",
        uselist=False
    )

    applications = relationship(
        "Application",
        back_populates="candidate"
    )

    saved_jobs = relationship(
        "SavedJob",
        back_populates="candidate"
    )

    notifications = relationship(
        "Notification",
        back_populates="user"
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="actor"
    )