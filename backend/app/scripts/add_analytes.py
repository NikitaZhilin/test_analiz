import sys
sys.path.insert(0, r'D:\проекты qwen\сравнение анализов\backend')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base

# Импорт ВСЕХ моделей ДО создания сессии
from app.db.models.user import User
from app.db.models.profile import Profile
from app.db.models.report import Report
from app.db.models.result import Result
from app.db.models.analyte import Analyte

# Создаём таблицы если нет
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Дополнительные аналиты для Инвитро
additional_analytes = [
    # Печеночные пробы
    {"canonical_name": "alt", "display_name_ru": "АЛТ", "synonyms": ["ALT", "Аланинаминотрансфераза", "АлАТ"], "default_unit": "Ед/л"},
    {"canonical_name": "ast", "display_name_ru": "АСТ", "synonyms": ["AST", "Аспартатаминотрансфераза", "АсАТ"], "default_unit": "Ед/л"},
    
    # Анализ мочи
    {"canonical_name": "urine_color", "display_name_ru": "Цвет мочи", "synonyms": ["Цвет", "Урина цвет"], "default_unit": ""},
    {"canonical_name": "urine_clarity", "display_name_ru": "Прозрачность", "synonyms": ["Прозрачность", "Мутность"], "default_unit": ""},
    {"canonical_name": "urine_density", "display_name_ru": "Плотность относительная", "synonyms": ["Плотность", "Относительная плотность", "SG"], "default_unit": "г/л"},
    {"canonical_name": "urine_ph", "display_name_ru": "pH мочи", "synonyms": ["pH", "Кислотность"], "default_unit": ""},
    {"canonical_name": "urine_protein", "display_name_ru": "Белок мочи", "synonyms": ["Белок", "Протеин", "Альбумин мочи"], "default_unit": "г/л"},
    {"canonical_name": "urine_glucose", "display_name_ru": "Глюкоза мочи", "synonyms": ["Глюкоза", "Сахар мочи"], "default_unit": "ммоль/л"},
    {"canonical_name": "urine_ketones", "display_name_ru": "Кетоновые тела", "synonyms": ["Кетоны", "Ацетон"], "default_unit": "ммоль/л"},
    {"canonical_name": "urine_bilirubin", "display_name_ru": "Билирубин мочи", "synonyms": ["Билирубин"], "default_unit": "мкмоль/л"},
    {"canonical_name": "urine_urobilinogen", "display_name_ru": "Уробилиноген", "synonyms": ["Уробилин"], "default_unit": "мкмоль/л"},
    {"canonical_name": "urine_nitrites", "display_name_ru": "Нитриты", "synonyms": ["Нитриты"], "default_unit": ""},
    {"canonical_name": "urine_leukocyte_esterase", "display_name_ru": "Лейкоцитарная эстераза", "synonyms": ["Лейкоцитарная эстераза"], "default_unit": ""},
    {"canonical_name": "urine_epithelial_flat", "display_name_ru": "Эпителий плоский", "synonyms": ["Эпителий плоский", "Плоский эпителий"], "default_unit": "в п/зр"},
    {"canonical_name": "urine_epithelial_transitional", "display_name_ru": "Эпителий переходный", "synonyms": ["Эпителий переходный", "Переходный эпителий"], "default_unit": "в п/зр"},
    {"canonical_name": "urine_epithelial_renal", "display_name_ru": "Эпителий почечный", "synonyms": ["Эпителий почечный", "Почечный эпителий"], "default_unit": "в п/зр"},
    {"canonical_name": "urine_leukocytes", "display_name_ru": "Лейкоциты мочи", "synonyms": ["Лейкоциты мочи", "Лейкоциты (микроскопия)"], "default_unit": "в п/зр"},
    {"canonical_name": "urine_erythrocytes", "display_name_ru": "Эритроциты мочи", "synonyms": ["Эритроциты мочи", "Эритроциты (микроскопия)"], "default_unit": "в п/зр"},
    {"canonical_name": "urine_cylinders", "display_name_ru": "Цилиндры", "synonyms": ["Цилиндры", "Гиалиновые цилиндры"], "default_unit": "в п/зр"},
    {"canonical_name": "urine_salt", "display_name_ru": "Соли", "synonyms": ["Соли", "Оксалаты", "Ураты", "Фосфаты"], "default_unit": ""},
    {"canonical_name": "urine_bacteria", "display_name_ru": "Бактерии", "synonyms": ["Бактерии", "Бактериурия"], "default_unit": ""},
    {"canonical_name": "urine_yeast", "display_name_ru": "Дрожжевые грибы", "synonyms": ["Дрожжевые грибы", "Грибы", "Кандида"], "default_unit": ""},
    {"canonical_name": "urine_mucus", "display_name_ru": "Слизь", "synonyms": ["Слизь"], "default_unit": ""},
    
    # MCHC
    {"canonical_name": "mchc", "display_name_ru": "MCHC", "synonyms": ["MCHC", "МСHC", "Средняя концентрация Hb"], "default_unit": "г/л"},
    
    # ESR
    {"canonical_name": "esr", "display_name_ru": "СОЭ", "synonyms": ["СОЭ", "ESR", "Скорость оседания эритроцитов"], "default_unit": "мм/час"},
    
    # Лимфоциты абс
    {"canonical_name": "lymphocytes_abs", "display_name_ru": "Лимфоциты абс.", "synonyms": ["LYMPH#", "Лимфоциты абс", "Лимфоциты (абсолютное число)"], "default_unit": "10^9/л"},
    
    # Нейтрофилы абс
    {"canonical_name": "neutrophils_abs", "display_name_ru": "Нейтрофилы абс.", "synonyms": ["NEUT#", "Нейтрофилы абс", "Нейтрофилы (абсолютное число)"], "default_unit": "10^9/л"},
    
    # Моноциты абс
    {"canonical_name": "monocytes_abs", "display_name_ru": "Моноциты абс.", "synonyms": ["MONO#", "Моноциты абс", "Моноциты (абсолютное число)"], "default_unit": "10^9/л"},
    
    # Эозинофилы абс
    {"canonical_name": "eosinophils_abs", "display_name_ru": "Эозинофилы абс.", "synonyms": ["EOS#", "Эозинофилы абс", "Эозинофилы (абсолютное число)"], "default_unit": "10^9/л"},
    
    # Базофилы абс
    {"canonical_name": "basophils_abs", "display_name_ru": "Базофилы абс.", "synonyms": ["BASO#", "Базофилы абс", "Базофилы (абсолютное число)"], "default_unit": "10^9/л"},
    
    # Холестерин ЛПНП
    {"canonical_name": "ldl", "display_name_ru": "Холестерин ЛПНП", "synonyms": ["ЛПНП", "LDL", "Липопротеины низкой плотности"], "default_unit": "ммоль/л"},
    
    # Холестерин ЛПВП
    {"canonical_name": "hdl", "display_name_ru": "Холестерин ЛПВП", "synonyms": ["ЛПВП", "HDL", "Липопротеины высокой плотности"], "default_unit": "ммоль/л"},
    
    # Холестерин не-ЛПВП
    {"canonical_name": "non_hdl_cholesterol", "display_name_ru": "Холестерин не-ЛПВП", "synonyms": ["Не-ЛПВП", "Non-HDL", "Холестерин не-ЛПВП"], "default_unit": "ммоль/л"},
]

count = 0
for data in additional_analytes:
    analyte = db.query(Analyte).filter(
        Analyte.canonical_name == data["canonical_name"]
    ).first()
    
    if not analyte:
        analyte = Analyte(
            canonical_name=data["canonical_name"],
            display_name_ru=data["display_name_ru"],
            synonyms=data["synonyms"],
            default_unit=data["default_unit"]
        )
        db.add(analyte)
        count += 1
        print(f"+ Dobavlen: {data['display_name_ru']}")
    else:
        # Обновляем существующий
        analyte.display_name_ru = data["display_name_ru"]
        analyte.synonyms = data["synonyms"]
        analyte.default_unit = data["default_unit"]
        print(f"~ Updated: {data['display_name_ru']}")

db.commit()
db.close()

print(f"\nВсего добавлено/обновлено: {count}")
