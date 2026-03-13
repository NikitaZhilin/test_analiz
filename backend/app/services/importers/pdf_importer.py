import re
from typing import Any, Optional
from decimal import Decimal

import fitz  # PyMuPDF

from app.core.analytes_whitelist import (
    BLACKLIST_PATTERNS, 
    FLAG_PATTERNS,
    VALID_ANALYTE_KEYWORDS,
)


class PDFImporter:
    """
    Импорт результатов анализов из PDF файлов.
    Поддерживает форматы:
    - Гемотест: "Гемоглобин 134+ г/л 101 - 127"
    - Инвитро: табличный формат с колонками
    """

    def __init__(self):
        self.blacklist_regex = [
            re.compile(pattern, re.IGNORECASE)
            for pattern in BLACKLIST_PATTERNS
        ]
        
        self.flag_patterns = {
            flag: [re.compile(p) for p in patterns]
            for flag, patterns in FLAG_PATTERNS.items()
        }
        
        self.valid_keywords = [
            re.compile(keyword, re.IGNORECASE)
            for keyword in VALID_ANALYTE_KEYWORDS
        ]

    def _is_blacklisted(self, text: str) -> bool:
        text_lower = text.strip().lower()
        if not text_lower:
            return True
        for pattern in self.blacklist_regex:
            if pattern.fullmatch(text_lower):
                return True
        if len(text_lower.strip()) <= 2:
            return True
        return False

    def _is_valid_analyte_name(self, name: str) -> bool:
        if not name:
            return False
        name_lower = name.lower()
        for keyword_pattern in self.valid_keywords:
            if keyword_pattern.search(name_lower):
                return True
        return False

    def _extract_flag(self, value_str: str) -> tuple[str, Optional[str]]:
        flag = None
        if value_str.endswith('++') or value_str.endswith('**'):
            flag = 'HIGH'
            value_str = re.sub(r'[+*]+$', '', value_str)
        elif value_str.endswith('--'):
            flag = 'LOW'
            value_str = value_str[:-2]
        elif value_str.endswith('+') or value_str.endswith('*'):
            flag = 'HIGH'
            value_str = value_str[:-1]
        elif value_str.endswith('-'):
            flag = 'LOW'
            value_str = value_str[:-1]
        
        for flag_name, patterns in self.flag_patterns.items():
            for pattern in patterns:
                if pattern.search(value_str):
                    flag = flag_name
                    value_str = pattern.sub('', value_str)
                    break
        
        return value_str.strip(), flag

    def _parse_value(self, value: str) -> tuple[Decimal | None, Optional[str]]:
        """Парсинг числового или текстового значения."""
        if not value:
            return None, None
        
        value_str = str(value).strip()
        value_str, flag = self._extract_flag(value_str)
        
        # Проверяем текстовые результаты
        text_results = {
            'отриц.': 'отриц.',
            'отрицательно': 'отриц.',
            'не обнар.': 'не обнар.',
            'не обнаружено': 'не обнар.',
            'следы': 'следы',
            'см.комм.': 'см.комм.',
            'см.комм': 'см.комм.',
        }
        
        value_lower = value_str.lower().strip()
        for text_val, text_display in text_results.items():
            if text_val in value_lower:
                return Decimal(0), flag  # Возвращаем 0 для текстовых значений
        
        # Числовое значение
        value_str = value_str.replace(",", ".").strip()
        value_str = re.sub(r'[^\d\.]', '', value_str)
        
        match = re.search(r'[\d\.]+', value_str)
        if match:
            try:
                return Decimal(match.group()), flag
            except Exception:
                pass
        
        return None, flag

    def _parse_ref_range(self, value: str) -> tuple[Decimal | None, Decimal | None]:
        if not value:
            return None, None
        value = str(value).strip().replace(",", ".")
        value = re.sub(r'<\s*', '', value)
        value = re.sub(r'>\s*', '', value)
        value = re.sub(r'\*.*$', '', value)
        
        range_match = re.search(r'([\d\.]+)\s*[-–—]\s*([\d\.]+)', value)
        if range_match:
            try:
                low = Decimal(range_match.group(1))
                high = Decimal(range_match.group(2))
                return low, high
            except Exception:
                pass
        return None, None

    def _extract_text_from_pdf(self, content: bytes) -> str:
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text", sort=True)
        doc.close()
        return text

    def _clean_analyte_name(self, name: str) -> str:
        if not name:
            return ""
        name = ' '.join(name.split())
        name = re.sub(r'\s*[A-Z]\d{2}\.\d{2}\.\d{3}(?:\.\d{3})?\s*\([^)]*\)', ' ', name)
        name = re.sub(r'\s*\([^)]*Приказ.*\)', '', name)
        name = re.sub(r'\s*\(.*?венозная.*?\)', '', name, flags=re.IGNORECASE)
        name = ' '.join(name.split())
        return name.strip()

    def _parse_invitro_line(self, line: str, next_line: str = None) -> Optional[dict[str, Any]]:
        """
        Парсинг строки формата Инвитро.
        Формат: Исследование             Результат       Единицы     Референсные
        Пример: Гематокрит               37.1      %           35 - 45
        """
        line = line.strip()
        if not line or self._is_blacklisted(line):
            return None
        
        # Проверяем что это не заголовок таблицы
        if 'исследование' in line.lower() and 'результат' in line.lower():
            return None
        if 'единицы' in line.lower() and 'референсные' in line.lower():
            return None
        if 'комментарий' in line.lower():
            return None
        
        # Разделяем по 2+ пробелам
        parts = re.split(r'\s{2,}', line)
        parts = [p.strip() for p in parts if p.strip()]
        
        if len(parts) < 2:
            return None
        
        # Первая часть - название
        analyte_raw = self._clean_analyte_name(parts[0])
        
        if not self._is_valid_analyte_name(analyte_raw):
            return None
        
        # Вторая часть - результат (число или текст)
        value_part = parts[1]
        value, flag = self._parse_value(value_part)
        
        # Для текстовых результатов (отриц., не обнар. и т.д.) value будет 0
        # Это нормально, сохраняем строку
        if value is None:
            # Проверяем текстовые результаты
            text_patterns = ['отриц', 'не обнар', 'следы', 'см.комм']
            is_text_result = any(tp in value_part.lower() for tp in text_patterns)
            if not is_text_result:
                return None
            value = Decimal(0)
            flag = None
        
        # Третья часть - единицы (если это не число)
        unit = None
        ref_idx = 2
        
        if len(parts) >= 3:
            potential_unit = parts[2].strip()
            # Проверяем что это не референс (не начинается с числа)
            if not re.match(r'^[\d\.]+', potential_unit):
                unit = potential_unit
                ref_idx = 3
        
        # Референс - следующая часть после единиц
        ref_low = None
        ref_high = None
        if len(parts) > ref_idx:
            ref_low, ref_high = self._parse_ref_range(parts[ref_idx])
        
        return {
            "analyte_raw": analyte_raw,
            "value": float(value),
            "unit": unit,
            "ref_low": float(ref_low) if ref_low else None,
            "ref_high": float(ref_high) if ref_high else None,
            "flag": flag,
        }

    def _parse_gemotest_line(self, line: str) -> Optional[dict[str, Any]]:
        """
        Парсинг строки формата Гемотест.
        Формат: Название значение[флаг] ед.изм. референс
        Пример: Гемоглобин 134+ г/л 101 - 127
        """
        line = line.strip()
        if not line or self._is_blacklisted(line):
            return None
        
        # Паттерн: название (не жадно) -> число+флаг -> единицы -> референс
        pattern = re.compile(
            r'^([А-ЯA-Z][а-яA-Za-z0-9\s\(\)\-]+?)\s+'  # Название
            r'([\d,\.]+)([+\-]?)\s+'  # Значение с флагом
            r'([а-яA-Z\/\^°%]+?)\s+'  # Единицы (не жадно)
            r'([\d,\.]+\s*[-–—]\s*[\d,\.]+|<\s*[\d,\.]+|>\s*[\d,\.]+)?'  # Референс
        )
        
        match = pattern.match(line)
        if not match:
            # Пробуем без референса
            pattern_no_ref = re.compile(
                r'^([А-ЯA-Z][а-яA-Za-z0-9\s\(\)\-]+?)\s+'
                r'([\d,\.]+)([+\-]?)\s+'
                r'([а-яA-Z\/\^°%]+)$'
            )
            match = pattern_no_ref.match(line)
            if match:
                analyte_raw = self._clean_analyte_name(match.group(1))
                value_str = match.group(2) + (match.group(3) or '')
                unit = match.group(4).strip()
                
                if not self._is_valid_analyte_name(analyte_raw):
                    return None
                
                value, flag = self._parse_value(value_str)
                if analyte_raw and value is not None:
                    return {
                        "analyte_raw": analyte_raw,
                        "value": float(value),
                        "unit": unit,
                        "ref_low": None,
                        "ref_high": None,
                        "flag": flag,
                    }
            return None
        
        analyte_raw = self._clean_analyte_name(match.group(1))
        value_str = match.group(2) + (match.group(3) or '')
        unit = match.group(4).strip()
        ref_raw = match.group(5) if match.group(5) else None
        
        if not self._is_valid_analyte_name(analyte_raw):
            return None
        
        value, flag = self._parse_value(value_str)
        ref_low, ref_high = self._parse_ref_range(ref_raw) if ref_raw else (None, None)
        
        if analyte_raw and value is not None:
            return {
                "analyte_raw": analyte_raw,
                "value": float(value),
                "unit": unit,
                "ref_low": float(ref_low) if ref_low else None,
                "ref_high": float(ref_high) if ref_high else None,
                "flag": flag,
            }
        
        return None

    def parse(self, content: bytes) -> list[dict[str, Any]]:
        try:
            text = self._extract_text_from_pdf(content)
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

        if not text.strip():
            return []

        results = []
        lines = text.split('\n')
        
        # Определяем формат по наличию заголовка Инвитро
        is_invitro = 'исследование' in text.lower() and 'референсные' in text.lower() and 'единицы' in text.lower()
        
        for i, line in enumerate(lines):
            if is_invitro:
                # Для Инвитро передаём следующую строку для контекста
                next_line = lines[i + 1] if i + 1 < len(lines) else None
                result = self._parse_invitro_line(line, next_line)
            else:
                result = self._parse_gemotest_line(line)
            
            if result:
                results.append(result)

        return results
