/**
 * هوية TransplantBridge ونصوصه الثابتة — مصدر واحد لكل الموقع.
 * أي تعديل على الهوية أو الصياغة يتم هنا فقط.
 */

/** الدومين: مصدر واحد. فارغ = وضع محلي (حرس الدومين في astro.config.mjs). */
export const SITE_URL = (import.meta.env.PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
export const IS_LOCAL = SITE_URL === "";

export const SITE = {
  name: "TransplantBridge",
  nameAr: "ترانسبلانت بريدج",
  tagline: "التعافي يبدأ من هنا",
  /** وصف الموقع — يُستعمل في Organization schema وفي الوصف الافتراضي */
  description:
    "دليل عربي لزرع الكبد وزراعة الكلى: الشروط والمخاطر ونسب النجاح وما بعد العملية، وتنسيق التواصل مع المستشفى.",
  locale: "ar",
  lang: "ar",
  dir: "rtl" as const,
} as const;

/** واتساب — قناة التواصل الوحيدة. */
const WA_DIGITS = "962795827790";
export const WHATSAPP = {
  display: "+962 7 9582 7790",
  link: (text?: string) =>
    `https://wa.me/${WA_DIGITS}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
  defaultMessage:
    "السلام عليكم، أريد الاستفسار عن تقييم حالة لزرع الكبد أو زراعة الكلى.",
} as const;

/**
 * من نحن وما لسنا — نص ملزم يظهر بصيغ مختصرة في كل الموقع.
 * ممنوع ذكر اسم أي مستشفى، وممنوع ذكر عدد الاتفاقيات (PLAN.md §9).
 */
export const ROLE = {
  weAre:
    "TransplantBridge جهة تنسيق مستقلة: نقرأ ملفك الطبي، ونجهّزه بالشكل الذي يطلبه فريق الزراعة، ونوصلك إلى المنسق الدولي في المستشفى، ونتابع معك بعد الإحالة.",
  weAreNot:
    "لسنا مستشفى ولا عيادة ولا طبيباً. لا نتخذ قراراً طبياً، ولا نضمن قبول أي مريض، ولا نضمن نتيجة علاجية.",
  noTrafficking:
    "دورنا لا يشمل شراء الأعضاء أو بيعها أو الوساطة في ذلك بأي صورة. بيع الأعضاء جريمة في تركيا وفي كل الدول العربية، ولا نتعامل مع أي طلب من هذا النوع.",
} as const;

/** إخلاء المسؤولية الطبية — أعلى كل صفحة محتوى وفي التذييل. */
export const DISCLAIMER =
  "هذه الصفحة معلومات عامة للتثقيف، وليست استشارة طبية ولا تشخيصاً ولا بديلاً عن رأي طبيبك. القرار الطبي وتحديد الأهلية يعودان إلى المستشفى والفريق المعالج، والمتطلبات القانونية تؤكدها الجهات المختصة.";

/** القائمة الرئيسية */
export const NAV: { label: string; href: string }[] = [
  { label: "زرع الكبد", href: "/liver-transplant" },
  { label: "زراعة الكلى", href: "/kidney-transplant" },
  { label: "التبرع والمتبرع", href: "/kidney-donation" },
  { label: "التكلفة", href: "/transplant-cost" },
  { label: "من نحن", href: "/about" },
];

/** روابط التذييل */
export const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "الكبد",
    links: [
      { label: "زرع الكبد", href: "/liver-transplant" },
      { label: "التبرع بالكبد", href: "/liver-donation" },
      { label: "شروط التبرع بالكبد", href: "/liver-donor-requirements" },
      { label: "خطورة التبرع بالكبد", href: "/liver-donor-risks" },
    ],
  },
  {
    title: "الكلى",
    links: [
      { label: "زراعة الكلى", href: "/kidney-transplant" },
      { label: "التبرع بالكلى", href: "/kidney-donation" },
      { label: "شروط التبرع بالكلى", href: "/kidney-donor-requirements" },
      { label: "نسبة نجاح زراعة الكلى", href: "/kidney-transplant-success-rate" },
    ],
  },
  {
    title: "الموقع",
    links: [
      { label: "من نحن", href: "/about" },
      { label: "اطلب تقييم حالتك", href: "/request-evaluation" },
      { label: "إخلاء المسؤولية الطبية", href: "/medical-disclaimer" },
      { label: "سياسة الخصوصية", href: "/privacy" },
    ],
  },
];

/** بناء رابط مطلق — يرجع رابطاً نسبياً في الوضع المحلي (لا عنوان وهمي). */
export const abs = (path: string): string =>
  IS_LOCAL ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
