from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    taken_at: Mapped[datetime] = mapped_column(Date, nullable=False)
    lab_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", onupdate=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="reports")
    results = relationship("Result", back_populates="report", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Report(id={self.id}, profile_id={self.profile_id}, taken_at={self.taken_at})>"
