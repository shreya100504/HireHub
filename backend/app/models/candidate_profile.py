from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    phone = Column(String(20))
    education = Column(Text)
    skills = Column(Text)
    experience = Column(Text)
    certifications = Column(Text)
    resume_url = Column(String(255))
    portfolio_url = Column(String(255))
    linkedin_url = Column(String(255))

    user = relationship("User", back_populates="candidate_profile")