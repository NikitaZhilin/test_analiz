from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Analyte(Base):
    __tablename__ = "analytes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    canonical_name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    display_name_ru: Mapped[str] = mapped_column(String(255), nullable=False)
    synonyms: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    default_unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", onupdate=datetime.utcnow, nullable=False)

    results = relationship("Result", back_populates="analyte")

    def __repr__(self) -> str:
        return f"<Analyte(id={self.id}, canonical_name={self.canonical_name})>"
