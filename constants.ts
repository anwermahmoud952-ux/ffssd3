import { FarmStats } from './types';

export const INITIAL_FARM_STATS: Omit<FarmStats, 'soilType' | 'cropType'> = {
  cropHealth: 70,
  soilMoisture: 60,
  waterReserves: 80,
};

export const MAX_ROUNDS = 5;

export const CROP_TYPES = {
  "المحاصيل الصيفية": {
    "حبوب": ["الذرة الشامية", "الذرة الرفيعة", "الأرز"],
    "خضر": ["الطماطم الصيفية", "الباذنجان", "الفلفل", "الخيار", "الكوسة", "البامية", "البطاطا", "القرع"],
    "فواكه": ["العنب", "المانجو", "البطيخ", "الشمام", "التين", "الجوافة"],
    "محاصيل نقدية وصناعية": ["القطن", "قصب السكر", "عباد الشمس"]
  },
  "المحاصيل الشتوية": {
    "حبوب": ["القمح", "الشعير", "الفول البلدي", "العدس"],
    "خضر": ["البطاطس الشتوية", "البصل", "الثوم", "السبانخ", "الكرنب", "القرنبيط", "الجزر", "الخس", "الفاصوليا الشتوية", "البازلاء"],
    "فواكه": ["الموالح (البرتقال)", "الفراولة"],
    "محاصيل زيتية أو علفية": ["الكتان", "البرسيم الحجازي", "البرسيم البلدي"]
  }
};

export const EGYPTIAN_CITIES = [
    { nameAr: 'القاهرة', nameEn: 'Cairo' },
    { nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
    { nameAr: 'الجيزة', nameEn: 'Giza' },
    { nameAr: 'الأقصر', nameEn: 'Luxor' },
    { nameAr: 'أسوان', nameEn: 'Aswan' },
    { nameAr: 'بورسعيد', nameEn: 'Port Said' },
    { nameAr: 'السويس', nameEn: 'Suez' },
    { nameAr: 'الإسماعيلية', nameEn: 'Ismailia' },
    { nameAr: 'دمياط', nameEn: 'Damietta' },
    { nameAr: 'المنصورة', nameEn: 'Mansoura' },
    { nameAr: 'طنطا', nameEn: 'Tanta' },
    { nameAr: 'الزقازيق', nameEn: 'Zagazig' },
    { nameAr: 'شرم الشيخ', nameEn: 'Sharm El Sheikh' },
    { nameAr: 'الغردقة', nameEn: 'Hurghada' },
    { nameAr: 'أسيوط', nameEn: 'Asyut' },
    { nameAr: 'المنيا', nameEn: 'Minya' },
    { nameAr: 'سوهاج', nameEn: 'Sohag' },
];