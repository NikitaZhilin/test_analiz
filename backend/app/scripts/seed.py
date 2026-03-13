#!/usr/bin/env python3
"""
Seed script для создания тестовых данных.
Запуск: python -m app.scripts.seed
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base

# Импорт ВСЕХ моделей для корректной работы relationships
from app.db.models.user import User
from app.db.models.profile import Profile
from app.db.models.report import Report
from app.db.models.result import Result
from app.db.models.analyte import Analyte
from app.core.security import get_password_hash
from app.core.analytes_whitelist import ANALYTES_WHITELIST


def create_tables():
    """Создать таблицы, если не существуют."""
    Base.metadata.create_all(bind=engine)
    print("✓ Таблицы созданы")


def seed_user(db: Session) -> User:
    """Создать тестового пользователя."""
    email = "test@example.com"
    password = "password123"

    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"✓ Пользователь {email} уже существует")
        return user

    user = User(
        email=email,
        hashed_password=get_password_hash(password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"✓ Создан пользователь: {email} / password123")
    return user


def seed_profiles(db: Session, user: User) -> list[Profile]:
    """Создать профили."""
    profiles_data = ["Я", "Миша"]
    profiles = []

    for name in profiles_data:
        profile = db.query(Profile).filter(
            Profile.user_id == user.id,
            Profile.name == name
        ).first()

        if profile:
            print(f"✓ Профиль '{name}' уже существует")
        else:
            profile = Profile(user_id=user.id, name=name)
            db.add(profile)
            print(f"✓ Создан профиль: {name}")
        profiles.append(profile)

    db.commit()
    return profiles


def seed_analytes(db: Session) -> list[Analyte]:
    """Создать справочник показателей из whitelist."""
    analytes = []
    
    for data in ANALYTES_WHITELIST:
        analyte = db.query(Analyte).filter(
            Analyte.canonical_name == data["canonical_name"]
        ).first()

        if analyte:
            # Обновляем существующий показатель
            analyte.display_name_ru = data["display_name_ru"]
            analyte.synonyms = data["synonyms"]
            analyte.default_unit = data["default_unit"]
            print(f"✓ Обновлён показатель: {data['display_name_ru']}")
        else:
            analyte = Analyte(
                canonical_name=data["canonical_name"],
                display_name_ru=data["display_name_ru"],
                synonyms=data["synonyms"],
                default_unit=data["default_unit"]
            )
            db.add(analyte)
            print(f"✓ Создан показатель: {data['display_name_ru']}")
        analytes.append(analyte)

    db.commit()
    return analytes


def main():
    print("=" * 50)
    print("Seed script для создания тестовых данных")
    print("=" * 50)

    # Создать таблицы
    create_tables()

    # Создать сессию
    db = SessionLocal()

    try:
        # Создать пользователя
        user = seed_user(db)

        # Создать профили
        seed_profiles(db, user)

        # Создать показатели
        analytes = seed_analytes(db)

        print("=" * 50)
        print("✓ Seed завершён успешно!")
        print("=" * 50)
        print(f"\nЗагружено показателей: {len(analytes)}")
        print("\nТестовые данные:")
        print("  Email: test@example.com")
        print("  Пароль: password123")
        print("  Профили: Я, Миша")
        print("=" * 50)

    finally:
        db.close()


if __name__ == "__main__":
    main()
