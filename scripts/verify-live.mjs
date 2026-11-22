/**
 * verify-live — التحقّق النهائي من الموقع **بعد** النشر وربط الدومين (يعمل على الموقع الحيّ لا على dist).
 *
 * لماذا منفصل عن بوابة ما قبل النشر: أشياء كثيرة تنجح محليًا وتفشل أونلاين —
 * الدومين لم يُفعَّل، شهادة SSL لم تصدر، www لا يعمل، `_headers` لم تُطبَّق،
 * `site.ts.url` يخالف الدومين الفعلي فيخرج canonical خاطئًا لكل الصفحات،
 * صفحة 404 تُرجع 200 (فتفهرسها جوجل)، أو صورة OG غير موجودة فتظهر المشاركات بلا صورة.
 * لا يمسك أيًّا من ذلك أي فحص محلّي.
 *
 * الاستخدام:
 *   node scripts/verify-live.mjs                 # يقرأ الدومين من src/config/site.ts
 *   node scripts/verify-live.mjs --url=https://example.com
 *   node scripts/verify-live.mjs --max=0         # افحص كل روابط خريطة الموقع (0 = بلا حدّ)
 */
import { readFileSync, existsSync } from 'node:fs';
import { siteUrl } from './_site-url.mjs';

const arg = (n, d = null) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};

// --- الدومين ---
let BASE = arg('url');
if (!BASE) {
  BASE = siteUrl(); // TransplantBridge: من .env أو .claude/site.json
}
BASE = BASE.replace(/\/+$/, '');
const HOST = new URL(BASE).host;
const APEX = HOST.replace(/^www\./, '');
const MAX_PAGES = Number(arg('max', '40'));

const errors = [];
const warns = [];
const ok = [];
const TIMEOUT = 25000;

/**
 * كل طلب يُعاد ثلاث مرات بتباطؤ تصاعدي.
 * ⚠️ درس مكلف: بلا إعادة محاولة كان السكربت يعلن «الموقع غير متاح» على موقع يعمل تمامًا
 * بمجرّد تعثّر شبكة عابر أو حدّ معدّل من Cloudflare بعد عشرات الطلبات المتتالية —
 * إنذار كاذب يرسل صاحب الموقع يطارد عطلًا في DNS غير موجود.
 */
async function fetchRetry(url, { redirect = 'follow', tries = 3 } = {}) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fetch(url, {
        redirect,
        headers: { 'User-Agent': 'verify-live/1.0 (+site audit)' },
        signal: AbortSignal.timeout(TIMEOUT),
      });
    } catch (e) {
      last = e;
      if (i < tries) await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw last;
}
const req = (url) => fetchRetry(url, { redirect: 'manual' });
const get = (url) => fetchRetry(url, { redirect: 'follow' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pass = (m) => ok.push(m);
const fail = (m) => errors.push(m);
const warn = (m) => warns.push(m);

console.log(`فحص الموقع الحيّ: ${BASE}\n`);

// ── 1) الصفحة الرئيسية عبر HTTPS ──────────────────────────────────────────
let homeHtml = '';
try {
  const r = await get(BASE + '/');
  if (r.status !== 200) fail(`الرئيسية ترجع ${r.status} (المتوقّع 200)`);
  else {
    homeHtml = await r.text();
    pass(`الرئيسية 200 عبر HTTPS (${Math.round(homeHtml.length / 1024)}KB)`);
  }
} catch (e) {
  fail(`تعذّر الوصول إلى الرئيسية — ${e.name}: ${e.message.slice(0, 80)}. تحقّق من DNS/SSL/تفعيل الدومين.`);
}
if (!homeHtml) {
  console.log('✗ الموقع غير متاح — أوقفت بقيّة الفحوص.');
  console.log(errors.map((e) => '  • ' + e).join('\n'));
  process.exit(1);
}

// ── 2) HTTP يحوّل إلى HTTPS ───────────────────────────────────────────────
try {
  const r = await req(`http://${APEX}/`);
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get('location') ?? '';
    if (loc.startsWith('https://')) pass(`HTTP يحوّل إلى HTTPS (${r.status})`);
    else warn(`HTTP يحوّل إلى وجهة غير https: ${loc}`);
  } else warn(`HTTP لا يحوّل إلى HTTPS (رجع ${r.status}) — أضف قاعدة تحويل في Cloudflare.`);
} catch { warn('تعذّر فحص تحويل HTTP→HTTPS.'); }

// ── 3) www مقابل الجذر ────────────────────────────────────────────────────
try {
  const r = await get(`https://www.${APEX}/`);
  if (r.status === 200) pass('www يعمل (200)');
  else warn(`www يرجع ${r.status} — أضفه كـ Custom domain في Cloudflare Pages إن أردته يعمل.`);
} catch { warn('www غير متاح — اختياري، لكن الزوّار قد يكتبونه.'); }

// ── 4) canonical يطابق الدومين الحيّ ──────────────────────────────────────
const canon = homeHtml.match(/rel="canonical"\s+href="([^"]+)"/)?.[1];
if (!canon) fail('الرئيسية بلا canonical');
else if (new URL(canon).host !== HOST)
  fail(`canonical يشير إلى ${new URL(canon).host} بينما الموقع على ${HOST} — صحّح SITE.url في site.ts وأعد النشر.`);
