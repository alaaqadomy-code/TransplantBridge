/**
 * الأرقام السعرية المنشورة — منقولة بالنص عن مصادرها، لا من عندنا.
 *
 * القاعدة (PLAN.md §9 + KEYWORDS-MASTER): لا نخترع رقماً ولا ندمج مصدرين
 * في نطاق جديد. كل سطر هنا رُصد على صفحة منشورة، ومعه اسم الجهة ورابطها
 * وتاريخ رصدنا له وما قالت الجهة إنه مشمول.
 *
 * ولأن الجهات كلها مواقع سياحة طبية تجارية، فهذه **ليست عروض أسعار**
 * ولا أسعار مستشفى، ونقول ذلك في كل موضع تُعرض فيه.
 */

export type PriceRow = {
  /** النطاق كما نُشر حرفياً */
  range: string;
  /** الجهة الناشرة */
  source: string;
  url: string;
  /** تاريخ رصدنا للصفحة */
  observed: string;
  /** ما ذكرت الجهة أنه مشمول، إن ذكرت */
  includes?: string;
};

/** تاريخ آخر رصد شامل */
export const PRICES_CHECKED = "25 أكتوبر 2026";

export const LIVER_PRICES: PriceRow[] = [
  {
    range: "50,000 – 70,000 دولار",
    source: "Safak Medical",
    url: "https://safakmedical.com/تكلفة-زراعة-الكبد-في-تركيا/",
    observed: "25 أكتوبر 2026",
    includes: "من متبرع حيّ قريب — وتذكر الجهة أن النطاق يختلف بحسب المستشفى وحالة المريض ومدة الإقامة",
  },
  {
    range: "45,000 – 48,000 دولار",
    source: "Hospidio",
    url: "https://hospidio.com/ar/treatment/liver-transplant-cost-in-turkey",
    observed: "24 أكتوبر 2026",
    includes: "تذكر الجهة أنه يشمل الجراحة وإقامة المريض والمتبرع في المستشفى",
  },
  {
    range: "45,000 – 80,000 دولار",
    source: "Turkey Luxury Clinics",
    url: "https://turkeyluxuryclinics.com/ar/blog/liver-transplant-cost",
    observed: "24 أكتوبر 2026",
  },
  {
    range: "70,000 – 80,000 دولار",
    source: "International Clinics",
    url: "https://internationalclinics.com/ar/blog/زراعة-الكبد-في-تركيا/",
    observed: "24 أكتوبر 2026",
  },
  {
    range: "تبدأ من 45,000 دولار",
    source: "MediGence",
    url: "https://medigence.com/ar/packages/liver-transplant/turkey",
    observed: "24 أكتوبر 2026",
    includes: "سعر ابتدائي، ويختلف بحسب كون المتبرع حيّاً أو متوفى وبحسب المستشفى",
  },
];

export const KIDNEY_PRICES: PriceRow[] = [
  {
    range: "17,000 – 28,000 دولار",
    source: "Safak Medical — صفحة التكلفة",
    url: "https://safakmedical.com/تكلفة-زراعة-الكلى-في-تركيا/",
    observed: "25 أكتوبر 2026",
    includes: "تذكر الجهة أنه يشمل الجراحة وإقامة المريض والمتبرع والفحوصات والتخدير والمتابعة بعد العملية",
  },
  {
    range: "18,000 – 25,000 دولار",
    source: "Safak Medical — صفحة الدليل",
    url: "https://safakmedical.com/زراعة-الكلى-في-تركيا/",
    observed: "25 أكتوبر 2026",
    includes: "من متبرع حيّ — وتذكر الجهة أن المريض يقضي نحو 3 إلى 4 أسابيع في تركيا",
  },
  {
    range: "15,000 – 40,000 دولار",
    source: "بيمارستان — زراعة الكلى بالروبوت",
    url: "https://bi-maristan.com/",
    observed: "11 أبريل 2025 (تاريخ الصفحة) · رُصد 24 أكتوبر 2026",
  },
  {
    range: "تبدأ من 16,000 دولار",
    source: "Vaidam Health",
    url: "https://www.vaidam.com/ar/cost/kidney-transplant/turkey",
    observed: "24 أكتوبر 2026",
    includes: "سعر ابتدائي",
  },
  {
    range: "16,000 – 45,000 دولار",
    source: "MediGence — مقارنة دول",
    url: "https://medigence.com/blog/kidney-transplant-cost-guide",
    observed: "30 أبريل 2026 (تاريخ الصفحة) · رُصد 24 أكتوبر 2026",
  },
  {
    range: "تبدأ من 60,000 دولار",
    source: "MediGence — مستشفى ميديبول ميجا",
    url: "https://medigence.com/hospitals/transplants/kidney-transplant/turkey",
    observed: "24 أكتوبر 2026",
    includes: "سعر مستشفى بعينه — وهو أعلى بكثير من بقية النطاقات المنشورة",
  },
];

/** مقارنة الدول كما نشرتها Safak Medical — منقولة عنها بالنص */
export const COUNTRY_LIVER: { country: string; range: string }[] = [
  { country: "الهند", range: "30,000 – 50,000 دولار" },
  { country: "تركيا", range: "50,000 – 70,000 دولار" },
  { country: "ألمانيا", range: "150,000 – 200,000 دولار" },
  { country: "الولايات المتحدة", range: "300,000 – 500,000 دولار" },
];

export const COUNTRY_KIDNEY: { country: string; range: string }[] = [
  { country: "الهند", range: "13,000 – 30,000 دولار" },
  { country: "تركيا", range: "17,000 – 28,000 دولار" },
  { country: "ألمانيا", range: "70,000 – 140,000 دولار" },
  { country: "الولايات المتحدة", range: "400,000 – 450,000 دولار" },
];

export const COUNTRY_SOURCE = {
  name: "Safak Medical",
  observed: "25 أكتوبر 2026",
  note:
    "الجدولان أعلاه منقولان عن Safak Medical كما نشرتهما، ولم نتحقق من مصدر أرقامها ولا من طريقة حسابها.",
};

/** بنود تُستثنى عادةً — مجمَّعة مما تذكره المصادر نفسها */
export const EXCLUSIONS: string[] = [
  "تقييم المتبرع كاملاً، وما يُنفَق عليه إن رُفض المتبرع بعد الفحص",
  "الأيام الزائدة في المستشفى أو في العناية المركزة عن أيام الباقة",
  "مثبطات المناعة بعد الخروج — وهي كلفة مستمرة مدى الحياة",
  "علاج المضاعفات وإعادة الدخول",
  "الإقامة خارج المستشفى بعد الخروج للمتابعة القريبة",
  "علاج أمراض سابقة تحتاج ضبطاً قبل العملية",
  "التأشيرات والترجمة والتنقل والمستندات",
];

/** الفحوصات التشخيصية — رقم منشور بمصدره */
export const DIAGNOSTICS = {
  range: "2,000 – 3,500 دولار",
  source: "Hospidio",
  observed: "24 أكتوبر 2026",
};
