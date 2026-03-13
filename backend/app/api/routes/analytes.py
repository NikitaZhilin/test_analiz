from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.profile import Profile
from app.db.models.report import Report
from app.db.models.result import Result
from app.db.models.analyte import Analyte
from app.schemas.analyte import AnalyteCreate, AnalyteUpdate, AnalyteResponse, AnalyteMatchResponse
from app.api.deps import get_current_user
from app.services.analyte_matcher import AnalyteMatcher

router = APIRouter(prefix="/analytes", tags=["analytes"])


@router.get("", response_model=list[AnalyteResponse])
def get_analytes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analytes = db.query(Analyte).all()
    return analytes


@router.post("", response_model=AnalyteResponse)
def create_analyte(
    analyte_in: AnalyteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Analyte).filter(
        Analyte.canonical_name == analyte_in.canonical_name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analyte with this canonical_name already exists"
        )

    analyte = Analyte(
        canonical_name=analyte_in.canonical_name,
        display_name_ru=analyte_in.display_name_ru,
        synonyms=analyte_in.synonyms or [],
        default_unit=analyte_in.default_unit
    )
    db.add(analyte)
    db.commit()
    db.refresh(analyte)

    return analyte


@router.get("/match", response_model=AnalyteMatchResponse)
def match_analyte(
    name: str = Query(..., description="Analyte name to match"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    matcher = AnalyteMatcher(db)
    result = matcher.find_match(name)

    if result:
        return AnalyteMatchResponse(
            matched=True,
            analyte=result,
            suggestions=[]
        )

    suggestions = matcher.find_similar(name, limit=3)
    return AnalyteMatchResponse(
        matched=False,
        analyte=None,
        suggestions=suggestions
    )


@router.get("/profile/{profile_id}", response_model=list[AnalyteResponse])
def get_profile_analytes(
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
            detail="Профиль не найден"
        )

    # Получаем все аналиты через подзапрос
    analyte_ids = db.query(Result.analyte_id).join(Report).filter(
        Report.profile_id == profile_id
    ).distinct()
    
    analytes = db.query(Analyte).filter(Analyte.id.in_(analyte_ids)).all()

    return analytes


@router.get("/profile/{profile_id}/{analyte_id}/series")
def get_analyte_series(
    profile_id: int,
    analyte_id: int,
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

    analyte = db.query(Analyte).filter(Analyte.id == analyte_id).first()
    if not analyte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analyte not found"
        )

    results = db.query(Result).join(Report).filter(
        Result.analyte_id == analyte_id,
        Report.profile_id == profile_id
    ).order_by(Report.taken_at).all()

    points = []
    for result in results:
        points.append({
            "date": result.report.taken_at,
            "value": float(result.value),
            "unit": result.unit or analyte.default_unit,
            "ref_low": float(result.ref_low) if result.ref_low else None,
            "ref_high": float(result.ref_high) if result.ref_high else None,
            "report_id": result.report_id
        })

    return {
        "analyte": {
            "id": analyte.id,
            "display_name_ru": analyte.display_name_ru,
            "default_unit": analyte.default_unit
        },
        "points": points
    }
