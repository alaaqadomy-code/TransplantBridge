/** يفحص تغطية الكلمات في HTML المبني فعلاً — لا في بيانات المصدر. */
import { readFileSync } from "node:fs";
const norm = (s) => s.replace(/[ؗ-ًؚ-ْٰـ]/g,"")
  .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
  .replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/\s+/g," ").trim();

const src = readFileSync("src/content/keywords.ts","utf8");
const map = [...src.matchAll(/\["([^"]+)",\s*"([a-z-]+)",\s*([12])\]/g)].map(m => [m[1], m[2], +m[3]]);

let ok = 0; const miss = [];
for (const [kw, slug, tier] of map) {
  const html = readFileSync(`dist/${slug}.html`, "utf8")
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g," ")
    .replace(/<[^>]+>/g," ").replace(/\s+/g," ");
  if (norm(html).includes(norm(kw))) ok++; else miss.push(`[${tier}] ${kw} → /${slug}`);
}
const t1 = map.filter(m => m[2] === 1).length;
console.log(`الكلمات المُلزَمة: ${map.length} (فئة أولى: ${t1} · فئة ثانية: ${map.length - t1})`);
console.log(`مغطاة في HTML المبني: ${ok}/${map.length}`);
if (miss.length) { console.log("غير مغطاة:"); miss.forEach(m => console.log("  - " + m)); }
else console.log("✅ سيطرة كاملة — كل كلمة ترد في صفحتها");
