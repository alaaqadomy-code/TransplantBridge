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

const slugs = new Set(files.map((f) => "/" + f.replace(/\.html$/, "")));
slugs.add("/"); slugs.add("/index");

let priceHits = 0, pctHits = 0, badLinks = 0, titleLong = 0, descBad = 0;
const report = [];

for (const f of files) {
  const html = readFileSync(join(DIST, f), "utf8");
  const text = strip(html);

  // أرقام أسعار أو نسب مئوية في النص المرئي
  const prices = text.match(/\$\s?[\d,]{3,}|[\d,]{3,}\s?دولار|[\d.]+\s?ألف\s?دولار/g) || [];
  const pcts = text.match(/\d{1,3}\s?%|\d{1,2}٪/g) || [];
  if (prices.length) { priceHits += prices.length; report.push(`  ⚠️ ${f}: أسعار → ${prices.slice(0,3).join(" | ")}`); }
  if (pcts.length) { pctHits += pcts.length; report.push(`  ⚠️ ${f}: نسب → ${pcts.slice(0,3).join(" | ")}`); }

  // روابط داخلية مكسورة
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1].replace(/\/$/, "") || "/";
    if (href.startsWith("/_astro") || href.endsWith(".svg") || href.endsWith(".txt")) continue;
    if (!slugs.has(href)) { badLinks++; report.push(`  ⚠️ ${f}: رابط مكسور → ${href}`); }
  }

  // العنوان والوصف
  const t = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const d = html.match(/name="description" content="([^"]*)"/)?.[1] ?? "";
  if (t.length > 62) { titleLong++; report.push(`  ⚠️ ${f}: عنوان ${t.length} حرفاً`); }
  if (d.length < 110 || d.length > 168) { descBad++; report.push(`  ⚠️ ${f}: وصف ${d.length} حرفاً`); }
}

console.log(`الصفحات: ${files.length}`);
console.log(`أسعار في النص: ${priceHits} | نسب مئوية في النص: ${pctHits} | روابط مكسورة: ${badLinks} | عناوين طويلة: ${titleLong} | أوصاف خارج المدى: ${descBad}`);
if (report.length) console.log(report.slice(0, 25).join("\n")); else console.log("✅ لا ملاحظات");
