/**
 * بنية صفحة المحتوى الموحّدة — كل صفحات الموقع تُبنى منها،
 * فيبقى الثيم والسكيما وإخلاء المسؤولية والربط الداخلي متطابقاً.
 *
 * قواعد ملزمة (PLAN.md §9):
 *  - لا رقم سعر ولا نسبة نجاح في أي حقل. ما لا مصدر له لا يُكتب.
 *  - كل صفحة طبية تحمل `review` بما تحتاجه من مراجعة قبل أي نشر.
 */

export type Section = {
  h2: string;
  /** فقرات نصية */
  body?: string[];
  /** قائمة نقاط */
  list?: string[];
  /** تنبيه بارز داخل القسم */
  note?: string;
  /** جدول مقارنة */
  table?: { head: string[]; rows: string[][] };
  /**
   * جدول أسعار موثّق — الأرقام منقولة عن مصادرها لا من عندنا.
   * يُسمح به في صفحات التكلفة والوجهة فقط.
   */
  priceTable?: "liver" | "kidney" | "countryLiver" | "countryKidney";
};

export type ContentPage = {
  /** المسار بلا شرطة بادئة */
  slug: string;
  /** الكلمة الأساسية من KEYWORDS-MASTER.md — لا تُخترع كلمة خارجه */
  keyword: string;
  /** نطاق الحجم الشهري كما عرضه Keyword Planner — للتوثيق الداخلي */
  volume: string;
  /** عنوان الصفحة ≤ 60 حرفاً */
  title: string;
  /** الوصف 120–160 حرفاً، الكلمة المفتاحية أولاً */
  description: string;
  h1: string;
  /** إجابة السؤال في سطرين — شرط AEO */
  lead: string;
  cluster: "liver" | "kidney" | "decision";
  /** اسم العنقود كما يظهر في مسار التنقل */
  clusterLabel: string;
  sections: Section[];
  /** ترقيم عناوين H2 تلقائياً (١. ٢. ٣.) — لتسهيل استخراج المقتطفات */
  numbered?: boolean;
  /**
   * تاريخا النشر وآخر تحديث — ISO (YYYY-MM-DD).
   * ⚠️ تواريخ حقيقية فقط، مأخوذة من سجل النشر الفعلي. لا تُحدَّث بلا تغيير
   * حقيقي في المحتوى: تاريخ تحديث كاذب إشارة خادعة لا إشارة حداثة.
   * الافتراض حين تُترك فارغة: DEFAULT_PUBLISHED أدناه.
   */
  published?: string;
  updated?: string;
  faqs?: { q: string; a: string }[];
  /** slugs صفحات مرتبطة — تُعرض في «اقرأ أيضاً» */
  related?: string[];
  /** المراجعات المطلوبة قبل أي نشر */
  review?: ("medical" | "legal" | "commercial")[];
};
