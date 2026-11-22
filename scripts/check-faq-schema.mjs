/**
 * check-faq-schema (نسخة TransplantBridge) — الأسئلة الظاهرة والسكيما متطابقتان.
 *
 * نسخة القالب تبحث عن قسم «الأسئلة الشائعة» في ملفات `.md`، وهنا لا `.md`: الأسئلة
 * في بيانات TS تُرسم `<details><summary>` داخل <main>. فكانت تمرّ خضراء بـ«0 مقال».
 * فأُعيدت لتقرأ dist وحده، فتقيس ما يراه Google لا ما نظنّه في المصدر:
 *   • صفحة فيها أسئلة ظاهرة ⇒ FAQPage بنفس العدد، وكل سؤال في السكيما ظاهر حرفياً.
 *   • FAQPage بلا أسئلة ظاهرة ⇒ خطأ (سكيما لا تطابق المحتوى مخالفة لإرشادات Google).
 *
 * الاستخدام: node scripts/check-faq-schema.mjs
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';

if (!existsSync('dist')) { console.error('✗ لا dist — شغّل npm run build أولاً'); process.exit(1); }

const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const errors = [];
let withFaq = 0, questions = 0;

for (const f of readdirSync('dist').filter((n) => n.endsWith('.html'))) {
  const html = readFileSync(`dist/${f}`, 'utf8');
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
  const shown = [...main.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map((m) => text(m[1]));
  const schemaQs = [];
  for (const b of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(b[1]); } catch { errors.push(`${f} :: JSON-LD غير صالح`); continue; }
    for (const n of j['@graph'] ?? [j]) if (n['@type'] === 'FAQPage') for (const q of n.mainEntity ?? []) schemaQs.push(text(q.name ?? ''));
  }
  if (!shown.length && !schemaQs.length) continue;
  withFaq++; questions += schemaQs.length;
  if (shown.length && !schemaQs.length) errors.push(`${f} :: ${shown.length} سؤال ظاهر بلا FAQPage`);
  else if (!shown.length) errors.push(`${f} :: FAQPage بـ${schemaQs.length} سؤال ولا سؤال ظاهر`);
  else {
    if (schemaQs.length < 2) errors.push(`${f} :: FAQPage بسؤال واحد`);
    // الظاهر قد يحمل نصاً زائداً (أيقونة/رقم)، فالشرط: نص سؤال السكيما موجود داخل أحد الأسئلة الظاهرة
    for (const q of schemaQs) if (!shown.some((s) => s.includes(q))) errors.push(`${f} :: سؤال في السكيما غير ظاهر: «${q.slice(0, 60)}»`);
    if (shown.length !== schemaQs.length) errors.push(`${f} :: ظاهر ${shown.length} ≠ سكيما ${schemaQs.length}`);
  }
}

console.log(`صفحات بأسئلة: ${withFaq} · أسئلة في السكيما: ${questions}`);
if (errors.length) { console.log(`✗ ${errors.length} مخالفة:`); errors.forEach((e) => console.log('  ' + e)); process.exit(1); }
console.log('✓ كل سؤال في FAQPage ظاهر على صفحته، والعدد متطابق.');
