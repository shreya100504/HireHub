from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    actor_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    action = Column(
        String(100),
        nullable=False
    )

    target_id = Column(
        Integer,
        nullable=True
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )

    actor = relationship(
        "User",
        back_populates="audit_logs"
    )