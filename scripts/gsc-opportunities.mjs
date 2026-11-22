/**
 * حلقة التحسين الأسبوعية من Search Console — أسرع طريق للصفحة الأولى (لا النشر العشوائي).
 *
 * المدخل (مجاني، أحدهما):
 *   • تصدير CSV: Search Console → الأداء → آخر 28 يومًا → تصدير → CSV، فكّ الضغط وخذ Queries.csv
 *     (الأعمدة: الاستعلام/Query، النقرات، مرات الظهور، نسبة النقر، الترتيب/Position)
 *   • أو JSON من موصّل gsc (get_search_analytics بالبُعد query): [{ keys:[q], clicks, impressions, ctr, position }]
 *
 *   node scripts/gsc-opportunities.mjs content-plan/gsc/Queries.csv [--min-impr=20]
 *
 * لكل استعلام يحدد المقال المالك (أقرب تطابق مع keywords/title في الـfrontmatter) ويقترح:
 *   🎯 قريب من الأولى (ترتيب 4–20): قوِّ المالك — قسم/سؤال شائع يحمل الاستعلام حرفيًا، روابط داخلية إليه.
 *   ✏️ ظهور عالٍ ونقر ضعيف (ترتيب ≤ 5، CTR منخفض): أعد كتابة العنوان والوصف.
 *   🆕 بلا مالك وبظهور كافٍ: مرشّح صفحة جديدة — افحص SERP أولًا (نيّة مختلفة فعلًا؟).
 * المخرج: content-plan/gsc-opportunities.md
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const file = process.argv[2];
const MIN = Number((process.argv.find((a) => a.startsWith('--min-impr=')) || '=20').split('=')[1]);
if (!file || !existsSync(file)) { console.error('الاستخدام: node scripts/gsc-opportunities.mjs <Queries.csv|gsc.json>'); process.exit(1); }

const num = (v) => Number(String(v ?? '').replace('%', '').replace(/,/g, '.').replace(/[^\d.]/g, '')) || 0;
let rows = [];
const raw = readFileSync(file, 'utf8').replace(/^﻿/, '');
if (file.endsWith('.json')) {
  const j = JSON.parse(raw); const arr = Array.isArray(j) ? j : j.rows || [];
  rows = arr.map((r) => ({ q: r.keys?.[0] ?? r.query, clicks: r.clicks, impr: r.impressions, ctr: r.ctr <= 1 ? r.ctr * 100 : r.ctr, pos: r.position }));
} else {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const parse = (l) => (l.match(/("([^"]|"")*"|[^,]+|(?<=,)(?=,))/g) || []).map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
  for (const l of lines.slice(1)) { const [q, clicks, impr, ctr, pos] = parse(l); rows.push({ q, clicks: num(clicks), impr: num(impr), ctr: num(ctr), pos: num(pos) }); }
}

const norm = (s) => String(s).toLowerCase().normalize('NFC').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ًٌٍَُِّْ؟?!.,«»"']/g, '').replace(/\s+/g, ' ').trim();
const STOP = new Set(['في', 'من', 'على', 'الى', 'إلى', 'مع', 'عن', 'و', 'the', 'in', 'for', 'of', 'a', 'to', 'в', 'на', 'с', 'и']);
const toks = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 1 && !STOP.has(w)));

/**
 * TransplantBridge: الصفحات المالكة من **خريطة الموقع الحية** لا من ملفات .md.
 * عبارات كل صفحة = <title> وH1 الحيّان + كلماتها في KEYWORD_MAP (src/content/keywords.ts).
 * فالقائمة هي ما يراه Google فعلاً، لا ما في المصدر.
 */
import { siteUrl } from './_site-url.mjs';
import { KEYWORD_MAP } from '../src/content/keywords.ts';
const BASE = siteUrl();
const fetchText = async (u) => (await fetch(u, { signal: AbortSignal.timeout(20000) })).text();
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
let pageUrls = locs(await fetchText(`${BASE}/sitemap-index.xml`));
if (pageUrls.every((u) => /sitemap/.test(u))) pageUrls = (await Promise.all(pageUrls.map(fetchText))).flatMap(locs);
if (!pageUrls.length) { console.error('✗ خريطة الموقع الحية فارغة أو لم تُقرأ'); process.exit(1); }
const txt = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const owners = await Promise.all(pageUrls.map(async (u) => {
  const slug = new URL(u).pathname.replace(/^\/|\/$/g, '') || '(الرئيسية)';
  const html = await fetchText(u);
  const phrases = [html.match(/<title>([^<]*)<\/title>/)?.[1], html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]].filter(Boolean).map(txt);
  for (const [kw, s] of KEYWORD_MAP) if (s === slug) phrases.push(kw);
  return { slug, phrases: phrases.map((p) => ({ p, t: toks(p) })) };
}));
console.log(`صفحات من الخريطة الحية: ${owners.length} · عبارات: ${owners.reduce((n, o) => n + o.phrases.length, 0)}`);

function ownerOf(q) {
  const qt = toks(q); let best = null, score = 0;
  for (const o of owners) for (const { t } of o.phrases) {
    const inter = [...qt].filter((x) => t.has(x)).length; const sc = inter / new Set([...qt, ...t]).size;
    if (sc > score) { score = sc; best = o.slug; }
  }
  return score >= 0.5 ? { slug: best, score } : null;
}

const striking = [], ctrFix = [], fresh = [];
for (const r of rows.filter((x) => x.q && x.impr >= MIN)) {
  const o = ownerOf(r.q);
  if (r.pos <= 5 && r.ctr < 3 && r.impr >= MIN * 3) ctrFix.push({ ...r, o });
  else if (r.pos > 3 && r.pos <= 20 && o) striking.push({ ...r, o });
  else if (!o) fresh.push(r);
}
striking.sort((a, b) => b.impr - a.impr); ctrFix.sort((a, b) => b.impr - a.impr); fresh.sort((a, b) => b.impr - a.impr);

const row = (r) => `| ${r.q} | ${r.impr} | ${r.clicks} | ${r.ctr.toFixed(1)}% | ${r.pos.toFixed(1)} | ${r.o ? r.o.slug : '—'} |`;
const head = '| الاستعلام | الظهور | النقرات | CTR | الترتيب | المالك |\n|---|---|---|---|---|---|';
const md = `# فرص Search Console — ${new Date().toISOString().slice(0, 10)}

المصدر: ${file} · ${rows.length} استعلام · حد الظهور الأدنى ${MIN}

## 🎯 قريبة من الصفحة الأولى (ترتيب 4–20) — قوِّ المقال المالك
لكل سطر: أضف للمقال المالك قسمًا أو سؤالًا شائعًا يحمل الاستعلام **بصيغته**، وحدّث updatedDate، وأضف رابطًا داخليًا إليه بنصّ قريب من الاستعلام من مقالين آخرين.

${head}
${striking.slice(0, 40).map(row).join('\n') || '| — |'}

## ✏️ ظهور عالٍ ونقر ضعيف — أعد كتابة العنوان والوصف
${head}
${ctrFix.slice(0, 20).map(row).join('\n') || '| — |'}

## 🆕 استعلامات بلا مقال مالك — مرشّحات صفحات جديدة (افحص SERP قبل الإنشاء)
${head}
${fresh.slice(0, 30).map(row).join('\n') || '| — |'}
`;
mkdirSync('content-plan', { recursive: true });
writeFileSync('content-plan/gsc-opportunities.md', md);
console.log(`✓ content-plan/gsc-opportunities.md — قريبة: ${striking.length} · عنوان/وصف: ${ctrFix.length} · جديدة: ${fresh.length}`);
