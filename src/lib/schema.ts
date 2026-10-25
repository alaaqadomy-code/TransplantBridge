/**
 * البيانات المنظمة — Organization · WebSite · WebPage · BreadcrumbList · FAQPage.
 *
 * ممنوع منعاً باتاً (PLAN.md §8):
 *   MedicalClinic · Physician · AggregateRating · Review ذاتي ·
 *   أطباء أو مراجعون غير حقيقيين · اعتماد أو وكالة غير مثبتة ·
 *   عناوين أو بيانات اتصال لم يقدّمها المالك.
 * وكل ما يُكتب هنا يجب أن يطابق المحتوى الظاهر على الصفحة.
 */
import { SITE, SITE_URL, IS_LOCAL, abs } from "./site";

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
  ...(IS_LOCAL ? {} : { url: SITE_URL }),
  knowsLanguage: "ar",
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
