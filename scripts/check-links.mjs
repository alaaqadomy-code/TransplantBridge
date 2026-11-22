/**
 * فاحص الروابط الداخلية — يفحص كل ملفات dist/ ويتأكّد أن كل رابط/مورد داخلي له وجهة موجودة فعلًا.
 * يفحص أيضًا الروابط الواردة في Markdown المصدر (قبل البناء) لالتقاط slugs غير موجودة.
 * الاستخدام: node scripts/check-links.mjs   (بعد npm run build)
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

if (!existsSync('dist')) {
  console.error('✗ مجلد dist غير موجود — شغّل npm run build أولًا.');
  process.exit(1);
}

// 1) اجمع كل الملفات الموجودة فعلًا في dist
const files = new Set();
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else files.add(p.replace(/\\/g, '/').replace(/^dist/, ''));
  }
})('dist');

function targetExists(href) {
  const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
  if (clean === '/') return files.has('/index.html');
  if (files.has(clean)) return true;
  if (files.has(clean + '.html')) return true; // TransplantBridge: build.format "file"
  if (files.has(clean.replace(/\/$/, '') + '/index.html')) return true;
  return false;
}

// 2) افحص كل صفحة HTML
const htmls = [...files].filter((f) => f.endsWith('.html'));
const broken = new Map(); // href → مجموعة الصفحات التي تحتويه
const externals = new Set();      // النطاقات فقط (للتقرير)
const externalUrls = new Map();   // الرابط الكامل → مجموعة الصفحات (لفحص --external)
let internalCount = 0;

for (const f of htmls) {
  const html = readFileSync('dist' + f, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const h = m[1];
    if (/^(mailto:|tel:|data:|#)/.test(h)) continue;
    if (/^https?:/.test(h)) {
      externals.add(h.split('/').slice(0, 3).join('/'));
      const clean = h.split('#')[0];
      if (!externalUrls.has(clean)) externalUrls.set(clean, new Set());
      externalUrls.get(clean).add(f);
      continue;
    }
    if (!h.startsWith('/')) continue;
    internalCount++;
    if (!targetExists(h)) {
      if (!broken.has(h)) broken.set(h, new Set());
      broken.get(h).add(f);
    }
  }
}

// 3) افحص حقول related في frontmatter المقالات (slugs يجب أن تكون موجودة)
const ART = 'src/content/articles';
// المعرّف المقبول في `related`: اسم الملفّ **أو** حقل slug في الواجهة الأمامية.
// في المواقع التي أسماء ملفّاتها لاتينية ومساراتها المنشورة عربية، `related`
// تشير إلى المسار المنشور — وقراءة اسم الملفّ وحده ترفض ارتباطًا صحيحًا.
const slugs = new Set();
if (existsSync(ART))
  for (const f of readdirSync(ART).filter((n) => n.endsWith('.md'))) {
    slugs.add(f.replace(/\.md$/, ''));
    const head = readFileSync(join(ART, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fmSlug = head && head[1].match(/^slug:\s*["\x27]?([^"\x27\r\n]+)["\x27]?\s*$/m);
    if (fmSlug) slugs.add(fmSlug[1].trim());
  }
const badRelated = [];
for (const f of existsSync(ART) ? readdirSync(ART).filter((f) => f.endsWith('.md')) : []) {
  const raw = readFileSync(join(ART, f), 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const rel = fm[1].match(/^related:\r?\n((?:\s+-\s+.*\r?\n?)+)/m);
  if (!rel) continue;
  for (const line of rel[1].split('\n')) {
    const s = line.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, '');
    if (s && !slugs.has(s)) badRelated.push(`${f} → related: ${s}`);
  }
}

// 4) التقرير
console.log('صفحات HTML مفحوصة:', htmls.length);
console.log('روابط وموارد داخلية مفحوصة:', internalCount);
console.log('مقالات:', slugs.size);
console.log('');

if (broken.size) {
  console.log(`✗ روابط داخلية مكسورة (${broken.size}):`);
  for (const [href, pages] of broken) {
    console.log(`  ${decodeURIComponent(href)}`);
    console.log(`      في: ${[...pages].slice(0, 4).map(decodeURIComponent).join(' ، ')}${pages.size > 4 ? ` … (+${pages.size - 4})` : ''}`);
  }
} else {
  console.log('✓ لا رابط داخلي مكسور');
}
console.log('');

if (badRelated.length) {
  console.log(`✗ قيَم related تشير إلى مقالات غير موجودة (${badRelated.length}):`);
  badRelated.forEach((b) => console.log('  ' + b));
} else {
  console.log('✓ كل قيَم related تشير إلى مقالات موجودة');
}
console.log('');
console.log('نطاقات خارجية مُشار إليها:', [...externals].sort().join('  |  '));

// 5) (اختياري) فحص حالة الروابط الخارجية: node scripts/check-links.mjs --external
//
// لا يُشغَّل افتراضيًا لأنه يعتمد على الشبكة وبطيء. ولا يُخرج برمز 1 أبدًا:
// نتيجته إرشادية لا حاكمة — المواقع الكبيرة (Upwork، GoDaddy، LinkedIn) تردّ 403 للبوتات
// وهي تعمل للبشر تمامًا، فإسقاط النشر بسببها خطأ.
let externalDead = 0;
if (process.argv.includes('--external')) {
  const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36' };
  const urls = [...externalUrls.keys()];
  console.log(`\nفحص ${urls.length} رابطًا خارجيًا…`);

  async function probe(u) {
    for (const method of ['HEAD', 'GET']) {
      try {
        const r = await fetch(u, { method, headers: UA, redirect: 'follow', signal: AbortSignal.timeout(20000) });
        if (r.ok || method === 'GET') return r.status;
      } catch { if (method === 'GET') return 'تعذّر الاتصال'; }
    }
    return '?';
  }

  // تسلسلي بتزامن منخفض: الطلبات المتوازية الكثيفة تستدعي حدّ المعدّل فيعود 404/429
  // عن روابط سليمة تمامًا — إيجابية كاذبة تُهدر وقتًا في مطاردة عطل غير موجود.
  const results = [];
  for (const u of urls) {
    let st = await probe(u);
    if (st !== 200) st = await probe(u); // إعادة محاولة واحدة قبل الحكم
    results.push([u, st]);
  }

  // 400 مضاف عمدًا: نطاقات ميتا (help.instagram.com, business.facebook.com,
  // transparency.meta.com, www.facebook.com) تردّ 400 على أي طلب آلي — حتى بترويسة متصفّح
  // كاملة — بينما تفتح للبشر تمامًا (تحقّقنا بمتصفّح فعلي). اعتبارها «مكسورة» أنتج 4 إنذارات
  // كاذبة أحدها على رابط في 39 صفحة. الحجب لا يعني الكسر.
  const BOT_BLOCK = [400, 403, 405, 429];
  const blocked = results.filter(([, s]) => BOT_BLOCK.includes(s));
  const dead = results.filter(([, s]) => s !== 200 && !BOT_BLOCK.includes(s));
  externalDead = dead.length;

  console.log(`  ✓ سليمة (200): ${results.filter(([, s]) => s === 200).length}/${results.length}`);
  if (blocked.length) {
    console.log(`  ⓘ تحجب البوتات (تعمل للبشر — ليست مكسورة): ${blocked.length}`);
    blocked.forEach(([u, s]) => console.log(`      ${s}  ${u}`));
  }
  if (dead.length) {
    console.log(`  ✗ يُرجَّح أنها مكسورة — تحقّق يدويًا قبل النشر: ${dead.length}`);
    dead.forEach(([u, s]) => console.log(`      ${s}  ${u}   ← ${externalUrls.get(u).size} صفحة`));
  }
}

process.exit(broken.size || badRelated.length ? 1 : 0);
