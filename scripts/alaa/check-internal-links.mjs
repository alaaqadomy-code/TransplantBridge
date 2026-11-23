/**
 * شبكة الروابط الداخلية من المتن التحريري وحده (لا هيدر/فوتر/nav/صناديق القالب):
 *   • كل مقال ودليل إجراء يتلقى ≥ MIN_INBOUND رابطاً من متن صفحات أخرى (اليتيم = 0).
 *   • الصفحات التجارية (الأفضل الأربع والأسعار) تتلقى ≥ MIN_MONEY.
 *   • لا نص رابط من 4 كلمات فأكثر يهيمن على أكثر من ثلث روابط هدفه (بصمة تحسين مفرط).
 * «المتن» هنا: <article> بعد حذف <aside> و<nav>، ما عدا صندوق «للتوسع في الموضوع» (روابط تحريرية في phase2-links).
 */
import { pages, isContent, requireChecked } from './_dist.mjs';
import { CONFIG } from './_config.mjs';
const MIN_INBOUND = Number(process.env.MIN_INBOUND || 2), MIN_MONEY = CONFIG.minMoney;
const MONEY = CONFIG.moneyPages;
const all = pages(); const urls = new Set(all.map((p) => p.url));
// صناديق الروابط القالبية في الإعداد (linkBoxes): tikorax يضع «من الموضوع نفسه» في <div> لا <aside> فكان يُحسب متناً (24 نوفمبر 2026)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function dropByClass(h, cls) { // العنصر الحامل للصنف حتى إغلاقه المتوازن (div داخل div)
  const re = new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\bclass="(?:[^"]*\\s)?${esc(cls)}(?:\\s[^"]*)?"[^>]*>`, 'i');
  for (let m; (m = h.match(re));) {
    const tag = new RegExp(`<(/?)${m[1]}\\b[^>]*>`, 'gi'); tag.lastIndex = m.index + m[0].length; let depth = 1, end = h.length;
    for (let t; depth && (t = tag.exec(h));) { depth += t[1] ? -1 : 1; if (!depth) end = t.index + t[0].length; }
    h = h.slice(0, m.index) + ' ' + h.slice(end);
  }
  return h;
}
const dropBoxes = (h) => (CONFIG.linkBoxes ?? []).reduce((s, b) => b.startsWith('.') ? dropByClass(s, b.slice(1))
  : s.replace(new RegExp(`<h([2-6])\\b[^>]*>\\s*${esc(b)}\\s*</h\\1>\\s*<(ul|ol)\\b[\\s\\S]*?</\\2>`, 'g'), ' '), h);
const body = (html) => {
  const art = dropBoxes(html.match(/<article[\s\S]*?<\/article>/)?.[0] ?? html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '');
  // فقرة «ضمن قسم … الدليل الشامل» قالبية على كل مقال (كالتنقل)، فلا تدخل في عدّ المراسي
  return art.replace(/<aside(?![^>]*للتوسع)[\s\S]*?<\/aside>/g, ' ').replace(/<nav[\s\S]*?<\/nav>/g, ' ').replace(/<p[^>]*>ضمن قسم[\s\S]*?<\/p>/g, ' ');
};
const inbound = new Map([...urls].map((u) => [u, []]));
for (const p of all) {
  const seen = new Set();
  for (const m of body(p.html).matchAll(/<a\b[^>]*href="([^"#?]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = decodeURIComponent(m[1]); if (!href.startsWith('/') || href === p.url || !inbound.has(href) || seen.has(href)) continue;
    seen.add(href); inbound.get(href).push({ from: p.url, anchor: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
  }
}
const content = all.filter((p) => isContent(p.url) && !p.noindex).map((p) => p.url);
const issues = [];
const weak = content.filter((u) => inbound.get(u).length < MIN_INBOUND);
if (weak.length) issues.push(`صفحات محتوى بأقل من ${MIN_INBOUND} رابط متن وارد (${weak.length}):\n` + weak.map((u) => `    • ${u} (${inbound.get(u).length})`).join('\n'));
for (const m of MONEY) if (inbound.has(m) && inbound.get(m).length < MIN_MONEY) issues.push(`${m} :: ${inbound.get(m).length} رابط متن وارد فقط (الحدّ ${MIN_MONEY})`);
const over = [];
for (const u of content) {
  const c = new Map(); for (const { anchor } of inbound.get(u)) c.set(anchor, (c.get(anchor) ?? 0) + 1);
  const total = inbound.get(u).length, limit = Math.max(4, Math.ceil(total / 3));
  for (const [a, n] of c) if (a.split(/\s+/).length >= 4 && n > limit) over.push(`    • ${u} ← «${a}» ×${n} من ${total} (الحدّ ${limit})`);
}
if (over.length) issues.push(`نص رابط واحد يهيمن على روابط هدفه (${over.length}):\n` + over.join('\n'));
const avg = (content.reduce((s, u) => s + inbound.get(u).length, 0) / content.length).toFixed(1);
console.log(`صفحات محتوى: ${content.length} · وارد من المتن ${avg}/صفحة`); requireChecked(content.length);
for (const m of MONEY) if (inbound.has(m)) console.log(`  ${m}: ${inbound.get(m).length} رابط متن`);
issues.forEach((i) => console.log('  ✗ ' + i));
console.log(issues.length ? `✗ ${issues.length} مشكلة في شبكة الروابط` : '✓ شبكة الروابط الداخلية سليمة');
process.exit(issues.length ? 1 : 0);
