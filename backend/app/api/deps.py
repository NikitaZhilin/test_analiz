from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.profile import Profile
from app.core.security import decode_token
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None
    jti: Optional[str] = None


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
    x_request_id: Annotated[Optional[str], Header()] = None
) -> User:
    """
    Получение текущего пользователя из JWT токена.
    X-Request-ID используется для аудита и логирования.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Требуется аутентификация",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    # Проверка типа токена
    token_type = payload.get("type")
    if token_type != "access":
        raise credentials_exception

    # Проверка срока действия уже выполнена при decode_token
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Получение активного пользователя."""
    # Здесь можно добавить проверку is_active если нужно
    return current_user


def get_current_profile(
    profile_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> Profile:
    """
    Проверка принадлежности профиля текущему пользователю.
    Предотвращает доступ к чужим профилям (IDOR).
    """
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль не найден или недоступен"
        )

    return profile


# Type aliases для удобства
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentActiveUser = Annotated[User, Depends(get_current_active_user)]
CurrentProfile = Annotated[Profile, Depends(get_current_profile)]
