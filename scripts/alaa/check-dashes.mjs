/**
 * الشرطات الطويلة (— و–) في نص <main> لصفحات المحتوى (استشاري، لا يدخل البوابة).
 * قاعدة علاء العامة ومهارة humanizer §8: لا شرطة طويلة في النص الموجّه للقارئ؛ تُستبدل بفاصلة أو نقطة أو نقطتين.
 * يُستثنى النطاق الرقمي بلا مسافات (2.5–3.5). أُضيف 24 نوفمبر 2026.
 */
import { pages, main, text, isContent, requireChecked } from './_dist.mjs';

/** عدد الشرطات المخالفة في نص: الشرطة بين رقمين متلاصقين نطاق رقمي لا مخالفة. */
export const countDashes = (t) => [...t.matchAll(/[—–]/g)].filter((m) => !(/\d/.test(t[m.index - 1] ?? '') && /\d/.test(t[m.index + 1] ?? ''))).length;

if (process.argv.includes('--selftest')) {
  const T = [['شرطة في جملة', countDashes('هذا — ذاك'), 1], ['نطاق رقمي', countDashes('من 2.5–3.5 سنة'), 0], ['نطاق بمسافات', countDashes('2 – 3'), 1], ['الاثنتان', countDashes('أ – ب و5–6'), 1]];
  const bad = T.filter(([, g, w]) => g !== w); T.forEach(([n, g, w]) => console.log(`${g === w ? '✓' : '✗'} ${n}`)); process.exit(bad.length ? 1 : 0);
}

const found = []; let checked = 0, total = 0;
for (const { url, html, noindex } of pages()) {
  if (noindex || !isContent(url)) continue;
  checked++;
  const n = countDashes(text(main(html).replace(/&mdash;|&ndash;/g, (e) => (e === '&mdash;' ? '—' : '–'))));
  if (n) { found.push([url, n]); total += n; }
}
console.log(`صفحات محتوى مفحوصة: ${checked}`); requireChecked(checked);
found.sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([u, n]) => console.log(`  ${n}× ${u}`));
console.log(total ? `✗ ${total} شرطة طويلة في ${found.length} صفحة (استشاري)` : '✓ لا شرطات طويلة في نص صفحات المحتوى');
process.exit(total ? 1 : 0);
