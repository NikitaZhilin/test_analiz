from pydantic import BaseModel, EmailStr, field_validator
import re


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Валидация сложности пароля."""
        if len(v) < 8:
            raise ValueError("Пароль должен содержать минимум 8 символов")
        
        if len(v) > 128:
            raise ValueError("Пароль не должен превышать 128 символов")
        
        if not re.search(r"[A-Z]", v):
            raise ValueError("Пароль должен содержать заглавную букву")
        
        if not re.search(r"[a-z]", v):
            raise ValueError("Пароль должен содержать строчную букву")
        
        if not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать цифру")
        
        # Проверка на распространённые пароли
        common_passwords = {"password", "password123", "12345678", "qwerty123", "admin123", "123456789"}
        if v.lower() in common_passwords:
            raise ValueError("Этот пароль слишком распространён")
        
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class PasswordReset(BaseModel):
    email: EmailStr