else pass(`canonical صحيح (${canon})`);

// ── 5) صفحة 404 ترجع 404 فعلًا ────────────────────────────────────────────
try {
  const r = await req(`${BASE}/__لا-توجد-هذه-الصفحة-إطلاقًا__/`);
  if (r.status === 404) pass('صفحة غير موجودة ترجع 404 صحيحة');
  else fail(`صفحة غير موجودة ترجع ${r.status} بدل 404 — جوجل ستفهرس صفحات وهمية (soft 404).`);
} catch { warn('تعذّر فحص حالة 404.'); }

// ── 6) robots.txt ─────────────────────────────────────────────────────────
try {
  const r = await get(`${BASE}/robots.txt`);
  if (r.status !== 200) fail(`robots.txt يرجع ${r.status}`);
  else {
    const t = await r.text();
    const sm = t.match(/Sitemap:\s*(\S+)/i)?.[1];
    if (!sm) fail('robots.txt بلا سطر Sitemap');
    else if (!sm.includes(APEX)) fail(`robots.txt يشير إلى خريطة على دومين آخر: ${sm}`);
    else pass(`robots.txt سليم ويشير إلى ${sm}`);
    if (/Disallow:\s*\/\s*$/m.test(t)) fail('⚠️ robots.txt يمنع الزحف للموقع كله (Disallow: /)');
  }
} catch { fail('تعذّر جلب robots.txt'); }

// ── 7) خريطة الموقع + فحص كل روابطها ──────────────────────────────────────
let urls = [];
try {
  const r = await get(`${BASE}/sitemap-index.xml`);
  if (r.status !== 200) fail(`sitemap-index.xml يرجع ${r.status}`);
  else {
    const idx = await r.text();
    const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (!maps.length) fail('sitemap-index.xml لا يحوي أي خريطة');
    for (const m of maps) {
      const rr = await get(m);
      if (rr.status !== 200) { fail(`خريطة فرعية ${m} ترجع ${rr.status}`); continue; }
      urls.push(...[...(await rr.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]));
    }
    pass(`خريطة الموقع سليمة — ${urls.length} رابطًا`);
  }
} catch { fail('تعذّر جلب خريطة الموقع'); }

// ── 8) /sitemap.xml يعمل (قاعدة _redirects) ───────────────────────────────
try {
  const r = await get(`${BASE}/sitemap.xml`);
  if (r.status === 200) pass('/sitemap.xml يعمل (تحويل _redirects مطبَّق)');
  else warn(`/sitemap.xml يرجع ${r.status} — تحقّق من public/_redirects`);
} catch { warn('تعذّر فحص /sitemap.xml'); }

// ── 9) كل صفحات الخريطة ترجع 200 ──────────────────────────────────────────
if (urls.length) {
  const list = MAX_PAGES > 0 ? urls.slice(0, MAX_PAGES) : urls;
  if (list.length < urls.length)
    console.log(`  (أفحص ${list.length} من ${urls.length} — استخدم --max=0 لفحصها كلها)`);
  let bad = 0;
  for (const u of list) {
    await sleep(150); // تسلسلي ومتباطئ عمدًا — التوازي الكثيف يستدعي حدّ المعدّل فيعطي 404/429 كاذبة
    try {
      const r = await req(u);
      // 3xx على رابط داخل الخريطة خطأ: الخريطة يجب أن تحوي الوجهة النهائية فقط
      if (r.status !== 200) { fail(`صفحة في الخريطة ترجع ${r.status} → ${u}`); bad++; }
    } catch (e) { fail(`تعذّر الوصول إلى ${u} (${e.name})`); bad++; }
  }
  if (!bad) pass(`كل صفحات الخريطة المفحوصة (${list.length}) ترجع 200`);
}

// ── 10) الأصول الحرجة ─────────────────────────────────────────────────────
// TransplantBridge: لا global.css؛ Astro يبني CSS باسم فيه بصمة المحتوى (/_astro/*.css) فلا يحتاج ?v=
const cssHref = homeHtml.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+\.css[^"]*)"/)?.[1];
if (!cssHref) fail('لم أجد رابط stylesheet في الرئيسية');
else {
  try {
    const r = await get(new URL(cssHref, BASE).href);
    if (r.status !== 200) fail(`global.css يرجع ${r.status}`);
    else {
      pass(`global.css 200 (${cssHref.split('?')[1] ?? 'بلا نسخة'})`);
      const cc = r.headers.get('cache-control') ?? '';
      if (!/immutable|max-age=\d{5,}/.test(cc)) warn(`كاش global.css ضعيف: "${cc}"`);
    }
  } catch { fail('تعذّر جلب global.css'); }
}

