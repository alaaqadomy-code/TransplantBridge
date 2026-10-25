// scripts/depth.mjs — يقارن عمق صفحات المال عندنا بأعمق صفحة مقابلة عند المنافس.
// أرقام المنافس مرصودة يدوياً من صفحاته الحيّة (كلمات المتن بلا هيدر/فوتر) ومثبّتة هنا بتاريخها.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");

// رُصدت 25 أكتوبر 2026 — عدد كلمات متن أعمق صفحة منافسة لكل نية.
const RIVALS = {
  "pediatric-liver-transplant": { words: 3557, who: "Safak Medical" },
  "liver-transplant": { words: 2699, who: "Safak Medical" },
  "liver-transplant-turkey": { words: 2699, who: "Safak Medical" },
  "liver-donor-requirements": { words: 2407, who: "Safak Medical" },
  "transplant-hospitals-turkey": { words: 2161, who: "Safak Medical" },
  "kidney-transplant-turkey": { words: 1690, who: "Safak Medical" },
  "kidney-transplant": { words: 1690, who: "Safak Medical" },
  "transplant-cost": { words: 1612, who: "Safak Medical" },
};

const HOME_RIVALS = { "bi-maristan": 2639, "Safak Medical": 1180 };

function bodyWords(slug) {
  const f = join(DIST, `${slug}.html`);
  if (!existsSync(f)) return null;
  let html = readFileSync(f, "utf8");
  // أزل الهيدر والفوتر والسكربتات والسكيما حتى نقيس المتن وحده
  html = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<header[\s\S]*?<\/header>/g, " ")
    .replace(/<footer[\s\S]*?<\/footer>/g, " ")
    .replace(/<nav[\s\S]*?<\/nav>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/g, " ");
  return html.split(/\s+/).filter((w) => /[؀-ۿ0-9a-zA-Z]/.test(w)).length;
}

let won = 0;
let remaining = 0;
const rows = [];
for (const [slug, r] of Object.entries(RIVALS)) {
  const ours = bodyWords(slug);
  if (ours === null) {
    rows.push([slug, "—", r.words, "⚠ غير مبنية"]);
    continue;
  }
  const diff = ours - r.words;
  if (diff >= 0) {
    won++;
    rows.push([slug, ours, r.words, "✅ تفوّقنا"]);
  } else {
    remaining += -diff;
    rows.push([slug, ours, r.words, `⬇ ${-diff}`]);
  }
}

rows.sort((a, b) => (a[3].startsWith("✅") ? 1 : 0) - (b[3].startsWith("✅") ? 1 : 0));
for (const [slug, ours, rival, verdict] of rows) {
  console.log(`${slug.padEnd(32)} ${String(ours).padStart(5)} / ${String(rival).padStart(5)}  ${verdict}`);
}
console.log("");
console.log(`صفحات المال: تفوّقنا ${won} من ${Object.keys(RIVALS).length} | المتبقي ${remaining} كلمة`);

const home = bodyWords("index");
const topHome = Math.max(...Object.values(HOME_RIVALS));
console.log("");
console.log(`الرئيسية: ${home} كلمة | أقوى منافس ${topHome} (bi-maristan)` + (home >= topHome ? " ✅" : ` ⬇ ${topHome - home}`));
