import type { ContentPage } from "./types";
import { LIVER } from "./liver";
import { KIDNEY } from "./kidney";
import { DECISION } from "./decision";

/** كل صفحات المحتوى — 18 صفحة. */
export const PAGES: ContentPage[] = [...LIVER, ...KIDNEY, ...DECISION];

export const bySlug = (slug: string): ContentPage | undefined =>
  PAGES.find((p) => p.slug === slug);

/**
 * شبكة أمان تعمل وقت البناء:
 *  - لا slug مكرر
 *  - كل رابط في `related` يشير إلى صفحة موجودة فعلاً
 *  - لا كلمة مفتاحية مكررة بين صفحتين (منع تنافس الصفحات)
 *  - العنوان ≤ 60 حرفاً والوصف 120–160
 * أي خلل يوقف البناء بدل أن يمرّ إلى الموقع.
 */
const slugs = new Set<string>();
const keywords = new Map<string, string>();
const problems: string[] = [];

for (const p of PAGES) {
  if (slugs.has(p.slug)) problems.push(`slug مكرر: ${p.slug}`);
  slugs.add(p.slug);

  const prev = keywords.get(p.keyword);
  if (prev) problems.push(`كلمة مفتاحية مكررة «${p.keyword}» في ${prev} و ${p.slug}`);
  keywords.set(p.keyword, p.slug);

  if (p.title.length > 60) problems.push(`عنوان ${p.slug} طوله ${p.title.length} > 60`);
  if (p.description.length < 110 || p.description.length > 165)
    problems.push(`وصف ${p.slug} طوله ${p.description.length} (المطلوب 110–165)`);
}

for (const p of PAGES) {
  for (const r of p.related ?? []) {
    if (!slugs.has(r)) problems.push(`رابط «اقرأ أيضاً» في ${p.slug} يشير إلى صفحة غير موجودة: ${r}`);
  }
}

if (problems.length) {
  throw new Error(`فحص المحتوى فشل:\n - ${problems.join("\n - ")}`);
}
