from datetime import datetime
from typing import Optional
from decimal import Decimal
from sqlalchemy import String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Result(Base):
    __tablename__ = "results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    analyte_id: Mapped[int] = mapped_column(ForeignKey("analytes.id", ondelete="RESTRICT"), nullable=False, index=True)
    value: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ref_low: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 4), nullable=True)
    ref_high: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 4), nullable=True)
    flag: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    raw_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", onupdate=datetime.utcnow, nullable=False)

    report = relationship("Report", back_populates="results")
    analyte = relationship("Analyte", back_populates="results")

    def __repr__(self) -> str:
        return f"<Result(id={self.id}, report_id={self.report_id}, analyte_id={self.analyte_id}, value={self.value})>"
