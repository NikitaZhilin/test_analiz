import re
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.profile import Profile
from app.db.models.report import Report
from app.db.models.result import Result
from app.db.models.analyte import Analyte
from app.schemas.import_preview import (
    ImportPreviewResponse,
    ImportPreviewRow,
    ImportConfirmRequest,
    ImportConfirmResponse
)
from app.api.deps import get_current_user
from app.services.importers.pdf_importer import PDFImporter
from app.services.analyte_matcher import AnalyteMatcher

router = APIRouter(prefix="/import", tags=["import"])

# Безопасные параметры для загрузки файлов
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {"application/pdf"}
ALLOWED_EXTENSIONS = {".pdf"}

# PDF magic bytes
PDF_MAGIC_BYTES = b"%PDF-"


def validate_file_upload(file: UploadFile) -> None:
    """
    Валидация загружаемого файла.
    Проверяет расширение, MIME-type и magic bytes.
    """
    # Проверка расширения
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Имя файла не указано"
        )
    
    filename_lower = file.filename.lower()
    ext = "." + filename_lower.split(".")[-1] if "." in filename_lower else ""
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимый формат файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Проверка MIME-type
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимый MIME-type: {file.content_type}. Ожидается: application/pdf"
        )


def validate_pdf_content(content: bytes) -> bool:
    """Проверка magic bytes PDF файла."""
    return content.startswith(PDF_MAGIC_BYTES)


def get_importer(filename: str):
    """Возвращает импортер для файла. Поддерживается только PDF."""
    if filename.lower().endswith(".pdf"):
        return PDFImporter()
    return None


@router.post("/profile/{profile_id}/preview")
def preview_import(
    profile_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Проверка принадлежности профиля
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль не найден"
        )

    # Валидация файла
    validate_file_upload(file)

    # Чтение и проверка содержимого
    content = file.file.read()
    
    # Проверка размера
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Файл слишком большой. Максимальный размер: 10 MB"
        )
    
    # Проверка magic bytes
    if not validate_pdf_content(content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл не является корректным PDF"
        )

    importer = get_importer(file.filename)
    if not importer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неподдерживаемый формат файла"
        )

    try:
        rows = importer.parse(content)
    except Exception as e:
        # Не раскрываем детали ошибок парсинга
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ошибка обработки файла"
        )

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось извлечь данные из PDF"
        )

    matcher = AnalyteMatcher(db)
    parsed_rows = []
    unmatched_count = 0
    matched_count = 0

    for idx, row in enumerate(rows):
        analyte_raw = row.get("analyte_raw")
        matched_analyte = None
        matched = False
        similar_analytes = []
        errors = []

        if analyte_raw:
            match_result = matcher.find_match(analyte_raw)
            if match_result:
                matched = True
                matched_analyte = match_result
                matched_count += 1
            else:
                unmatched_count += 1
                similar_analytes = matcher.find_similar(analyte_raw, limit=3)

        if row.get("value") is None:
            errors.append("Missing value")

        parsed_rows.append(ImportPreviewRow(
            row_index=idx,
            analyte_raw=analyte_raw,
            value=Decimal(str(row["value"])) if row.get("value") is not None else Decimal(0),
            unit=row.get("unit"),
            ref_low=Decimal(str(row["ref_low"])) if row.get("ref_low") is not None else None,
            ref_high=Decimal(str(row["ref_high"])) if row.get("ref_high") is not None else None,
            flag=row.get("flag"),
            matched=matched,
            analyte=matched_analyte,
            similar_analytes=similar_analytes,
            errors=errors
        ))

    return ImportPreviewResponse(
        parsed_rows=parsed_rows,
        unmatched_count=unmatched_count,
        matched_count=matched_count,
        filtered_out_rows_count=0  # PDFImporter уже отфильтровал metadata
    )


@router.post("/profile/{profile_id}/confirm", response_model=ImportConfirmResponse)
def confirm_import(
    profile_id: int,
    import_data: ImportConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Проверка принадлежности профиля
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль не найден"
        )

    # Валидация входных данных
    if not import_data.rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нет данных для импорта"
        )

    # Ограничение на количество результатов за раз
    if len(import_data.rows) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Слишком много результатов. Максимум: 100"
        )

    report = Report(
        profile_id=profile_id,
        taken_at=import_data.taken_at,
        lab_name=import_data.lab_name,
        comment=import_data.comment
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    created_results = []

    for row in import_data.rows:
        analyte_id = row.analyte_id

        # Создание нового аналита только если явно указано
        if row.create_new_analyte and row.analyte_name:
            # Санитизация названия
            safe_name = re.sub(r'[<>"/\\;]', '', row.analyte_name)[:100]
            
            new_analyte = Analyte(
                canonical_name=safe_name.lower().replace(" ", "_")[:50],
                display_name_ru=safe_name,
                synonyms=[safe_name],
                default_unit=row.unit
            )
            db.add(new_analyte)
            db.commit()
            db.refresh(new_analyte)
            analyte_id = new_analyte.id
        elif not analyte_id:
            continue

        # Валидация значения
        if row.value < 0:
            continue  # Пропускаем некорректные значения
        
        # Используем флаг из preview или вычисляем
        flag = row.flag
        if not flag and row.ref_low is not None and row.ref_high is not None:
            if row.value < row.ref_low:
                flag = "LOW"
            elif row.value > row.ref_high:
                flag = "HIGH"

        result = Result(
            report_id=report.id,
            analyte_id=analyte_id,
            value=row.value,
            unit=row.unit,
            ref_low=row.ref_low,
            ref_high=row.ref_high,
            flag=flag,
            raw_name=row.raw_name or row.analyte_name
        )
        db.add(result)
        created_results.append(result)

    db.commit()

    return ImportConfirmResponse(
        report_id=report.id,
        created_results=len(created_results)
    )
