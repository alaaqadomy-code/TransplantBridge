/**
 * البيانات المنظمة — Organization · WebSite · WebPage · BreadcrumbList · FAQPage.
 *
 * ممنوع منعاً باتاً (PLAN.md §8):
 *   MedicalClinic · Physician · AggregateRating · Review ذاتي ·
 *   أطباء أو مراجعون غير حقيقيين · اعتماد أو وكالة غير مثبتة ·
 *   عناوين أو بيانات اتصال لم يقدّمها المالك.
 * وكل ما يُكتب هنا يجب أن يطابق المحتوى الظاهر على الصفحة.
 */
import { SITE, SITE_URL, IS_LOCAL, WHATSAPP, abs } from "./site";

type Json = Record<string, unknown>;

const ORG_ID = `${SITE_URL || ""}/#organization`;
const SITE_ID = `${SITE_URL || ""}/#website`;

/** الكيان: منظمة معلوماتية وتنسيقية — لا جهة طبية. */
export const organization = (): Json => ({
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE.name,
  alternateName: SITE.nameAr,
  description: SITE.description,
  ...(IS_LOCAL
    ? {}
    : {
        url: SITE_URL,
        // شعار الموقع — يقوّي تعريف الكيان في نتائج Google ومحركات الإجابة
        logo: { "@type": "ImageObject", url: `${SITE_URL}/og.png`, width: 1200, height: 630 },
        image: `${SITE_URL}/og.png`,
      }),
  knowsLanguage: "ar",
  // قناة التواصل الوحيدة المعلنة: واتساب. لا بريد ولا عنوان — فلا نخترع ما ليس لنا.
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    telephone: `+${WHATSAPP.digits}`,
    availableLanguage: ["ar"],
    areaServed: ["JO", "SA", "AE", "KW", "QA", "IQ", "EG", "OM", "BH"],
  },
});

export const website = (): Json => ({
  "@type": "WebSite",
  "@id": SITE_ID,
  name: SITE.name,
  description: SITE.description,
  inLanguage: SITE.locale,
  publisher: { "@id": ORG_ID },
  ...(IS_LOCAL ? {} : { url: SITE_URL }),
});

export const webPage = (opts: {
  path: string;
  title: string;
  description: string;
  updated?: string;
}): Json => ({
  "@type": "WebPage",
  ...(IS_LOCAL ? {} : { "@id": `${abs(opts.path)}#webpage`, url: abs(opts.path) }),
  name: opts.title,
  description: opts.description,
  inLanguage: SITE.locale,
  isPartOf: { "@id": SITE_ID },
  ...(opts.updated ? { dateModified: opts.updated } : {}),
});

export const breadcrumbs = (items: { name: string; path: string }[]): Json => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    ...(IS_LOCAL ? {} : { item: abs(it.path) }),
  })),
});

/** يُستعمل فقط حيث توجد أسئلة حقيقية معروضة على الصفحة. */
export const faqPage = (qa: { q: string; a: string }[]): Json => ({
  "@type": "FAQPage",
  mainEntity: qa.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});

/** يجمع العُقد في رسم واحد. */
export const graph = (nodes: Json[]): string =>
  JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });

/**
 * صفحة محتوى طبي معلوماتي.
 *
 * نستعمل `MedicalWebPage` لأنها النوع الذي يصف صفحة معلومات صحية —
 * ولا نستعمل `MedicalClinic` ولا `Physician` ولا `reviewedBy`، لأن الموقع
 * جهة تنسيق لا جهة طبية، ولأن المراجعة الطبية لم تحدث بعد (MEDICAL-REVIEW.md).
 *
 * `lastReviewed` متروكة عمداً: تعبئتها بلا مراجع حقيقي ادّعاء كاذب.
 */
export const medicalWebPage = (opts: {
  path: string;
  title: string;
  description: string;
  published: string;
  updated: string;
  /** اسم الإجراء أو الحالة التي تدور حولها الصفحة */
  about?: string;
  breadcrumbId?: string;
}): Json => ({
  "@type": ["MedicalWebPage", "WebPage"],
  ...(IS_LOCAL ? {} : { "@id": `${abs(opts.path)}#webpage`, url: abs(opts.path) }),
  name: opts.title,
  description: opts.description,
  inLanguage: SITE.locale,
  isPartOf: { "@id": SITE_ID },
  publisher: { "@id": ORG_ID },
  datePublished: opts.published,
  dateModified: opts.updated,
  // جمهور الصفحة: المريض وذووه، لا الطبيب
  audience: { "@type": "MedicalAudience", audienceType: "Patient" },
  ...(opts.about
    ? { about: { "@type": "MedicalProcedure", name: opts.about } }
    : {}),
  ...(opts.breadcrumbId ? { breadcrumb: { "@id": opts.breadcrumbId } } : {}),
});
