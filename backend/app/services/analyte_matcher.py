from typing import Optional
import re
from sqlalchemy.orm import Session

from app.db.models.analyte import Analyte
from app.db.models.user import User
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
        """
        Нормализация названия для поиска.
        - trim
        - lowercase
        - убрать лишние пробелы
        - убрать двоеточия, точки в конце
        - унифицировать рус/англ обозначения
        """
        if not name:
            return ""
        
        # Trim и lowercase
        normalized = name.strip().lower()
        
        # Убрать лишние пробелы
        normalized = ' '.join(normalized.split())
        
        # Убрать двоеточия, точки в конце
        normalized = normalized.rstrip(':.').strip()
        
        # Убрать скобки с пояснениями (но не все)
        # Оставляем (HGB), (RBC) и т.д. - это важные обозначения
        normalized = re.sub(r'\s*\([^)]*Приказ[^)]*\)', '', normalized)
        normalized = re.sub(r'\s*\([^)]*венозная[^)]*\)', '', normalized, flags=re.IGNORECASE)
        normalized = re.sub(r'\s*\([^)]*капиллярная[^)]*\)', '', normalized, flags=re.IGNORECASE)
        
        # Убрать коды исследований типа A12.345.678
        normalized = re.sub(r'\s*[A-Z]\d{2}\.\d{2}\.\d{3}(?:\.\d{3})?', '', normalized)
        
        # Заменить дефисы и точки на подчеркивания для canonical match
        normalized = normalized.replace("-", "_").replace(".", "_")
        
        return normalized.strip()

    def _clean_name(self, name: str) -> str:
        """Очистка названия от мусора перед поиском."""
        if not name:
            return ""

        # Удаляем лишние пробелы
        name = ' '.join(name.split())

        # Удаляем коды исследований
        name = re.sub(r'\s*[A-Z]\d{2}\.\d{2}\.\d{3}(?:\.\d{3})?\s*', ' ', name)
        name = re.sub(r'\s*\([^)]*Приказ.*\)', '', name)

        # Удаляем флаги в конце
        name = re.sub(r'\s*[+\-]+$', '', name)
        
        # Убираем двоеточия
        name = name.rstrip(':').strip()

        return ' '.join(name.split()).strip()

    def _exact_match(self, name: str) -> Optional[Analyte]:
        """Точный match по нормализованному названию."""
        normalized = self._normalize(name)
        
        # 1. Exact match по canonical_name
        if normalized in self._canonical_map:
            return self._canonical_map[normalized]
        
        # 2. Exact match по display_name_ru
        if normalized in self._name_map:
            return self._name_map[normalized]
        
        # 3. Exact match по синонимам
        if normalized in self._synonym_map:
            return self._synonym_map[normalized]
        
        # 4. Exact match без подчеркиваний (для HGB, RBC и т.д.)
        no_underscore = normalized.replace("_", "")
        if no_underscore in self._canonical_map:
            return self._canonical_map[no_underscore]
        if no_underscore in self._name_map:
            return self._name_map[no_underscore]
        if no_underscore in self._synonym_map:
            return self._synonym_map[no_underscore]
        
        return None

    def _synonym_match(self, name: str) -> Optional[Analyte]:
        """Match по синонимам (содержание синонима в названии)."""
        cleaned = self._clean_name(name).lower()
        
        for analyte in self._analytes_cache:
            if analyte.synonyms:
                for synonym in analyte.synonyms:
                    synonym_lower = synonym.lower().strip()
                    
                    # Exact match синонима
                    if synonym_lower == cleaned:
                        return analyte
                    
                    # Синоним содержится в названии (длинные синонимы > 3 символов)
                    if len(synonym_lower) > 3 and synonym_lower in cleaned:
                        return analyte
                    
                    # Название содержится в синониме
                    if len(cleaned) > 3 and cleaned in synonym_lower:
                        return analyte
        
        return None

    def _display_match(self, name: str) -> Optional[Analyte]:
        """Match по display_name_ru (содержание)."""
        cleaned = self._clean_name(name).lower()
        
        for analyte in self._analytes_cache:
            display_lower = analyte.display_name_ru.lower().strip()
            
            # Exact match display
            if display_lower == cleaned:
                return analyte
            
            # Display содержится в названии (для длинных названий)
            if len(display_lower) > 3 and display_lower in cleaned:
                return analyte
            
            # Название содержится в display
            if len(cleaned) > 3 and cleaned in display_lower:
                return analyte
        
        return None

    def _safe_partial_match(self, name: str) -> Optional[Analyte]:
        """Безопасный partial match только для однозначных случаев."""
        cleaned = self._clean_name(name).lower()
        
        # Короткие однозначные аббревиатуры
        short_matches = {
            'hgb': 'hemoglobin',
            'hb': 'hemoglobin',
            'rbc': 'rbc',
            'wbc': 'wbc',
            'hct': 'hematocrit',
            'plt': 'platelets',
            'mcv': 'mcv',
            'mch': 'mch',
            'mchc': 'mchc',
            'rdw': 'rdw_cv',
            'mpv': 'mpv',
            'pdw': 'pdw',
            'pct': 'pct',
            'esr': 'esr',
            'соэ': 'esr',
            'roe': 'esr',
        }
        
        # Проверяем короткие аббревиатуры
        if cleaned in short_matches:
            canonical = short_matches[cleaned]
            if canonical in self._canonical_map:
                return self._canonical_map[canonical]
        
        # Проверяем startswith для %-показателей
        if cleaned.endswith('%') or cleaned.endswith(' проц'):
            base = cleaned.replace('%', '').replace(' проц', '').strip()
            for analyte in self._analytes_cache:
                if '_percent' in analyte.canonical_name:
                    if base in analyte.canonical_name.lower() or base in analyte.display_name_ru.lower():
                        return analyte
        
        # Проверяем startswith для abs-показателей
        if 'abs' in cleaned or '#' in cleaned:
            base = cleaned.replace('abs', '').replace('#', '').strip()
            for analyte in self._analytes_cache:
                if '_abs' in analyte.canonical_name:
                    if base in analyte.canonical_name.lower() or base in analyte.display_name_ru.lower():
                        return analyte
        
        return None

    def find_match(self, name: str) -> Optional[AnalyteResponse]:
        """
        Поиск соответствия в справочнике с приоритетами:
        1. Exact match normalized name
        2. Match по synonyms
        3. Match по display_name
        4. Safe partial match (только однозначные случаи)
        """
        if not name:
            return None

        # 1. Exact match
        result = self._exact_match(name)
        if result:
            return AnalyteResponse.model_validate(result)

        # 2. Synonym match
        result = self._synonym_match(name)
        if result:
            return AnalyteResponse.model_validate(result)

        # 3. Display match
        result = self._display_match(name)
        if result:
            return AnalyteResponse.model_validate(result)

        # 4. Safe partial match
        result = self._safe_partial_match(name)
        if result:
            return AnalyteResponse.model_validate(result)

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
