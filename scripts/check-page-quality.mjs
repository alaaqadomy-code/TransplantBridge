/**
 * check-page-quality — يمدّ معايير المقالات إلى **الصفحات**.
 *
 * الثغرة التي أنشأته: `qa-articles` يفرض على كل مقال رابطًا خارجيًا موثوقًا وصورة سليمة
 * السمات، ولا شيء كان يفرضهما على الصفحات. القياس يوم إنشائه: 115/115 مقالًا بالاثنين،
 * مقابل **0/5 صفحات** — بما فيها رئيسية شركة وعدُها الثاني «لازم يبين فخم» وفيها صفر
 * عناصر بصرية. الثغرة بقيت صامتة لأن كل فاحص كان ينظر إلى المقالات وحدها.
 *
 * يعمل fail-closed: كل صفحة محتوى تتجاوز MIN_WORDS تُفحَص، ولا تُعفى إلا بإدراجها في
 * EXEMPT **مع سبب مكتوب**. الاستثناء الصامت هو ما يعيد الثغرة أصلًا.
 *
 * الاستخدام: node scripts/check-page-quality.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { siteUrl } from './_site-url.mjs';
const SITE_URL = siteUrl();

const DIST = 'dist';
const MIN_WORDS = 450;

/**
 * الإعفاء يُكتب بسببه. القاعدة: يُعفى ما **لا ينتمي إليه المعيار**، لا ما يصعب إرضاؤه.
 * إضافة رابط خارجي لا ينتمي إلى موضعه «لإرضاء الفاحص» أسوأ من غيابه.
 */
const EXEMPT = {
  // نصٌّ تعاقديّ يُقرأ عند الحاجة: لا ادّعاء فيه يحتاج مرجعًا، ولا تضيف إليه
  // صورةٌ تسويقية إلّا حشوًا. والمعياران وُضعا لصفحةٍ تنافس في نتائج البحث.
  '/terms/': ['ext', 'img'],
  '/privacy/': ['ext', 'img'],
  '/privacy-policy/': ['ext', 'img'],
  '/disclaimer/': ['ext', 'img'],
  '/editorial-policy/': ['ext', 'img'],
  '/affiliate-disclosure/': ['ext', 'img'],
  '/articles/': ['ext'], // فهرس: نصّه أوصاف 115 مقالًا، ولا ادّعاء فيه يحتاج مرجعًا رسميًا
  '/app-types/': ['ext'], // فهرس أنواع التطبيقات — المرجع ينتمي إلى المقال لا إلى الفهرس
};

if (!existsSync(DIST)) {
  console.log('✗ لا مجلّد dist — شغّل npm run build أوّلًا');
  process.exit(1);
}

function walk(d, a = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    statSync(p).isDirectory() ? walk(p, a) : e.endsWith('.html') && a.push(p);
  }
  return a;
}

const issues = [];
let checked = 0;

for (const f of walk(DIST)) {
  const u = '/' + relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '/');
  if (u.startsWith('/articles/') && u !== '/articles/') continue; // المقالات يحرسها qa-articles

  const html = readFileSync(f, 'utf8');
  // صفحة لا تُفهرَس ليست سطحًا للبحث: معيارا «مرجع خارجي» و«صورة» وُجدا لصفحة تظهر في
  // النتائج، وحشوُهما في صفحة إعداد بعد الشراء محتوًى أسوأ لإرضاء فاحص.
  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) continue;
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [html])[0];
  const words = main
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  if (words < MIN_WORDS) continue;

  checked++;
  const exempt = EXEMPT[u] ?? [];

  // ١) رابط خارجي موثوق واحد على الأقل
  if (!exempt.includes('ext')) {
    const ext = [...main.matchAll(/<a\b[^>]*href="(https?:\/\/[^"]+)"/gi)]
      .map((m) => m[1])
      .filter((h) => {
        // استبعد دومين الموقع نفسه (رابط داخلي مطلق) وواتساب — ليسا مرجعًا خارجيًا.
        // لا تُثبّت دومينًا هنا: سكربت القالب يُنسخ إلى مواقع أخرى، والدومين المثبّت
        // يجعل الفاحص يقيس موقعًا غير الذي يفحصه.
        try {
          return new URL(h).host !== new URL(SITE_URL).host && !/wa\.me/.test(h);
        } catch {
          return false;
        }
      });
    if (!ext.length) issues.push(`${u} :: بلا رابط خارجي موثوق (${words} كلمة)`);
  }

  // ٢) صورة واحدة على الأقل بسمات سليمة
  if (!exempt.includes('img')) {
    /**
     * الصورة الزخرفية المُعلَنة — `alt=""` داخل عنصر `aria-hidden="true"` — ليست
     * صورةً ناقصة السمات بل صورةً أُخفيت عمدًا عن قارئ الشاشة كي لا يتكرّر النطق.
     * تُستبعد من عدّ السمات ولا تُحتسب صورةً ذات معنى، فإن لم يبقَ غيرها قيل
     * «بلا أيّ صورة» وهو الوصف الصادق.
     */
    const decorative = new Set();
    for (const m of main.matchAll(/<a\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/a>/gi))
      // الشرط `alt=""` جزءٌ من التعريف لا زينةٌ فيه: صورةٌ لها نصّ بديل وصفيّ
      // ليست زخرفية ولو كان رابطها مخفيًّا عن قارئ الشاشة لمنع تكرار الوجهة.
      for (const im of m[0].matchAll(/<img\b[^>]*>/gi)) if (/alt=""/.test(im[0])) decorative.add(im[0]);
    const imgs = [...main.matchAll(/<img\b[^>]*>/gi)]
      .map((m) => m[0])
      .filter((t) => !decorative.has(t) && !/aria-hidden="true"/.test(t) && !/alt=""/.test(t));
    if (!imgs.length) {
      issues.push(`${u} :: بلا أي صورة (${words} كلمة)`);
    } else {
      const bad = imgs.filter(
        (t) => !/alt="[^"]{8,}"/.test(t) || !/width=/.test(t) || !/height=/.test(t) || !/loading=/.test(t)
      );
      if (bad.length === imgs.length)
        issues.push(`${u} :: لا صورة بسمات كاملة (alt وصفي + width/height + loading) — ${imgs.length} صورة`);
    }
  }
}

console.log(`صفحات محتوى مفحوصة (>${MIN_WORDS} كلمة): ${checked}`);
for (const [u, why] of Object.entries(EXEMPT)) console.log(`  ⚪ معفاة من ${why.join('+')}: ${u}`);
console.log('');

if (issues.length) {
  console.log(`✗ ثغرات جودة الصفحات (${issues.length}):`);
  for (const i of issues) console.log('  ' + i);
  process.exit(1);
}
console.log('✓ كل صفحة محتوى تحمل رابطًا خارجيًا موثوقًا وصورة سليمة السمات.');
