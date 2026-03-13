from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

from app.schemas.analyte import AnalyteResponse


class ResultBase(BaseModel):
    value: Decimal
    unit: str | None = None
    ref_low: Decimal | None = None
    ref_high: Decimal | None = None
    raw_name: str | None = None


class ResultCreate(ResultBase):
    analyte_id: int
    flag: str | None = None


class ResultUpdate(BaseModel):
    value: Decimal | None = None
    unit: str | None = None
    ref_low: Decimal | None = None
    ref_high: Decimal | None = None


class ResultResponse(ResultBase):
    id: int
    report_id: int
    analyte_id: int
    flag: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    analyte: AnalyteResponse | None = None

    class Config:
        from_attributes = True


class ResultWithAnalyteCreate(BaseModel):
    analyte_id: int | None = None
    create_new_analyte: bool = False
    analyte_name: str | None = None
    value: Decimal
    unit: str | None = None
    ref_low: Decimal | None = None
    ref_high: Decimal | None = None
    raw_name: str | None = None
