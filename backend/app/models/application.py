from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False
    )

    candidate_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    status = Column(
        String(50),
        default="applied"
    )

    cover_letter = Column(
        String(1000),
        nullable=True
    )

    applied_at = Column(
        DateTime,
        server_default=func.getdate()
    )

    job = relationship(
        "Job",
        back_populates="applications"
    )

    candidate = relationship(
        "User",
        back_populates="applications"
    )

    interviews = relationship(
        "Interview",
        back_populates="application"
    )