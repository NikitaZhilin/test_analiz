from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

from app.schemas.analyte import AnalyteResponse


class ImportPreviewRow(BaseModel):
    row_index: int
    analyte_raw: str | None = None
    value: Decimal
    unit: str | None = None
    ref_low: Optional[Decimal] = None
    ref_high: Optional[Decimal] = None
    flag: str | None = None
    matched: bool
    analyte: AnalyteResponse | None = None
    similar_analytes: list[AnalyteResponse] = []  # Подсказки для unmatched
    errors: list[str] = []


class ImportPreviewResponse(BaseModel):
    parsed_rows: list[ImportPreviewRow]
    unmatched_count: int = 0
    matched_count: int = 0
    filtered_out_rows_count: int = 0  # Сколько строк отфильтровано как metadata/non-analyte


class ImportConfirmRow(BaseModel):
    row_index: int
    analyte_id: int | None = None
    create_new_analyte: bool = False
    analyte_name: str | None = None
    value: Decimal
    unit: str | None = None
    ref_low: Optional[Decimal] = None
    ref_high: Optional[Decimal] = None
    flag: str | None = None
    raw_name: str | None = None


class ImportConfirmRequest(BaseModel):
    taken_at: date
    lab_name: str | None = None
    comment: str | None = None
    rows: list[ImportConfirmRow]


class ImportConfirmResponse(BaseModel):
    report_id: int
    created_results: int
