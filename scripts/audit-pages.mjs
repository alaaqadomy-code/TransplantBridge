/**
 * تدقيق بنيوي لكل صفحة في dist: عنصر H1 واحد، canonical، وصف ميتا، أطوال العنوان/الوصف،
 * وصور بـ alt وأبعاد. يكمّل check-links (الروابط) و check-template-leftovers (بقايا القالب).
 * الاستخدام: node scripts/audit-pages.mjs
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

/** ملفّات تحقّق ملكية النطاق — أسماء عشوائية لا تُفهرَس ولا يصلها زائر. */
const VERIFY_FILE = /^(google[0-9a-f]{10,}|BingSiteAuth|[0-9a-f]{24,})\.html$/i;


/**
 * اللغة والاتجاه يُقرآن من إعداد الموقع لا يُفترضان.
 *
 * كان الفاحص يثبّت `ar`/`rtl`، فكل صفحة في موقع إنجليزي تسقط بخطأين — عدّاد
 * بالمئات لا يقرؤه أحد، وتضيع فيه الأعطال الحقيقية المُبلَّغ عنها في السطور نفسها.
 * ورسوب 100% علامة على عطب في الفاحص لا في الموقع.
 */
const SITE_SRC = (() => {
  try {
    return readFileSync('src/config/site.ts', 'utf8');
  } catch {
    return '';
  }
})();
const WANT_LANG = (SITE_SRC.match(/^\s*locale:\s*'([a-z]{2})'/m) || [, 'ar'])[1];
const WANT_DIR = (SITE_SRC.match(/^\s*dir:\s*'(rtl|ltr)'/m) || [, 'ar' === WANT_LANG ? 'rtl' : 'ltr'])[1];
/**
 * لغات الموقع، إن أعلن أكثر من واحدة: `locales: ['en', 'ar']`.
 * الأولى في الجذر، وكلّ لغة بعدها تحت بادئة باسمها.
 */
// يُقبل الشكلان: `locales: [...]` و`export const LOCALES[: Type] = [...]`.
// تقييدُ الشكل الأوّل وحده يُفرغ القائمة في مستودعات سليمة فيُرسب فرعُ لغةٍ كامل.
const LOCALES = ((SITE_SRC.match(/^\s*locales:\s*\[([^\]]*)\]/m)
  ?? SITE_SRC.match(/^\s*(?:export\s+)?const\s+LOCALES\b[^=]*=\s*\[([^\]]*)\]/m))?.[1] ?? '')
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
function pageLocale(rel) {
  if (LOCALES.length < 2) return WANT_LANG;
  const first = String(rel ?? '').replace(/^\/+/, '').split('/')[0];
  return LOCALES.includes(first) ? first : LOCALES[0];
}


const issues = [];
let pages = 0;
// لكشف التكرار عبر الصفحات (عنوان/وصف مكرّران = تنافس داخلي وإشارة ضعف لجوجل)
const titleMap = new Map();
const descMap = new Map();

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    // نفحص كل ملفات HTML لا index.html فقط — وإلا يفلت 404.html وأي صفحة مسطّحة.
    // ملفّات تحقّق ملكية النطاق ليست صفحات: سطر واحد تطلبه جوجل، لا تُفهرَس ولا
    // يصلها زائر. فحصها يُنتج ثمانية أخطاء لا تُصلَح وتُشوّش قائمةً يُفترض أن تُقرأ.
    else if (name.endsWith('.html') && !VERIFY_FILE.test(name)) check(p);
  }
}

