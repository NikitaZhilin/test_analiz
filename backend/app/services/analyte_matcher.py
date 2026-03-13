from typing import Optional
from sqlalchemy.orm import Session

from app.db.models.analyte import Analyte
from app.db.models.user import User  # Import all models to configure relationships
from app.db.models.profile import Profile
from app.db.models.report import Report
from app.db.models.result import Result
from app.schemas.analyte import AnalyteResponse


class AnalyteMatcher:
    """
    Строгий матчер названий анализов по whitelist справочнику.
    Использует точное匹配 по синонимам и названиям.
    """
    
    def __init__(self, db: Session):
        self.db = db
        # Кэшируем все аналиты при инициализации
        self._analytes_cache: list[Analyte] = []
        self._synonym_map: dict[str, Analyte] = {}
        self._name_map: dict[str, Analyte] = {}
        self._canonical_map: dict[str, Analyte] = {}
        self._load_cache()

    def _load_cache(self):
        """Загрузка кэша всех аналитов."""
        self._analytes_cache = self.db.query(Analyte).all()
        
        for analyte in self._analytes_cache:
            # canonical_name -> analyte
            self._canonical_map[analyte.canonical_name.lower()] = analyte
            
            # display_name_ru -> analyte
            self._name_map[analyte.display_name_ru.lower()] = analyte
            
            # synonyms -> analyte
            if analyte.synonyms:
                for synonym in analyte.synonyms:
                    self._synonym_map[synonym.lower()] = analyte

    def _normalize(self, name: str) -> str:
        """Нормализация названия для поиска."""
        return name.lower().strip().replace(" ", "_").replace("-", "_").replace(".", "")

    def _clean_name(self, name: str) -> str:
        """Очистка названия от мусора перед поиском."""
        if not name:
            return ""
        
        # Удаляем лишние пробелы
        name = ' '.join(name.split())
        
        # Удаляем коды исследований
        import re
        name = re.sub(r'\s*[A-Z]\d{2}\.\d{2}\.\d{3}(?:\.\d{3})?\s*', ' ', name)
        name = re.sub(r'\s*\([^)]*Приказ.*\)', '', name)
        
        # Удаляем флаги в конце
        name = re.sub(r'\s*[+\-]+$', '', name)
        
        return ' '.join(name.split()).strip()

    def find_match(self, name: str) -> Optional[AnalyteResponse]:
        """
        Поиск точного соответствия в справочнике.
        Возвращает None, если нет точного совпадения.
        """
        if not name:
            return None
        
        # Очищаем название
        cleaned_name = self._clean_name(name)
        name_lower = cleaned_name.lower().strip()
        
        # 1. Точное匹配 по canonical_name
        if name_lower in self._canonical_map:
            return AnalyteResponse.model_validate(self._canonical_map[name_lower])
        
        # 2. Точное匹配 по display_name_ru
        if name_lower in self._name_map:
            return AnalyteResponse.model_validate(self._name_map[name_lower])
        
        # 3. Точное匹配 по синонимам
        if name_lower in self._synonym_map:
            return AnalyteResponse.model_validate(self._synonym_map[name_lower])
        
        # 4. Частичное匹配 по display_name_ru (содержит название)
        for analyte in self._analytes_cache:
            # Проверяем, содержится ли искомое название в display_name_ru
            if name_lower in analyte.display_name_ru.lower():
                return AnalyteResponse.model_validate(analyte)
            
            # Проверяем, содержится ли display_name_ru в искомом названии
            if analyte.display_name_ru.lower() in name_lower:
                return AnalyteResponse.model_validate(analyte)
            
            # Проверяем синонимы
            if analyte.synonyms:
                for synonym in analyte.synonyms:
                    synonym_lower = synonym.lower()
                    # Точное совпадение синонима
                    if synonym_lower == name_lower:
                        return AnalyteResponse.model_validate(analyte)
                    # Синоним содержится в названии
                    if synonym_lower in name_lower and len(synonym_lower) > 2:
                        return AnalyteResponse.model_validate(analyte)
                    # Название содержится в синониме
                    if name_lower in synonym_lower and len(name_lower) > 2:
                        return AnalyteResponse.model_validate(analyte)
        
        # 5. Поиск по подстроке без пробелов
        name_no_spaces = name_lower.replace(" ", "")
        for analyte in self._analytes_cache:
            display_no_spaces = analyte.display_name_ru.lower().replace(" ", "")
            if name_no_spaces in display_no_spaces or display_no_spaces in name_no_spaces:
                return AnalyteResponse.model_validate(analyte)
            
            if analyte.synonyms:
                for synonym in analyte.synonyms:
                    synonym_no_spaces = synonym.lower().replace(" ", "")
                    if name_no_spaces in synonym_no_spaces or synonym_no_spaces in name_no_spaces:
                        return AnalyteResponse.model_validate(analyte)
        
        return None

    def find_similar(self, name: str, limit: int = 5) -> list[AnalyteResponse]:
        """
        Поиск похожих названий для unmatched показателей.
        Возвращает список кандидатов для ручного выбора.
        """
        if not name:
            return []
        
        name_lower = self._clean_name(name).lower().strip()
        results = []
        
        # Ищем по частичному совпадению
        for analyte in self._analytes_cache:
            score = 0
            
            # Совпадение с display_name_ru
            if name_lower in analyte.display_name_ru.lower():
                score += 3
            if analyte.display_name_ru.lower() in name_lower:
                score += 2
            
            # Совпадение с синонимами
            if analyte.synonyms:
                for synonym in analyte.synonyms:
                    synonym_lower = synonym.lower()
                    if synonym_lower == name_lower:
                        score += 5
                    elif synonym_lower in name_lower:
                        score += 2
                    elif name_lower in synonym_lower:
                        score += 1
            
            # Совпадение с canonical_name
            if name_lower in analyte.canonical_name.lower():
                score += 2
            
            if score > 0:
                results.append((score, analyte))
        
        # Сортируем по score и возвращаем limit
        results.sort(key=lambda x: -x[0])
        return [AnalyteResponse.model_validate(a) for _, a in results[:limit]]

    def get_all_analytes(self) -> list[AnalyteResponse]:
        """Возвращает все аналиты из справочника."""
        return [AnalyteResponse.model_validate(a) for a in self._analytes_cache]
