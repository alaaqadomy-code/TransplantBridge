# برومبت الترحيل المكيّف — TransplantBridge

> تكييف «برومبت ترحيل المواقع القائمة» (`~/.claude/skills/create-seo-site/references/rollout-existing-sites.md`)
> لهذا الموقع. كُتب 22 نوفمبر 2026 بعد **تشغيل فواحص القالب فعلاً على `dist` هذا الموقع** لا بالاستنتاج.
> القاعدة: لا يُعدَّل محتوى أي صفحة ولا قيمة براند (`src/lib/site.ts`، `src/content/*`، نصوص `src/pages/*`).

## لماذا لا يُنسخ البرومبت الأصلي حرفياً

البرومبت الأصلي مكتوب لمواقع **وُلدت من القالب**: يفترض `src/config/site.ts` و`src/content/articles/*.md`
و`public/global.css` بأصناف BEM (`.btn`, `.card`…) ومسار `/articles/`. هذا الموقع بُني يدوياً ولا يحمل شيئاً من ذلك:

| يفترضه القالب | الواقع هنا |
|---|---|
| Astro 5 | **Astro 7** (`fonts` API، `build.format: "file"`) |
| `src/config/site.ts` + `design.ts` | `src/lib/site.ts`، والدومين من `PUBLIC_SITE_URL` في `.env` |
| `src/content/articles/*.md` | صفحات من بيانات TS (`src/content/*.ts`) تُرسم عبر `src/pages/[slug].astro` |
| روابط `/x/` → `x/index.html` | روابط `/x` → **`x.html`** (ملف مسطّح) |
| `public/global.css` بأصناف القالب | **Tailwind 3** + `src/styles/global.css` |
| فواحص بلا مكافئ | للموقع حرّاسه: `index.ts` يُفشل البناء (روابط واردة ≥ 3، كلمات الخريطة، المراسي)، و`scripts/audit.mjs` (الأسعار والنسب بإسناد، طول العنوان والوصف، H1، الروابط، التصاق النص بالرابط) |

**نتيجة التشغيل الفعلي لفواحص القالب كما هي على `dist` (22 نوفمبر):**

| الفاحص | النتيجة | الحكم |
|---|---|---|
| `check-links` | ✗ 32 رابطاً «مكسوراً» | **إنذار كاذب**: لا يعرف `x.html` |
| `check-title-lengths` | ✓ «0 من 1» | **أخضر وهو لم يفحص إلا الرئيسية** (يمشي `index.html` فقط) |
| `check-h1-keyword` | ✓ «مفحوصة: 0» | **أخضر بلا فحص**: يقرأ `<meta keywords>` والموقع لا يستعملها |
| `check-faq-schema` | ✓ «0 مقال» | **أخضر بلا فحص**: يبحث عن `.md` |
| `check-internal-links` | ✗ لا قاعدة مسار | فشل صادق، لكنه يكرر حارس `MIN_INBOUND` في البناء |
| `check-page-quality` | ✗ خطأ: لا `src/config/site.ts` | يحتاج مصدر الدومين |
| `check-claims` | ✗ 4 «أسعار» | الأربعة أسعار منشورة **بإسناد ورصد** في الصفحات الثلاث المسموح لها (قاعدة `audit.mjs`) |
| `audit-pages` | ✓ 34 صفحة، ملاحظة واحدة (404 بلا سكيما) | **يعمل** |
| `check-arabic-typos src` | 🔴 1 | إنذار كاذب: `define:vars={{ GA_ID }}` في `Analytics.astro` ليس نائب قالب |
| `check-layout` | ✗ لا `BaseLayout.astro` | خاص ببنية القالب |
| `verify-live` | 13 ✓، 1 ✗ «لا global.css» | الخطأ كاذب: CSS هنا في `/_astro/*.css` |

## ما يُنقل وكيف

