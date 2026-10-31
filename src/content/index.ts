import type { ContentPage } from "./types";
import { LIVER } from "./liver";
import { KIDNEY } from "./kidney";
import { DECISION } from "./decision";
import { EXTRA } from "./extra";
import { WAVE2 } from "./wave2";
import { KEYWORD_MAP, norm } from "./keywords";
import { INLINE_LINKS, type InlineLink } from "./links";

const RAW: ContentPage[] = [...LIVER, ...KIDNEY, ...DECISION, ...EXTRA, ...WAVE2];

/** ملاحظات طبقة الربط — تُدمج في `problems` أدناه فيفشل البناء بها */
const linkProblems: string[] = [];

/**
 * تاريخ إضافة طبقة الربط (`links.ts`) — تغيير محتوى حقيقي لا تجميلي: الصفحة
 * تكسب فقرات نصية يراها القارئ. فمن حُدِّثت فعلاً يحمل `updated` هذا التاريخ،
 * ومن له تاريخ أحدث منه يبقى على تاريخه. وما لم تمسّه الطبقة لا يُلمس تاريخه.
 *
 * عند تعديل `links.ts` لاحقاً: حدِّث هذا التاريخ. وإن نُسي فالتاريخ يتأخر
 * ولا يتقدّم — وهذا الاتجاه الآمن.
 */
const LINKS_DATE = "2026-10-31";

/** أهداف روابط المتن المكتوبة داخل نصوص الصفحة أصلاً (href="/slug") */
const hardLinks = (p: ContentPage): string[] => {
  const text = [
    ...p.sections.flatMap((s) => [
      ...(s.body ?? []),
      ...(s.list ?? []),
      s.note ?? "",
      ...(s.table ? s.table.rows.flat() : []),
    ]),
    ...(p.faqs ?? []).map((f) => f.a),
  ].join(" ");
  return [...text.matchAll(/href="\/([a-z0-9-]+)"/g)].map((m) => m[1]);
};

/**
 * تطبيق طبقة الربط الداخلي (`links.ts`) على الأقسام بمطابقة نص الـH2.
 *
 * الطبقة **تكميلية لا بديلة**: تتخطى أي هدف يربطه متن الصفحة أصلاً، لأن
 * رابطاً ثانياً من الصفحة نفسها إلى الهدف نفسه لا يضيف للزحف شيئاً (المصدر
 * واحد) ويُثقل القراءة. فتبقى `links.ts` خطةً كاملة مقروءة، ويُطبَّق منها ما
 * يسدّ نقصاً فعلياً — وتُستبعد تلقائياً المدخلات التي سبقها المتن إليها.
 *
 * ما لا يجد قسمه يُسجَّل خللاً يوقف البناء: فلا يسقط رابط بصمت ولا يُزرع في
 * موضع خاطئ حين يُعاد تسمية قسم.
 */
const applyInlineLinks = (p: ContentPage): ContentPage => {
  const plan = INLINE_LINKS[p.slug];
  if (!plan?.length) return p;

  /** أهداف مربوطة أصلاً + ما تضيفه هذه الطبقة — فلا تكرار بأي وجه */
  const taken = new Set(hardLinks(p));
  const placed = new Set<number>();

  const sections = p.sections.map((s) => {
    const mine: InlineLink[] = [];
    plan.forEach((l, i) => {
      if (l.at !== s.h2) return;
      placed.add(i);
      if (taken.has(l.to)) return;
      taken.add(l.to);
      mine.push(l);
    });
    if (!mine.length) return s;
    return {
      ...s,
      links: [
        ...(s.links ?? []),
        ...mine.map(({ to, before, anchor, after }) => ({ to, before, anchor, after })),
      ],
    };
  });

  plan.forEach((l, i) => {
    if (!placed.has(i))
      linkProblems.push(`رابط متن في /${p.slug} يشير إلى قسم غير موجود: «${l.at}»`);
  });

  const gained = sections.some((s, i) => (s.links?.length ?? 0) > (p.sections[i].links?.length ?? 0));
  const updated = gained && !(p.updated && p.updated > LINKS_DATE) ? LINKS_DATE : p.updated;

  return { ...p, sections, ...(updated ? { updated } : {}) };
};

/** كل صفحات المحتوى بعد تطبيق طبقة الربط. */
export const PAGES: ContentPage[] = RAW.map(applyInlineLinks);

/**
 * تاريخ أول نشر حيّ للموقع — مؤكَّد من سجل git (أول نشر إلى الدومين).
 * كل صفحة لم تُحدَّد لها `published` نُشرت في هذا التاريخ.
 */
export const DEFAULT_PUBLISHED = "2026-10-25";

/** تاريخا الصفحة بعد تطبيق الافتراضات */
export const pageDates = (p: ContentPage) => {
  const published = p.published ?? DEFAULT_PUBLISHED;
  return { published, updated: p.updated ?? published };
};

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

problems.push(...linkProblems);

/**
 * فحص روابط المتن.
 *
 * الخلفية: قياس 31 أكتوبر 2026 أظهر 17 صفحة بروابط متن ≤ 2، وصفحة يتيمة
 * تماماً. روابط المتن — لا بطاقات «اقرأ أيضاً» التي تسكن `<nav>` — هي ما
 * ينقل الدلالة بمرساته. فهذا الفحص يمنع رجوع الخلل:
 *  1. كل هدف موجود، ولا صفحة تربط نفسها.
 *  2. لا مرساة عامة: المرساة تحمل كلمة الصفحة الهدف لا كلمة «اضغط هنا».
 *  3. لكل صفحة محتوى 3 روابط متن واردة على الأقل من صفحات محتوى أخرى.
 */
const GENERIC_ANCHORS = ["هنا", "اضغط", "المزيد", "اقرأ المزيد", "الرابط", "هذه الصفحة", "التفاصيل"];

/**
 * صفحات قائمة بذاتها في `src/pages/` فليست في `PAGES` — روابطها صحيحة
 * وإن لم تكن صفحات محتوى، فلا تُحتسب هدفاً ناقصاً.
 */
const STANDALONE = new Set(["about", "request-evaluation", "privacy", "medical-disclaimer"]);

const inbound = new Map<string, Set<string>>();
for (const s of slugs) inbound.set(s, new Set());

for (const p of PAGES) {
  const targets = [
    ...hardLinks(p),
    ...p.sections.flatMap((s) => (s.links ?? []).map((l) => l.to)),
  ];
  for (const t of targets) {
    if (STANDALONE.has(t)) continue;
    if (!slugs.has(t)) {
      problems.push(`رابط متن في ${p.slug} يشير إلى صفحة غير موجودة: ${t}`);
      continue;
    }
    if (t === p.slug) problems.push(`رابط متن في ${p.slug} يشير إلى نفسه`);
    else inbound.get(t)!.add(p.slug);
  }

  for (const s of p.sections)
    for (const l of s.links ?? []) {
      const a = l.anchor.trim();
      if (a.length < 8 || GENERIC_ANCHORS.includes(a))
        problems.push(`مرساة عامة أو قصيرة في ${p.slug} → ${l.to}: «${a}»`);
    }
}

const MIN_INBOUND = 3;
for (const p of PAGES) {
  const n = inbound.get(p.slug)!.size;
  if (n < MIN_INBOUND)
    problems.push(`روابط المتن الواردة إلى /${p.slug} ${n} فقط (المطلوب ${MIN_INBOUND})`);
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
