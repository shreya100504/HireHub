from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=False
    )

    scheduled_at = Column(DateTime, nullable=False)

    interview_type = Column(String(50))
    meeting_link = Column(String(255))
    venue = Column(String(255))

    feedback = Column(Text)

    status = Column(
        String(30),
        default="scheduled"
    )

    application = relationship(
        "Application",
        back_populates="interviews"
    )