import type { ContentPage } from "./types";
import { LIVER } from "./liver";
import { KIDNEY } from "./kidney";
import { DECISION } from "./decision";
import { KEYWORD_MAP, norm } from "./keywords";

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

/**
 * فحص السيطرة على الكلمات: كل كلمة في KEYWORD_MAP يجب أن ترد فعلاً
 * في نص صفحتها (العنوان أو H1 أو المقدمة أو الأقسام أو الأسئلة).
 * المقارنة بعد التطبيع، فتكفي صيغة واحدة لتغطية رسماتها.
 */
const pageText = (p: ContentPage): string =>
  norm(
    [
      // لا نُدرج p.keyword لأنه لا يُطبع على الصفحة — الفحص يجب أن يقيس
      // ما يراه الزائر ومحرك البحث فعلاً، لا ما في بيانات المصدر.
      p.title,
      p.description,
      p.h1,
      p.lead,
      ...p.sections.flatMap((s) => [
        s.h2,
        ...(s.body ?? []),
        ...(s.list ?? []),
        s.note ?? "",
        ...(s.table ? [...s.table.head, ...s.table.rows.flat()] : []),
      ]),
      ...(p.faqs ?? []).flatMap((f) => [f.q, f.a]),
    ]
      .join(" · ")
      .replace(/<[^>]+>/g, " ")
  );

const textCache = new Map<string, string>();
for (const p of PAGES) textCache.set(p.slug, pageText(p));

const missing: string[] = [];
for (const [kw, slug, tier] of KEYWORD_MAP) {
  const t = textCache.get(slug);
  if (t === undefined) {
    problems.push(`كلمة «${kw}» مسندة إلى صفحة غير موجودة: ${slug}`);
    continue;
  }
  if (!t.includes(norm(kw))) missing.push(`[فئة ${tier}] «${kw}» غائبة عن /${slug}`);
}
if (missing.length) problems.push(...missing);

if (problems.length) {
  throw new Error(
    `فحص المحتوى فشل (${problems.length}):\n - ${problems.join("\n - ")}`
  );
}
