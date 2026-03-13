from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

from app.schemas.result import ResultResponse


class ReportBase(BaseModel):
    taken_at: date
    lab_name: str | None = None
    comment: str | None = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    taken_at: date | None = None
    lab_name: str | None = None
    comment: str | None = None


class ReportResponse(ReportBase):
    id: int
    profile_id: int
    created_at: datetime
    updated_at: datetime
    results: list[ResultResponse] = []

    class Config:
        from_attributes = True


class ReportListItem(BaseModel):
    id: int
    profile_id: int
    taken_at: date
    lab_name: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime
    results_count: int

    class Config:
        from_attributes = True
