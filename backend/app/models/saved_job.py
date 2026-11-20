from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class SavedJob(Base):

    __tablename__ = "saved_jobs"

    __table_args__ = (
        UniqueConstraint(
            "candidate_id",
            "job_id",
            name="uq_saved_job_candidate_job"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    candidate_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False
    )

    saved_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    candidate = relationship(
        "User",
        back_populates="saved_jobs"
    )

    job = relationship(
        "Job",
        back_populates="saved_jobs"
    )