function check(p) {
  pages++;
  const html = readFileSync(p, 'utf8');
  // اسم الصفحة: مجلّدها، أو اسم الملف للصفحات المسطّحة مثل 404.html
  // (بدونه تظهر 404.html باسم «/» فيُظنّ العطل في الرئيسية).
  const parts = p.split(sep).slice(1);
  const rel =
    parts[parts.length - 1] === 'index.html'
      ? '/' + parts.slice(0, -1).join('/')
      : '/' + parts.join('/');
  const add = (m) => issues.push(`${rel || '/'} :: ${m}`);

  // صفحات noindex (مثل 404) لا تظهر في نتائج البحث، فقياس طول وصفها بلا معنى.
  const noindex = /name="robots"[^>]*content="[^"]*noindex/.test(html);

  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) add(`عدد عناصر H1 = ${h1} (المطلوب 1)`);

  // noindex: قلنا لجوجل ألّا يفهرسها، فلا معنى لإخباره أيّ نسخة يفهرس.
  if (!noindex && !/rel="canonical"/.test(html)) add('لا يوجد canonical');

  const desc = (html.match(/name="description"\s+content="([^"]*)"/) || [])[1];
  if (!noindex && !desc) add('لا يوجد وصف ميتا');
  else if (!noindex && desc.length > 165) add(`وصف ميتا طويل (${desc.length} حرفًا)`);
  else if (!noindex && desc.length < 70) add(`وصف ميتا قصير (${desc.length} حرفًا)`);

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  // 80 لا 70: العربية أكثف حرفيًا من اللاتينية، وجوجل يقتطع بعرض البكسل لا بعدد الأحرف.
  // والكلمة المفتاحية في مقدّمة العنوان دائمًا، فالمقتطَع هو الذيل الأقلّ أهمية.
  if (!noindex && title.length > 80) add(`عنوان طويل (${title.length} حرفًا)`);

  // تكرار العنوان/الوصف بين الصفحات
  if (title && !noindex) { if (!titleMap.has(title)) titleMap.set(title, []); titleMap.get(title).push(rel || '/'); }
  if (desc) { if (!descMap.has(desc)) descMap.set(desc, []); descMap.get(desc).push(rel || '/'); }

  // لغة الصفحة واتجاهها — خطأ هنا يربك جوجل وقارئات الشاشة.
  // وفي موقع بلغتين تُشتقّ اللغة من بادئة المسار: الأولى في الجذر وما بعدها تحت
  // بادئتها. وطلبُ لغةٍ واحدة من الموقع كلّه يُرسب فرعًا سليمًا بأكمله.
  const wantLang = pageLocale(rel);
  const wantDir = ['ar', 'he', 'fa', 'ur'].includes(wantLang) ? 'rtl' : 'ltr';
  if (!new RegExp(`<html[^>]+lang="${wantLang}"`).test(html)) add(`lang ليس ${wantLang}`);
  if (!new RegExp(`<html[^>]+dir="${wantDir}"`).test(html)) add(`dir ليس ${wantDir}`);

  // صورة المشاركة (تظهر عند مشاركة الرابط على واتساب/تويتر)
  if (!/property="og:image"/.test(html)) add('لا يوجد og:image');

  // صحّة كل كتلة JSON-LD — كتلة معطوبة تُسقط السكيما كلها بصمت
  for (const block of html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []) {
    const json = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    try { JSON.parse(json); } catch (e) { add(`JSON-LD غير صالح — ${e.message.slice(0, 50)}`); }
  }
  // TransplantBridge: صفحة noindex (404) ليست سطحاً للبحث، فلا تُطلب منها سكيما
  if (!noindex && !/application\/ld\+json/.test(html)) add('لا توجد سكيما JSON-LD');

  for (const img of html.match(/<img[^>]*>/g) || []) {
    if (!/\salt=/.test(img)) add('صورة بلا alt');
    if (!/\swidth=/.test(img) || !/\sheight=/.test(img)) add('صورة بلا width/height');
    if (!/\sloading=/.test(img)) add('صورة بلا loading');
  }

  // عناوين فارغة أو روابط بلا نصّ يمكن الوصول إليه
  const emptyLinks = (html.match(/<a[^>]*>\s*<\/a>/g) || []).length;
  if (emptyLinks) add(`${emptyLinks} رابط بلا نصّ`);
}

walk('dist');

for (const [t, urls] of titleMap)
  if (urls.length > 1) issues.push(`${urls[0]} :: عنوان مكرّر في ${urls.length} صفحات ("${t.slice(0, 45)}…") → ${urls.join(', ')}`);
for (const [, urls] of descMap)
  if (urls.length > 1) issues.push(`${urls[0]} :: وصف ميتا مكرّر في ${urls.length} صفحات → ${urls.join(', ')}`);

console.log(`صفحات مفحوصة: ${pages}`);
if (!issues.length) {
  console.log('✓ لا مشاكل بنيوية');
  process.exit(0);
}
const grouped = {};
for (const i of issues) {
  const kind = i.split(' :: ')[1].replace(/\(\d+[^)]*\)/, '(…)');
  grouped[kind] = (grouped[kind] || 0) + 1;
}
console.log(`\nمشاكل (${issues.length}) مجمّعة:`);
for (const [k, v] of Object.entries(grouped).sort((a, b) => b[1] - a[1])) console.log(`  ${v}×  ${k}`);
console.log('\nأمثلة:');
issues.slice(0, 12).forEach((i) => console.log('  ' + i));
process.exit(1);
