import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const files = readdirSync(DIST).filter((f) => f.endsWith(".html"));

const strip = (h) =>
  h.replace(/<script[\s\S]*?<\/script>/g, " ")
   .replace(/<style[\s\S]*?<\/style>/g, " ")
   .replace(/<svg[\s\S]*?<\/svg>/g, " ")
   .replace(/<head[\s\S]*?<\/head>/g, " ")
   .replace(/<[^>]+>/g, " ")
   .replace(/&[a-z]+;/g, " ")
   .replace(/\s+/g, " ");

/**
 * الأرقام السعرية مسموحة في هذه الصفحات فقط، وبشرط وجود التحذير والإسناد.
 * أي سعر خارجها = خرق للقاعدة.
 */
const PRICE_ALLOWED = new Set(["transplant-cost", "liver-transplant-turkey", "kidney-transplant-turkey"]);
const ATTRIBUTION = "منقول عن جهة نشرته";
const SOURCE_MARK = "رُصد";

/**
 * نسب البقاء مسموحة في هاتين الصفحتين فقط، وبشرط الإسناد (قرار المالك
 * 20 نوفمبر 2026). والسبب في رأس `src/content/survival.ts`.
 *
 * الشرط ليس شكلياً: الصفحة التي تذكر نسبة بلا اسم السجل وبلا الـDOI وبلا
 * فوج الزراعة تخالف القاعدة ويُبلَّغ عنها هنا. وأي نسبة خارج هاتين الصفحتين
 * تبقى خرقاً كما كانت.
 */
const PCT_ALLOWED = new Set(["kidney-transplant-success-rate", "liver-transplant-success-rate"]);
const PCT_REQUIRED = ["DOI:", "الفوج:", "المصدر:"];

const slugs = new Set(files.map((f) => "/" + f.replace(/\.html$/, "")));
slugs.add("/"); slugs.add("/index");

let badPrice = 0, unsourced = 0, pctHits = 0, badLinks = 0, titleLong = 0, descBad = 0, badH1 = 0;
let glued = 0;
const report = [];

/**
 * التصاق النص بالرابط.
 *
 * `compressHTML` في Astro (مفعّل افتراضياً) يحذف فاصل السطر بين نصٍّ و<a> متجاورين
 * في المصدر، فيخرج «في صفحةكيف تختار» كلمةً واحدة ملتصقة. حدث ذلك في 9 مواضع
 * قبل 20 نوفمبر 2026 دون أن يلاحظه أحد، لأن المصدر يبدو سليماً تماماً.
 *
 * العلاج في المصدر: `{" "}` في آخر السطر السابق للرابط (كما في Disclaimer.astro).
 * وهذا الفحص يمنع رجوع الخلل.
 *
 * البادئات العربية (و، ف، ب، ل، ك) تلتصق بما بعدها شرعاً فتُستثنى، وكذلك التطويل.
 */
const PREFIX = new Set(["و", "ف", "ب", "ل", "ك"]);
const isArabic = (c) => c >= "ء" && c <= "ي";

const gluedSpots = (html) => {
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "";
  const body = main.replace(/<nav[\s\S]*?<\/nav>/g, " ");
  const out = [];

  for (const m of body.matchAll(/(.)<a\s[^>]*>/g)) {
    if (!isArabic(m[1])) continue;
    const before = body.slice(Math.max(0, m.index - 30), m.index + 1).replace(/<[^>]+>/g, "");
    const word = before.trim().split(/\s+/).pop() ?? "";
    if (word.endsWith("ـ") || (word.length === 1 && PREFIX.has(word))) continue;
    out.push(`${word} ← ${body.slice(m.index).replace(/<[^>]+>/g, "").slice(1, 22)}`);
  }
  for (const m of body.matchAll(/<\/a>([ء-ي])/g)) {
    const before = body.slice(Math.max(0, m.index - 30), m.index).replace(/<[^>]+>/g, "");
    out.push(`${before.trim().split(/\s+/).pop() ?? ""} ← ${body.slice(m.index).replace(/<[^>]+>/g, "").slice(0, 22)}`);
  }
  return out;
};

for (const f of files) {
  const slug = f.replace(/\.html$/, "");
  const html = readFileSync(join(DIST, f), "utf8");
  const text = strip(html);

  const prices = text.match(/\$\s?[\d,]{3,}|[\d,]{4,}\s?دولار|تبدأ من [\d,]{4,}/g) || [];
  if (prices.length) {
    if (!PRICE_ALLOWED.has(slug)) {
      badPrice += prices.length;
      report.push(`  ⚠️ ${f}: سعر في صفحة غير مصرّح بها → ${prices.slice(0, 2).join(" | ")}`);
    } else if (!text.includes(ATTRIBUTION) || !text.includes(SOURCE_MARK)) {
      unsourced++;
      report.push(`  ⚠️ ${f}: أسعار بلا تحذير أو بلا إسناد`);
    }
  }

  const pcts = text.match(/\d{1,3}\s?%|\d{1,2}٪/g) || [];
  if (pcts.length) {
    if (!PCT_ALLOWED.has(slug)) {
      pctHits += pcts.length;
      report.push(`  ⚠️ ${f}: نسبة مئوية في صفحة غير مصرّح بها → ${pcts.slice(0, 2).join(" | ")}`);
    } else {
      const missing = PCT_REQUIRED.filter((k) => !text.includes(k));
      if (missing.length) {
        pctHits += pcts.length;
        report.push(`  ⚠️ ${f}: نسب بلا إسناد كامل — ينقصها ${missing.join(" و")}`);
      }
    }
  }

  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1].replace(/\/$/, "") || "/";
    if (href.startsWith("/_astro") || /\.(svg|txt|xml|png|jpg|webp)$/.test(href)) continue;
    if (!slugs.has(href)) { badLinks++; report.push(`  ⚠️ ${f}: رابط مكسور → ${href}`); }
  }

  const spots = gluedSpots(html);
  if (spots.length) {
    glued += spots.length;
    report.push(`  ⚠️ ${f}: نص ملتصق برابط → ${spots.slice(0, 2).join(" | ")}`);
  }

  const h1n = (html.match(/<h1/g) || []).length;
  if (h1n !== 1) { badH1++; report.push(`  ⚠️ ${f}: عدد H1 = ${h1n}`); }

  const t = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const d = html.match(/name="description" content="([^"]*)"/)?.[1] ?? "";
  if (t.length > 62) { titleLong++; report.push(`  ⚠️ ${f}: عنوان ${t.length} حرفاً`); }
  if (d.length < 110 || d.length > 168) { descBad++; report.push(`  ⚠️ ${f}: وصف ${d.length} حرفاً`); }
}

console.log(`الصفحات: ${files.length}`);
console.log(
  `أسعار خارج المصرّح: ${badPrice} | أسعار بلا إسناد: ${unsourced} | نسب مئوية: ${pctHits} | ` +
  `روابط مكسورة: ${badLinks} | H1 خاطئ: ${badH1} | عناوين طويلة: ${titleLong} | أوصاف خارج المدى: ${descBad} | ` +
  `نص ملتصق برابط: ${glued}`
);
if (report.length) console.log(report.slice(0, 30).join("\n"));
else console.log("✅ لا ملاحظات");
