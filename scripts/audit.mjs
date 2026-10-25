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

const slugs = new Set(files.map((f) => "/" + f.replace(/\.html$/, "")));
slugs.add("/"); slugs.add("/index");

let badPrice = 0, unsourced = 0, pctHits = 0, badLinks = 0, titleLong = 0, descBad = 0, badH1 = 0;
const report = [];

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
  if (pcts.length) { pctHits += pcts.length; report.push(`  ⚠️ ${f}: نسبة مئوية → ${pcts.slice(0,2).join(" | ")}`); }

  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1].replace(/\/$/, "") || "/";
    if (href.startsWith("/_astro") || /\.(svg|txt|xml|png|jpg|webp)$/.test(href)) continue;
    if (!slugs.has(href)) { badLinks++; report.push(`  ⚠️ ${f}: رابط مكسور → ${href}`); }
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
  `روابط مكسورة: ${badLinks} | H1 خاطئ: ${badH1} | عناوين طويلة: ${titleLong} | أوصاف خارج المدى: ${descBad}`
);
if (report.length) console.log(report.slice(0, 30).join("\n"));
else console.log("✅ لا ملاحظات");