1. **`scripts/_site-url.mjs` جديد خاص بالموقع**: يقرأ الدومين من `PUBLIC_SITE_URL` في `.env` ثم `.claude/site.json` (`live`). كل فاحص منقول يستورده بدل قراءة `src/config/site.ts`.
2. **الفواحص المنقولة مع التعديل الأدنى** (كل واحد يُجرَّب على مخالفة مزروعة قبل اعتماده، ويُقرأ عدّاده):
   - `check-links.mjs`: يحلّ `/x` إلى `x.html`. (يضيف على `audit.mjs` فحص الموارد `src=` لا الروابط فقط.)
   - `audit-pages.mjs`: كما هو تقريباً (H1 واحد، canonical، وصف، تكرار العناوين والأوصاف)، مع مصدر الدومين. 404 مستثناة من شرط السكيما.
   - `check-claims.mjs`: قاعدة «سعر» تُعفى **فقط** في `transplant-cost` و`kidney-transplant-turkey` و`liver-transplant-turkey` وبشرط «رُصد» في الجملة نفسها — نفس قاعدة `audit.mjs`. باقي القواعد (ضمان، الأفضل، ترخيص، 24/7) كما هي: وهي الأهم لموقع YMYL طبي.
   - `check-h1-keyword.mjs`: الكلمة الأساسية لكل صفحة من `KEYWORD_MAP` في `src/content/keywords.ts` (أول كلمة فئة 1 للصفحة) بدل `<meta keywords>`. لا نضيف meta keywords (Google يتجاهلها).
   - `check-faq-schema.mjs`: يُعاد ليقرأ `dist` وحده: كل صفحة فيها قسم أسئلة ظاهر تُصدر `FAQPage` بنفس عدد الأسئلة، ولا `FAQPage` بلا أسئلة ظاهرة.
   - `check-arabic-typos.mjs`: كما هو على `src`، مع استثناء `define:vars={{ … }}`.
   - `check-page-quality.mjs` (رابط خارجي موثوق + صورة بسمات كاملة لكل صفحة محتوى): **يُشغَّل للتقرير فقط ولا يدخل البوابة** إن كان أحمر، لأن إصلاحه إضافة محتوى (صور ومراجع) وهي ممنوعة في هذه الجولة. تُذكر النتيجة لعلاء.
   - `verify-live.mjs`: فحص CSS يقبل أي `<link rel="stylesheet">`، ويُقرأ الدومين من `_site-url.mjs`. تنبيهات `rss.xml` و`site.webmanifest` و`icon-192` تُحذف (ليست من بنية الموقع ولا شرطاً للفهرسة).
3. **سكربتات البحث**: `keyword-research.mjs` و`serp-brief.mjs` تُنسخ كما هي (مستقلة عن البنية، مخرجاتها في `content-plan/`). و`gsc-opportunities.mjs` يُعدَّل: قائمة الصفحات المالكة من **خريطة الموقع الحية** (`/sitemap-index.xml` ← `sitemap-0.xml`)، وعبارات كل صفحة من `<title>` و`H1` الحيين + كلماتها في `KEYWORD_MAP`. **أداة تشخيص لا خطة نشر**: قسم «🆕 مرشّحات صفحات جديدة» يبقى معلّقاً بقاعدة STOP (أدناه).
4. **بوابة `check:all` في `package.json`**: `audit.mjs` (القائم) + الفواحص المنقولة الخضراء. وسكربت `verify:live`. لا تغيير على `build`.

## ما لا يُنقل ولماذا

