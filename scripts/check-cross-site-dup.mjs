/**
 * check-cross-site-dup (نسخة TransplantBridge) — تكرار الجمل بين مواقع علاء.
 *
 * نسخة الحزمة (~/.claude/skills/create-seo-site/scripts/check-cross-site-dup.mjs) تقرأ
 * src/content/*.md فتقيس «صفر جملة» هنا وتخرج 2. هذه تقرأ نص <main> في dist المبني
 * لكل موقع (نفس التطبيع وحدّ 8 كلمات)، فتقارن ما يُنشر فعلاً. موقع بلا dist لا يُقاس ويُذكر.
 * للتقرير عند الطلب لا للبوابة (يعتمد على مجلدات خارج المستودع).
 *
 *   node scripts/check-cross-site-dup.mjs [.] [مسار موقع آخر ...]
 *   (بلا مسارات: كل «موقع» في المركز projects.json)
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

let [target, ...others] = process.argv.slice(2);
if (!target) target = '.';
if (!others.length) {
  const reg = 'C:/Users/JCC/Desktop/تحكم كلود/المركز/projects.json';
  const j = JSON.parse(readFileSync(reg, 'utf8'));
  const arr = Array.isArray(j) ? j : j.projects || Object.values(j);
  others = arr.filter((p) => p.type === 'موقع' && p.id !== 'transplantbridge').map((p) => p.path).filter(Boolean);
}
if (!others.length) { console.error('لا مواقع للمقارنة'); process.exit(2); }

const walk = (d, o = []) => { for (const e of readdirSync(d)) { if (e === 'node_modules' || e === '.git') continue; const p = join(d, e); statSync(p).isDirectory() ? walk(p, o) : e.endsWith('.html') && o.push(p); } return o; };
const norm = (s) => s.replace(/[\u064B-\u0652\u0640\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/[ؤئ]/g, 'ء').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\u0621-\u064Aa-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function sents(site) {
  const dist = join(site, 'dist'); const out = new Set();
  if (!existsSync(dist)) return null;
  for (const f of walk(dist)) {
    let h = readFileSync(f, 'utf8'); h = h.match(/<main[\s\S]*?<\/main>/)?.[0] ?? h.replace(/<head[\s\S]*?<\/head>/, '');
    h = h.replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, ' ').replace(/<\/(p|li|h[1-6]|td|th|div|dd|dt|tr|summary|figcaption|blockquote)>|<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
    for (const r of h.split(/[.!?؟\n]+/)) { const t = norm(r); if (t.split(' ').length >= 8) out.add(t); }
  }
  return out;
}
const mine = sents(target);
if (!mine?.size) { console.error('⚠️ صفر جملة في الهدف — ابنِ الموقع أولاً'); process.exit(2); }
console.log('جمل الهدف:', mine.size);
let hits = 0, measured = 0;
for (const o of others) {
  const t = sents(o); if (!t) { console.log('— بلا dist (لم يُقس):', o); continue; }
  measured++;
  const sh = [...mine].filter((s) => t.has(s)); hits += sh.length;
  console.log(`${sh.length ? '✗' : '✓'} ${sh.length} مشتركة · ${t.size} جملة · ${o}`);
  sh.slice(0, 5).forEach((s) => console.log('    ' + s.slice(0, 160)));
}
console.log(`مواقع مقيسة: ${measured} من ${others.length} · المجموع المشترك: ${hits}`);
process.exit(hits ? 1 : 0);
