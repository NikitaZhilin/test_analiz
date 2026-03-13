"""
Whitelist медицинских показателей для строгого парсинга.
Содержит только валидные анализы с синонимами.
"""

# Полный список анализов для ОАК и биохимии
ANALYTES_WHITELIST = [
    # ==================== ОБЩИЙ АНАЛИЗ КРОВИ (ОАК) ====================
    {
        "canonical_name": "hemoglobin",
        "display_name_ru": "Гемоглобин",
        "synonyms": ["HGB", "Hb", "гемоглобин", "HB", "HGB (Hb)", "Гемоглобин (HGB)"],
        "default_unit": "г/л"
    },
    {
        "canonical_name": "rbc",
        "display_name_ru": "Эритроциты",
        "synonyms": ["RBC", "эритроциты", "RBC (эритроциты)", "Красные кровяные клетки"],
        "default_unit": "10^12/л"
    },
    {
        "canonical_name": "hematocrit",
        "display_name_ru": "Гематокрит",
        "synonyms": ["HCT", "Ht", "гематокрит", "HT", "Hematocrit"],
        "default_unit": "%"
    },
    {
        "canonical_name": "mcv",
        "display_name_ru": "MCV (средний объем эритроцита)",
        "synonyms": ["MCV", "Средний объем эритроцита", "Средний объем эритроцитов", "Mean corpuscular volume"],
        "default_unit": "фл"
    },
    {
        "canonical_name": "mch",
        "display_name_ru": "MCH (среднее содержание Hb в эритроците)",
        "synonyms": ["MCH", "Среднее содержание Hb в эритроците", "Среднее содержание гемоглобина в эритроците", "Mean corpuscular hemoglobin"],
        "default_unit": "пг"
    },
    {
        "canonical_name": "mchc",
        "display_name_ru": "MCHC (средняя концентрация Hb в эритроцитах)",
        "synonyms": ["MCHC", "Средняя концентрация Hb в эритроцитах", "Mean corpuscular hemoglobin concentration"],
        "default_unit": "г/л"
    },
    {
        "canonical_name": "rdw_cv",
        "display_name_ru": "RDW-CV (ширина распределения эритроцитов)",
        "synonyms": ["RDW-CV", "RDW", "RDW-C", "Ширина распределения эритроцитов", "Red cell distribution width"],
        "default_unit": "%"
    },
    {
        "canonical_name": "rdw_sd",
        "display_name_ru": "RDW-SD",
        "synonyms": ["RDW-SD", "RDW-S"],
        "default_unit": "фл"
    },
    {
        "canonical_name": "wbc",
        "display_name_ru": "Лейкоциты",
        "synonyms": ["WBC", "лейкоциты", "WBC (лейкоциты)", "Белые кровяные клетки", "Leukocytes"],
        "default_unit": "10^9/л"
    },
    {
        "canonical_name": "neutrophils_percent",
        "display_name_ru": "Нейтрофилы %",
        "synonyms": ["NEUT%", "Нейтрофилы %", "Neutrophils %", "NEUT", "Нейтрофилы (проценты)"],
        "default_unit": "%"
    },
    {
        "canonical_name": "neutrophils_abs",
        "display_name_ru": "Нейтрофилы абс.",
        "synonyms": ["NEUT#", "Нейтрофилы абс.", "Neutrophils abs", "Нейтрофилы абсолютное", "Нейтрофилы (абсолютное число)", "Нейтрофилы сегментоядерные"],
        "default_unit": "10^9/л"
    },
    {
        "canonical_name": "lymphocytes_percent",
        "display_name_ru": "Лимфоциты %",
        "synonyms": ["LYMPH%", "Лимфоциты %", "Lymphocytes %", "LYMPH", "Лимфоциты (проценты)"],
        "default_unit": "%"
    },
    {
        "canonical_name": "lymphocytes_abs",
        "display_name_ru": "Лимфоциты абс.",
        "synonyms": ["LYMPH#", "Лимфоциты абс.", "Lymphocytes abs", "Лимфоциты абсолютное", "Лимфоциты (абсолютное число)"],
        "default_unit": "10^9/л"
    },
    {
        "canonical_name": "monocytes_percent",
        "display_name_ru": "Моноциты %",
        "synonyms": ["MONO%", "Моноциты %", "Monocytes %", "MONO", "Моноциты (проценты)"],
        "default_unit": "%"
    },
    {
        "canonical_name": "monocytes_abs",
        "display_name_ru": "Моноциты абс.",
        "synonyms": ["MONO#", "Моноциты абс.", "Monocytes abs", "Моноциты абсолютное", "Моноциты (абсолютное число)"],
        "default_unit": "10^9/л"
    },
    {
        "canonical_name": "eosinophils_percent",
        "display_name_ru": "Эозинофилы %",
        "synonyms": ["EOS%", "Эозинофилы %", "Eosinophils %", "EOS", "Эозинофилы (проценты)"],
        "default_unit": "%"
    },
    {
        "canonical_name": "eosinophils_abs",
        "display_name_ru": "Эозинофилы абс.",
        "synonyms": ["EOS#", "Эозинофилы абс.", "Eosinophils abs", "Эозинофилы абсолютное", "Эозинофилы (абсолютное число)"],
        "default_unit": "10^9/л"
    },
    {
        "canonical_name": "basophils_percent",
        "display_name_ru": "Базофилы %",
        "synonyms": ["BASO%", "Базофилы %", "Basophils %", "BASO", "Базофилы (проценты)"],
        "default_unit": "%"
    },
    {
        "canonical_name": "basophils_abs",
        "display_name_ru": "Базофилы абс.",
        "synonyms": ["BASO#", "Базофилы абс.", "Basophils abs", "Базофилы абсолютное", "Базофилы (абсолютное число)"],
        "default_unit": "10^9/л"
    },
    {
        "canonical_name": "platelets",
        "display_name_ru": "Тромбоциты",
        "synonyms": ["PLT", "тромбоциты", "Platelets", "Тромбоциты (PLT)"],
        "default_unit": "10^9/л"
    },
    {
        "canonical_name": "mpv",
        "display_name_ru": "MPV (средний объем тромбоцитов)",
        "synonyms": ["MPV", "Средний объем тромбоцитов", "Mean platelet volume"],
        "default_unit": "фл"
    },
    {
        "canonical_name": "pdw",
        "display_name_ru": "PDW (ширина распределения тромбоцитов)",
        "synonyms": ["PDW", "Ширина распределения тромбоцитов", "Platelet distribution width"],
        "default_unit": "фл"
    },
    {
        "canonical_name": "pct",
        "display_name_ru": "PCT (тромбокрит)",
        "synonyms": ["PCT", "Тромбокрит", "Plateletcrit"],
        "default_unit": "%"
    },
    {
        "canonical_name": "esr",
        "display_name_ru": "СОЭ",
        "synonyms": ["СОЭ", "ESR", "Скорость оседания эритроцитов", "по Вестергрену", "по Панченкову"],
        "default_unit": "мм/час"
    },
    
    # ==================== БИОХИМИЯ ====================
    {
        "canonical_name": "alt",
        "display_name_ru": "АЛТ",
        "synonyms": ["ALT", "АЛТ", "Аланинаминотрансфераза", "Alanine aminotransferase", "АлАТ"],
        "default_unit": "Ед/л"
    },
    {
        "canonical_name": "ast",
        "display_name_ru": "АСТ",
        "synonyms": ["AST", "АСТ", "Аспартатаминотрансфераза", "Aspartate aminotransferase", "АсАТ"],
        "default_unit": "Ед/л"
    },
    {
        "canonical_name": "bilirubin_total",
        "display_name_ru": "Билирубин общий",
        "synonyms": ["Билирубин общий", "Total bilirubin", "TBIL"],
        "default_unit": "мкмоль/л"
    },
    {
        "canonical_name": "bilirubin_direct",
        "display_name_ru": "Билирубин прямой",
        "synonyms": ["Билирубин прямой", "Direct bilirubin", "DBIL", "Билирубин конъюгированный"],
        "default_unit": "мкмоль/л"
    },
    {
        "canonical_name": "bilirubin_indirect",
        "display_name_ru": "Билирубин непрямой",
        "synonyms": ["Билирубин непрямой", "Indirect bilirubin", "IBIL", "Билирубин неконъюгированный"],
        "default_unit": "мкмоль/л"
    },
    {
        "canonical_name": "creatinine",
        "display_name_ru": "Креатинин",
        "synonyms": ["Креатинин", "Creatinine", "Cr"],
        "default_unit": "мкмоль/л"
    },
    {
        "canonical_name": "urea",
        "display_name_ru": "Мочевина",
        "synonyms": ["Мочевина", "Urea"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "glucose",
        "display_name_ru": "Глюкоза",
        "synonyms": ["Глюкоза", "Glucose", "Gluc", "Сахар крови"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "ferritin",
        "display_name_ru": "Ферритин",
        "synonyms": ["Ферритин", "Ferritin", "FERR"],
        "default_unit": "нг/мл"
    },
    {
        "canonical_name": "iron",
        "display_name_ru": "Железо",
        "synonyms": ["Железо", "Iron", "Fe", "Сывороточное железо"],
        "default_unit": "мкмоль/л"
    },
    {
        "canonical_name": "crp",
        "display_name_ru": "С-реактивный белок",
        "synonyms": ["С-реактивный белок", "CRP", "СРБ", "C-reactive protein"],
        "default_unit": "мг/л"
    },
    {
        "canonical_name": "total_protein",
        "display_name_ru": "Общий белок",
        "synonyms": ["Общий белок", "Total protein", "Protein total"],
        "default_unit": "г/л"
    },
    {
        "canonical_name": "albumin",
        "display_name_ru": "Альбумин",
        "synonyms": ["Альбумин", "Albumin", "Alb"],
        "default_unit": "г/л"
    },
    {
        "canonical_name": "cholesterol_total",
        "display_name_ru": "Холестерин общий",
        "synonyms": ["Холестерин общий", "Total cholesterol", "CHOL", "ОХ"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "triglycerides",
        "display_name_ru": "Триглицериды",
        "synonyms": ["Триглицериды", "Triglycerides", "TG", "ТГ"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "ldl",
        "display_name_ru": "ЛПНП",
        "synonyms": ["ЛПНП", "LDL", "Холестерин ЛПНП", "Липопротеины низкой плотности", "LDL-C"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "hdl",
        "display_name_ru": "ЛПВП",
        "synonyms": ["ЛПВП", "HDL", "Холестерин ЛПВП", "Липопротеины высокой плотности", "HDL-C"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "uric_acid",
        "display_name_ru": "Мочевая кислота",
        "synonyms": ["Мочевая кислота", "Uric acid", "UA"],
        "default_unit": "мкмоль/л"
    },
    {
        "canonical_name": "phosphatase_alkaline",
        "display_name_ru": "Фосфатаза щелочная",
        "synonyms": ["Фосфатаза щелочная", "Alkaline phosphatase", "ALP", "ЩФ"],
        "default_unit": "Ед/л"
    },
    {
        "canonical_name": "potassium",
        "display_name_ru": "Калий",
        "synonyms": ["Калий", "Potassium", "K+"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "sodium",
        "display_name_ru": "Натрий",
        "synonyms": ["Натрий", "Sodium", "Na+"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "chloride",
        "display_name_ru": "Хлор",
        "synonyms": ["Хлор", "Chloride", "Cl-"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "calcium_total",
        "display_name_ru": "Кальций общий",
        "synonyms": ["Кальций общий", "Calcium total", "Ca", "Кальций"],
        "default_unit": "ммоль/л"
    },
    {
        "canonical_name": "vitamin_d_total",
        "display_name_ru": "Витамин D суммарный",
        "synonyms": ["Витамин D суммарный", "Vitamin D total", "25-OH D", "25(OH)D", "Кальциферол", "Витамин D общий"],
        "default_unit": "нг/мл"
    },
    {
        "canonical_name": "vitamin_b12",
        "display_name_ru": "Витамин B12",
        "synonyms": ["Витамин B12", "Vitamin B12", "B12", "Цианокобаламин", "Cyanocobalamin"],
        "default_unit": "пг/мл"
    },
    {
        "canonical_name": "tsh",
        "display_name_ru": "ТТГ",
        "synonyms": ["ТТГ", "TSH", "Тиреотропный гормон", "Thyroid stimulating hormone"],
        "default_unit": "мкМЕ/мл"
    },
    {
        "canonical_name": "t4_free",
        "display_name_ru": "Т4 свободный",
        "synonyms": ["Т4 свободный", "Free T4", "FT4", "Тироксин свободный", "Free thyroxine"],
        "default_unit": "нг/дл"
    },
    {
        "canonical_name": "t4_total",
        "display_name_ru": "Т4 общий",
        "synonyms": ["Т4 общий", "Total T4", "TT4", "Тироксин общий", "Total thyroxine"],
        "default_unit": "нмоль/л"
    },
    {
        "canonical_name": "ige_total",
        "display_name_ru": "IgE общий",
        "synonyms": ["IgE общий", "Total IgE", "Иммуноглобулин E общий", "Immunoglobulin E"],
        "default_unit": "МЕ/мл"
    },
    {
        "canonical_name": "hba1c",
        "display_name_ru": "Гликированный гемоглобин",
        "synonyms": ["Гликированный гемоглобин", "HbA1c", "HbA1", "Гемоглобин A1c"],
        "default_unit": "%"
    },
    {
        "canonical_name": "homair",
        "display_name_ru": "HOMA-IR",
        "synonyms": ["HOMA-IR", "Индекс HOMA", "Индекс инсулинорезистентности", "HOMA"],
        "default_unit": ""
    },
    {
        "canonical_name": "insulin",
        "display_name_ru": "Инсулин",
        "synonyms": ["Инсулин", "Insulin"],
        "default_unit": "мкЕд/мл"
    },
    {
        "canonical_name": "transferrin",
        "display_name_ru": "Трансферрин",
        "synonyms": ["Трансферрин", "Transferrin"],
        "default_unit": "г/л"
    },
    {
        "canonical_name": "folate",
        "display_name_ru": "Фолаты",
        "synonyms": ["Фолаты", "Folate", "Folic acid", "Фолиевая кислота"],
        "default_unit": "нг/мл"
    },
]

# Blacklist для фильтрации мусорных строк - расширенный
BLACKLIST_PATTERNS = [
    # Служебные символы и короткие токены
    r'^[VНHL]\)$',  # V), Н), H), L)
    r'^[VНHL]\s*\)$',  # V ), H ) и т.п.
    r'^[+\-]{1,3}$',  # +, ++, +++, -, --, ---
    r'^\*{1,3}$',  # *, **, ***
    r'^[<>]=?$',  # <, >, <=, >=
    r'^[0-9]\)$',  # 1), 2) и т.д.

    # Шапки таблиц и служебные строки
    r'^исследование$',
    r'^результат$',
    r'^значения?$',
    r'^значение$',
    r'^ед\.?\s*(изм\.?)?$',
    r'^единицы?$',
    r'^норма$',
    r'^референс',
    r'^референсные?\s*значения?$',
    r'^диапазон',
    r'^комментарий$',
    r'^примечание$',
    r'^дата',
    r'^время$',
    r'^страница',
    r'^лаборатория$',
    r'^врач$',
    r'^исполнитель$',
    r'^подпись$',
    r'^фамилия',
    r'^имя',
    r'^отчество',
    r'^пол\s*пациента',
    r'^дата\s*рождения',
    r'^возраст',
    r'^адрес',
    r'^телефон',
    r'^заказ',
    r'^номер\s*заказа',
    r'^дата\s*забора',
    r'^дата\s*поступления',
    r'^дата\s*исследования',
    r'^дата\s*выдачи',
    r'^метод\s*исследования',
    r'^биоматериал',
    r'^тип\s*биоматериала',

    # Разделители и заголовки разделов
    r'^общий\s*анализ\s*крови',
    r'^биохимический\s*анализ',
    r'^биохимия',
    r'^гормоны',
    r'^витамины',
    r'^иммунология',
    r'^липидный\s*обмен',
    r'^углеводный\s*обмен',
    r'^пигментный\s*обмен',
    r'^минеральный\s*обмен',
    r'^щитовидная\s*железа',
    r'^ферменты',

    # Цветовой показатель - игнорируем полностью
    r'^цветовой\s*показатель$',

    # Разные служебные надписи
    r'^см\.\s*текст',
    r'^смотри\s*текст',
    r'^см\s*текст',
    r'^интерпретация',
    r'^заключение',
    r'^рекомендации',
    r'^референсные\s*интервалы',
    r'^биологические\s*референсные\s*интервалы',

    # ГОСТ и сертификаты - мусор
    r'^гост\s*р\s*исо',
    r'^сертификат\s*соответствия',
    r'^лабораторный\s*комплекс',

    # Адреса и прочее
    r'^пом\.',
    r'^отделение',
    r'^оплата',
    r'^диагноз',

    # Пустые или почти пустые строки
    r'^\s*$',
    r'^\s*[-–—]\s*$',
    r'^\s*\.\s*$',

    # Даты и номера
    r'^\d{2}\.\d{2}\.\d{4}',  # Даты
    r'^\d+:',  # Время
]

# Расширенный blacklist для паспортных/служебных данных пациента
METADATA_BLACKLIST = [
    # Паспортные данные пациента
    r'возраст',
    r'пол',
    r'дата\s*рождения',
    r'день\s*рождения',
    r'возраст\s*пациента',
    r'пол\s*пациента',
    r'пациент',
    r'фамилия',
    r'имя',
    r'отчество',
    r'фио',
    r'ф\.?и\.?о\.?',
    r'паспорт',
    r'снилс',
    r'омс',
    r'полис',
    r'адрес',
    r'прописка',
    r'регистрация',
    r'телефон',
    r'мобильный',
    r'email',
    r'e-mail',
    r'почта',

    # Данные заказа/исследования
    r'номер\s*заказа',
    r'номер\s*исследования',
    r'номер\s*пробы',
    r'номер\s*биоматериала',
    r'штрих-?код',
    r'штрихкод',
    r'barcode',
    r'order\s*id',
    r'patient\s*id',
    r'sample\s*id',
    r'test\s*id',
    r'номер\s*договора',
    r'договор',
    r'направление',
    r'врач',
    r'лечащий\s*врач',
    r'направивший\s*врач',
    r'исполнитель',
    r'заведующий',
    r'подпись',
    r'печать',

    # Даты и время
    r'дата\s*забора',
    r'дата\s*взятия',
    r'дата\s*поступления',
    r'дата\s*исследования',
    r'дата\s*выдачи',
    r'дата\s*печати',
    r'дата\s*регистрации',
    r'время\s*забора',
    r'время\s*взятия',
    r'время\s*поступления',
    r'время\s*исследования',
    r'срок\s*выполнения',
    r'срок\s*годности',

    # Лаборатория и метод
    r'лаборатория',
    r'лабораторный\s*комплекс',
    r'метод\s*исследования',
    r'метод\s*определения',
    r'анализатор',
    r'тест-?система',
    r'реагент',
    r'производитель',
    r'серия\s*контроля',
    r'контроль\s*качества',
    r'гост\s*р\s*исо',
    r'сертификат',
    r'лицензия',
    r'аккредитация',

    # Биоматериал
    r'биоматериал',
    r'тип\s*биоматериала',
    r'материал\s*исследования',
    r'венозная\s*кровь',
    r'капиллярная\s*кровь',
    r'сыворотка',
    r'плазма',
    r'моча',
    r'кал',
    r'спинномозговая\s*жидкость',
    r'пунктат',
    r'соскоб',
    r'мазок',
    r'объем',
    r'порция',
    r'контейнер',
    r'пробирка',
    r'вакутейнер',

    # Статусы и прочее
    r'статус',
    r'статус\s*исследования',
    r'результат\s*готов',
    r'срочно',
    r'cito',
    r'приоритет',
    r'оплата',
    r'оплачено',
    r'не\s*оплачено',
    r'счет',
    r'цена',
    r'стоимость',
    r'скидка',
    r'диагноз',
    r'клинический\s*диагноз',
    r'предварительный\s*диагноз',
    r'жалобы',
    r'симптомы',
    r'анамнез',
    r'заключение',
    r'комментарий\s*лаборатории',
    r'интерпретация',
    r'рекомендации',
    r'примечание',
]

# Флаги, которые могут встречаться рядом со значением
FLAG_PATTERNS = {
    'HIGH': [r'\+\+$', r'\+$', r'^H$', r'^H$', r'↑', r'⇑'],
    'LOW': [r'-+$', r'^L$', r'^L$', r'↓', r'⇓'],
    'NORMAL': [r'^N$'],
}

# Ключевые слова для валидации названий анализов
# Название должно содержать хотя бы одно из этих слов или быть в синонимах
VALID_ANALYTE_KEYWORDS = [
    # ОАК
    'гемоглобин', 'эритроцит', 'лейкоцит', 'тромбоцит', 'гематокрит',
    'mcv', 'mch', 'mchc', 'rdw', 'mpv', 'pdw', 'pct',
    'нейтрофил', 'лимфоцит', 'моноцит', 'эозинофил', 'базофил',
    'соэ', 'esr',
    
    # Биохимия
    'алт', 'аст', 'билирубин', 'креатинин', 'мочевина', 'глюкоза',
    'ферритин', 'железо', 'трансферрин', 'фолат',
    'холестерин', 'триглицерид', 'лпнп', 'лпвп', 'hdl', 'ldl',
    'белок', 'альбумин', 'глобулин',
    'калий', 'натрий', 'хлор', 'кальций', 'фосфор', 'магний',
    'амилаза', 'липаза', 'лдг', 'кфк', 'ггт', 'щф',
    'ттг', 'т3', 'т4', 'тирео',
    'витамин', 'b12', 'd-', 'd3', '25-oh',
    'insulin', 'инсулин', 'homa', 'c-пептид',
    'ige', 'igm', 'igg', 'иммуноглобулин',
    'hba1c', 'гликирован', 'глюкоз',
    'мочевая кислота', 'урат',
    'crp', 'срб', 'реактив',
    
    # Анализ мочи
    'цвет', 'прозрачность', 'плотность', 'ph', 'кислот',
    'эпителий', 'цилиндр', 'слизь', 'бактерии', 'дрожже',
    'эритроцит', 'лейкоцит', 'кетон', 'нитрит', 'уробилин',
    'сахар', 'белок', 'гемоглобин',
    
    # Общие термины
    'общий', 'свободный', 'прямой', 'непрямой', 'конъюгирован',
    'сывороточ', 'веноз', 'кров', 'моч', 'кал',
]