| من البرومبت الأصلي | القرار | السبب |
|---|---|---|
| نسخ `BaseLayout`، `Header`، `Breadcrumbs`، `[...slug].astro`، `content.config.ts`، `global.css`، `astro.config.mjs`، `robots.txt.ts` | **لا** | تستبدل بنية مختلفة كلياً فتكسر البناء؛ ونسخ `astro.config.mjs` يمحو حرس الدومين وتواريخ `lastmod` الحقيقية والخطوط المحلية. للموقع بديل قائم لكل واحد (`Layout.astro`، `Breadcrumbs.astro`، `robots.txt.ts`…). |
| `design.ts` + بروفايل التصميم + `ns`/`schemaSeed` + `reskin-dist.mjs` | **لا** | الغرض كسر بصمة **أسطول القالب** (أصناف BEM مشتركة بين 60+ موقعاً، وترتيب سكيما متطابق). هذا الموقع لا يحمل صنفاً واحداً من القالب ولا سكيماه؛ بصمته فريدة أصلاً. وreskin على Tailwind **خطِر**: محدّدات مثل `.md\:grid-cols-2` تنكسر بإعادة تسمية `.md`. والبديل لا يجلب فائدة: أصناف Tailwind مشتركة مع ملايين المواقع لا مع أسطول علاء. |
| `gen-assets.mjs`، `gen-article-images.mjs` | **لا** | للموقع `make-og.mjs` و33 بطاقة مشاركة قائمة؛ وصور المقالات إضافة محتوى. |
| حقول `site.ts` الجديدة (`business`، `brandInitial`، `social`) | **لا** | تخدم مكوّنات القالب غير الموجودة هنا. السكيما الحالية `Organization` بلا عنوان ولا `sameAs` فارغ — وهو ما يطلبه البرومبت أصلاً (يُتحقق في `dist`). |
| حقن Breadcrumbs في الصفحات الداخلية | **تحقق فقط** | الموقع يملك `Breadcrumbs.astro` و`BreadcrumbList`؛ يُعدّ في `dist` كم صفحة تحملها، ولا يُضاف شيء إلا إن نقصت صفحة داخلية. |
| `check-layout`، `check-template-leftovers`، `qa-articles`، `check-keyword-focus`، `check-reskin-scripts` | **لا** | تفحص ملفات القالب أو `.md`؛ على هذا الموقع إما تفشل أو تمر خضراء بلا فحص. |
| `check-internal-links`، `check-title-lengths`، `check-keyword-coverage` | **لا** | مكررة: `index.ts` يُفشل البناء على الروابط الواردة وعلى كلمات الخريطة الـ123، و`audit.mjs` يفحص طول العنوان على كل الصفحات. |
| `check-cross-site-dup.mjs` | **يُشغَّل مرة للتقرير** | يقرأ `.md` فقط؛ نصوص هذا الموقع في `.ts`. يُشغَّل على نص `dist` المستخرج مقابل المحفظة إن أمكن بلا تعديل الفاحص، وإلا يُذكر أنه لم يُقس. |

## STOP والحدود

- الموقع عند **صفر ظهور** (10–18 نوفمبر) و33 من 34 صفحة «تم الزحف، لم تتم فهرستها». قاعدة STOP في الحزمة (أقل من 100 ظهور في 28 يوماً) **تمنع أي محتوى جديد**، فلا صفحات ولا أقسام جديدة في هذه الجولة.
- **الترحيل لا يحل مشكلة الفهرسة.** فحص 20 نوفمبر أثبت: لا عائق تقني (كلها `INDEXING_ALLOWED` وcanonical صحيح). العائق سلطة وجودة في موضوع YMYL طبي بلا روابط خلفية. هذه الجولة تضيف **حرّاساً** يمنعون أخطاء المستقبل، ولا ترفع الفهرسة.
- لا طلب فهرسة ولا IndexNow من هذه الجلسة (قاعدة «خبير الفهرسة»).

## خطوات التنفيذ

1. نسخ الفواحص وتعديلها كما في «ما يُنقل»، وتجربة كل واحد على مخالفة مزروعة في نسخة `dist` مؤقتة (ثم حذفها). commit.
2. سكربتات البحث الثلاثة + تجربة `gsc-opportunities` على بيانات Search Console حقيقية (قراءة فقط). commit.
3. `check:all` و`verify:live` في `package.json`. commit.
4. بناء نظيف (حذف `dist` و`.astro`)، ومقارنة عدد الصفحات والكلمات بما قبل (34 صفحة؛ يجب أن يبقى `dist` مطابقاً لأن لا تغيير في المصدر).
5. نشر: `npx wrangler pages deploy dist --project-name transplantbridge --branch=main`. إن حوّل wrangler الأمر إلى Worker أو عدّل `astro.config.mjs`/`package.json`/أنشأ `wrangler.jsonc` → إلغاء ذلك (`git checkout`) والإعادة.
6. `npm run verify:live`. ثم push، وسطر في ملف الحالة في المركز.
