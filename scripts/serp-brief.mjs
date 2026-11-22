/**
 * موجز منافسين مجاني لكل صفحة قبل كتابتها — بلا أدوات مدفوعة.
 *
 * الخطوة اليدوية (الوكيل): ابحث عن الكلمة الأساسية بأداة WebSearch، وانسخ أول 3–5 نتائج
 * **عضوية** (تجاهل الإعلانات ومنصّات الحجز العملاقة إن لم تكن نفس نوع الصفحة).
 * ثم شغّل:
 *   node scripts/serp-brief.mjs --slug=<slug> --kw="الكلمة" <url1> <url2> <url3>
 *
 * يجلب كل صفحة ويستخرج: العنوان، H1، عناوين H2/H3، عدد الكلمات، الجداول، الأسئلة الشائعة،
 * أنواع السكيما — ويكتب content-plan/briefs/<slug>.md. مولّد المقالات (gen-article-gemini)
 * يقرأ هذا الملف تلقائيًا ويطلب تغطية **كل** ما يغطيه المنافسون + ما ينقصهم.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split(/=(.*)/s)).map(([k, v]) => [k, v ?? true]));
const urls = args.filter((a) => /^https?:\/\//.test(a));
if (!opt.slug || !urls.length) { console.error('الاستخدام: node scripts/serp-brief.mjs --slug=<slug> --kw="..." <url...>'); process.exit(1); }

const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

async function analyse(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130', 'Accept-Language': 'ar,en;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
    if (!r.ok) return { url, error: `HTTP ${r.status}` };
    const h = await r.text();
    const main = h.match(/<main[\s\S]*?<\/main>/)?.[0] || h.match(/<article[\s\S]*?<\/article>/)?.[0] || h;
    const heads = [...main.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ lvl: +m[1], text: strip(m[2]) })).filter((x) => x.text && x.text.length < 160 && !/^(related|faq|share|comments?|subscribe|menu|contact|مقالات ذات صلة|اقرأ أيضا|الأسئلة الشائعة|شارك|التعليقات|القائمة|похожие|комментарии)/i.test(x.text));
    const words = strip(main).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    const schema = [...h.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
    return {
      url,
      title: strip(h.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || ''),
      words,
      tables: (main.match(/<table/g) || []).length,
      faq: /faq|الأسئلة الشائعة|أسئلة شائعة|частые вопросы/i.test(main),
      schema: [...new Set(schema)].slice(0, 10),
      heads,
    };
  } catch (e) { return { url, error: e.message }; }
}

const res = [];
for (const u of urls) { process.stdout.write(`→ ${u} `); const a = await analyse(u); res.push(a); console.log(a.error ? `✗ ${a.error}` : `✓ ${a.words} كلمة، ${a.heads.length} عنوان`); }
const ok = res.filter((r) => !r.error);
const median = ok.length ? ok.map((r) => r.words).sort((a, b) => a - b)[Math.floor(ok.length / 2)] : 0;

let md = `# موجز المنافسين: ${opt.kw || opt.slug}\n\nتاريخ: ${new Date().toISOString().slice(0, 10)} · صفحات محلّلة: ${ok.length}/${res.length} · وسيط الطول: ${median} كلمة\n\n`;
md += `## ما يجب أن يغطيه المقال (من عناوين المنافسين)\n\n${[...new Set(ok.flatMap((r) => r.heads.filter((x) => x.lvl === 2).map((x) => x.text)))].map((t) => `- ${t}`).join('\n')}\n\n`;
md += `## تعليمات للكاتب\n\n- غطِّ كل موضوع أعلاه بما يناسب نيّة «${opt.kw || ''}»، ثم أضف ما ينقصهم (تجربة مباشرة، جدول مقارنة، أسئلة حقيقية من العملاء).\n- لا تنسخ صياغاتهم. الطول المستهدف: ${Math.max(2000, Math.round(median * 1.2))} كلمة تقريبًا (لا حشو).\n${ok.some((r) => r.faq) ? '- المنافسون يستخدمون أسئلة شائعة — أضف 6–8 أسئلة أفضل.\n' : ''}${ok.some((r) => r.tables) ? '- المنافسون يستخدمون جداول — أضف جدولًا أوضح.\n' : ''}\n`;
for (const r of res) {
  md += `## ${r.url}\n\n`;
  if (r.error) { md += `تعذّر الجلب: ${r.error}\n\n`; continue; }
  md += `- العنوان: ${r.title}\n- الكلمات: ${r.words} · جداول: ${r.tables} · أسئلة شائعة: ${r.faq ? 'نعم' : 'لا'} · سكيما: ${r.schema.join(', ') || '—'}\n\n${r.heads.map((x) => `${'  '.repeat(x.lvl - 1)}- H${x.lvl}: ${x.text}`).join('\n')}\n\n`;
}
mkdirSync('content-plan/briefs', { recursive: true });
writeFileSync(`content-plan/briefs/${opt.slug}.md`, md);
console.log(`✓ content-plan/briefs/${opt.slug}.md (وسيط ${median} كلمة)`);
