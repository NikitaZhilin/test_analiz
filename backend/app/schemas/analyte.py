from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AnalyteBase(BaseModel):
    canonical_name: str
    display_name_ru: str
    default_unit: str | None = None


class AnalyteCreate(AnalyteBase):
    synonyms: list[str] | None = None


class AnalyteUpdate(BaseModel):
    canonical_name: str | None = None
    display_name_ru: str | None = None
    synonyms: list[str] | None = None
    default_unit: str | None = None


class AnalyteResponse(AnalyteBase):
    id: int
    synonyms: Optional[list[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnalyteMatchResponse(BaseModel):
    matched: bool
    analyte: AnalyteResponse | None = None
    suggestions: list[AnalyteResponse] = []
