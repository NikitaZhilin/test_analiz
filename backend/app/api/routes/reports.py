from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.profile import Profile
from app.db.models.report import Report
from app.db.models.result import Result
from app.db.models.analyte import Analyte
from app.schemas.report import ReportCreate, ReportUpdate, ReportResponse, ReportListItem
from app.schemas.result import ResultCreate, ResultResponse, ResultWithAnalyteCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


def calculate_flag(value: Decimal, ref_low: Optional[Decimal], ref_high: Optional[Decimal]) -> Optional[str]:
    if ref_low is not None and value < ref_low:
        return "LOW"
    if ref_high is not None and value > ref_high:
        return "HIGH"
    if ref_low is not None and ref_high is not None:
        return "NORMAL"
    return None


@router.get("/profile/{profile_id}", response_model=list[ReportListItem])
def get_reports_by_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    reports = db.query(Report).filter(Report.profile_id == profile_id).all()

    result = []
    for report in reports:
        results_count = db.query(Result).filter(Result.report_id == report.id).count()
        result.append(ReportListItem(
            id=report.id,
            profile_id=report.profile_id,
            taken_at=report.taken_at,
            lab_name=report.lab_name,
            comment=report.comment,
            created_at=report.created_at,
            results_count=results_count
        ))

    return result


@router.post("/profile/{profile_id}", response_model=ReportResponse)
def create_report(
    profile_id: int,
    report_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    report = Report(
        profile_id=profile_id,
        taken_at=report_in.taken_at,
        lab_name=report_in.lab_name,
        comment=report_in.comment
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).options(
        joinedload(Report.results).joinedload(Result.analyte)
    ).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    profile = db.query(Profile).filter(
        Profile.id == report.profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    return report


@router.put("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    report_in: ReportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    profile = db.query(Profile).filter(
        Profile.id == report.profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    if report_in.taken_at is not None:
        report.taken_at = report_in.taken_at
    if report_in.lab_name is not None:
        report.lab_name = report_in.lab_name
    if report_in.comment is not None:
        report.comment = report_in.comment

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    profile = db.query(Profile).filter(
        Profile.id == report.profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    db.delete(report)
    db.commit()

    return {"deleted": True}


@router.post("/{report_id}/results/bulk", response_model=list[ResultResponse])
def bulk_upsert_results(
    report_id: int,
    results_in: list[ResultCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    profile = db.query(Profile).filter(
        Profile.id == report.profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    created_results = []

    for result_in in results_in:
        existing = db.query(Result).filter(
            Result.report_id == report_id,
            Result.analyte_id == result_in.analyte_id
        ).first()

        # Используем флаг из input или вычисляем
        flag = result_in.flag
        if not flag:
            flag = calculate_flag(result_in.value, result_in.ref_low, result_in.ref_high)

        if existing:
            existing.value = result_in.value
            existing.unit = result_in.unit
            existing.ref_low = result_in.ref_low
            existing.ref_high = result_in.ref_high
            existing.flag = flag
            if result_in.raw_name:
                existing.raw_name = result_in.raw_name
            db.add(existing)
            created_results.append(existing)
        else:
            result = Result(
                report_id=report_id,
                analyte_id=result_in.analyte_id,
                value=result_in.value,
                unit=result_in.unit,
                ref_low=result_in.ref_low,
                ref_high=result_in.ref_high,
                flag=flag,
                raw_name=result_in.raw_name
            )
            db.add(result)
            created_results.append(result)

    db.commit()

    for r in created_results:
        db.refresh(r)

    return created_results
