import secrets
from datetime import datetime, timedelta
from typing import Any

from jose import jwt
import bcrypt

from app.core.config import settings


def create_access_token(subject: int | str, expires_delta: timedelta | None = None) -> str:
    """Создание access токена с ограниченным временем жизни."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": secrets.token_hex(16)  # Уникальный ID токена для отзыва
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: int | str, expires_delta: timedelta | None = None) -> str:
    """Создание refresh токена."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": secrets.token_hex(16)  # Уникальный ID токена
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Безопасная проверка пароля с constant-time сравнением."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    """Хеширование пароля с bcrypt и случайной солью."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def decode_token(token: str) -> dict[str, Any] | None:
    """Декодирование и валидация JWT токена."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Проверка сложности пароля.
    Возвращает (успех, сообщение об ошибке).
    """
    if len(password) < 8:
        return False, "Пароль должен содержать минимум 8 символов"
    
    if len(password) > 128:
        return False, "Пароль не должен превышать 128 символов"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    if not (has_upper and has_lower and has_digit):
        return False, "Пароль должен содержать заглавные буквы, строчные буквы и цифры"
    
    # Проверка на распространённые пароли
    common_passwords = {"password", "password123", "12345678", "qwerty123", "admin123"}
    if password.lower() in common_passwords:
        return False, "Этот пароль слишком распространён, выберите другой"
    
    return True, ""