const og = homeHtml.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
if (!og) fail('الرئيسية بلا og:image');
else {
  try {
    const r = await get(new URL(og, BASE).href);
    if (r.status !== 200) fail(`صورة OG ترجع ${r.status} → ${og} (المشاركات ستظهر بلا صورة)`);
    else pass('صورة OG متاحة (200)');
  } catch { fail(`تعذّر جلب صورة OG → ${og}`); }
}

for (const a of ['/favicon.svg', '/og.png', '/llms.txt']) { // TransplantBridge: أصول هذا الموقع لا أصول القالب
  await sleep(250); // تباطؤ بسيط: الطلبات المتلاحقة تستدعي حدّ المعدّل فتعطي فشلًا كاذبًا
  try {
    const r = await get(BASE + a);
    if (r.status !== 200) warn(`${a} يرجع ${r.status}`);
  } catch { warn(`تعذّر جلب ${a} — قد يكون حدّ معدّل عابرًا، تحقّق يدويًا قبل اعتباره عطلًا.`); }
}

// ── 11) ترويسات الأمان (من public/_headers) ───────────────────────────────
try {
  const r = await get(BASE + '/');
  const need = ['x-frame-options', 'x-content-type-options', 'referrer-policy', 'strict-transport-security'];
  const missing = need.filter((h) => !r.headers.get(h));
  if (missing.length) warn(`ترويسات أمان غائبة: ${missing.join(', ')} — تحقّق أن public/_headers نُشر.`);
  else pass('ترويسات الأمان مطبَّقة');
} catch { warn('تعذّر فحص الترويسات.'); }

// ── 12) بقايا القالب في الناتج الحيّ ──────────────────────────────────────
// تمييز ضروري: «خبير سيو» و«تحسين محركات البحث» بقايا **فقط** إن لم تكن من هوية العميل نفسه.
// موقع شركة سيو حقيقية سيذكرهما بحقّ — إسقاط النشر بسببهما إنذار كاذب يُهدر الوقت.
const brandName = 'TransplantBridge';
// قيَم نموذجية لا يمكن أن تكون مشروعة في أي موقع → خطأ يوقف النشر
const PLACEHOLDERS = ['BRAND_NAME', 'example.com', '[املأ]', 'FORM_ENDPOINT_REQUIRED', 'lorem ipsum', 'og-cover.jpg'];
// نصوص الموقع المرجعي → خطأ إلا إن كانت جزءًا من اسم البراند الفعلي
const REFERENCE_TEXT = ['خبير سيو', 'تحسين محركات البحث', 'مدوّنة السيو'];

const hardFound = PLACEHOLDERS.filter((s) => homeHtml.includes(s));
const refFound = REFERENCE_TEXT.filter((s) => homeHtml.includes(s) && !brandName.includes(s));

// القيَم النموذجية خطأ قاطع — لا تكون مشروعة في أي موقع.
if (hardFound.length) fail(`قيَم نموذجية ظاهرة على الموقع الحيّ: ${hardFound.join(' / ')}`);
// نصوص الموقع المرجعي **تنبيه** لا خطأ: تحتاج حكمًا بشريًا — «تحسين محركات البحث» مشروعة
// تمامًا لموقع شركة سيو، وإسقاط النشر بسببها إنذار كاذب. الفاحص المحلّي
// check-template-leftovers هو صاحب الاختصاص في الحسم قبل النشر.
if (refFound.length)
  warn(`نصوص الموقع المرجعي ظاهرة على الرئيسية الحيّة: ${refFound.join(' / ')}` +
       (brandName ? ` — راجعها يدويًا (اسم البراند: «${brandName}»)` : ''));
if (!hardFound.length && !refFound.length) pass('لا بقايا قالب في الرئيسية الحيّة');

// ── 13) صحّة السكيما على الصفحة الحيّة ────────────────────────────────────
const blocks = homeHtml.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) ?? [];
if (!blocks.length) fail('الرئيسية الحيّة بلا JSON-LD');
else {
  let bad = 0;
  for (const b of blocks) {
    try { JSON.parse(b.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')); } catch { bad++; }
  }
  if (bad) fail(`${bad} كتلة JSON-LD غير صالحة على الموقع الحيّ`);
  else pass(`${blocks.length} كتل JSON-LD صالحة`);
}

// ── التقرير ───────────────────────────────────────────────────────────────
console.log(`\n✓ ناجح (${ok.length}):`);
ok.forEach((m) => console.log('  • ' + m));
if (warns.length) {
  console.log(`\n⚠ تنبيهات (${warns.length}):`);
  warns.forEach((m) => console.log('  • ' + m));
}
console.log(`\n${errors.length ? '✗' : '✓'} أخطاء (${errors.length}):`);
errors.forEach((m) => console.log('  • ' + m));
if (!errors.length) console.log('  لا أخطاء — الموقع الحيّ سليم.');
process.exitCode = errors.length ? 1 : 0;
