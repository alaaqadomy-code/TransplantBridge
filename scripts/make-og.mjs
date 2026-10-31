// scripts/make-og.mjs — يولّد صور المشاركة (1200×630) بثيم الموقع.
//
// صورة لكل صفحة لا صورة واحدة للموقع كله: قناة التوزيع هنا واتساب، وحين
// يُعاد توجيه رابط في مجموعة عائلية فبطاقة تحمل عنوان الصفحة نفسها أنفع
// بكثير من بطاقة عامة متكررة.
//
//   node scripts/make-og.mjs          → الصورة العامة + صورة لكل صفحة
//   node scripts/make-og.mjs --brand  → الصورة العامة وحدها
//
// تُشغَّل عند تغيّر عنوان صفحة أو إضافة صفحة. المخرجات في public/og/.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const root = process.cwd();
const fontDir = join(root, "node_modules", "@fontsource-variable", "noto-kufi-arabic", "files");

/** نضمّن الخط base64 حتى لا تعتمد الصورة على شبكة ولا على خطوط النظام */
function fontB64() {
  for (const name of [
    "noto-kufi-arabic-arabic-wght-normal.woff2",
    "noto-kufi-arabic-latin-wght-normal.woff2",
  ]) {
    try {
      return readFileSync(join(fontDir, name)).toString("base64");
    } catch {}
  }
  throw new Error("لم يُعثر على ملف خط Noto Kufi Arabic");
}

const FONT = fontB64();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * @param {{heading:string, sub:string, chips:string[], headSize?:number}} o
 */
const card = (o) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face{font-family:Kufi;src:url(data:font/woff2;base64,${FONT}) format('woff2');font-weight:400 800;font-display:block}
  *{margin:0;padding:0;box-sizing:border-box}
  html{overflow:hidden}
  body{width:1200px;height:630px;background:#06121D;font-family:Kufi,sans-serif;color:#fff;overflow:hidden;position:relative;contain:paint}
  .glow{position:absolute;border-radius:9999px;filter:blur(90px);opacity:.5}
  .g1{width:620px;height:620px;background:#0d9488;top:-220px;right:-140px}
  .g2{width:520px;height:520px;background:#115e59;bottom:-240px;left:-120px}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff0a 1px,transparent 1px),linear-gradient(90deg,#ffffff0a 1px,transparent 1px);background-size:56px 56px}
  .wrap{position:relative;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 84px 72px}
  .brand{display:flex;align-items:center;gap:14px;font-size:27px;font-weight:700;letter-spacing:.5px;color:#5eead4}
  .dot{width:13px;height:13px;border-radius:9999px;background:#2dd4bf;box-shadow:0 0 22px #2dd4bf}
  h1{margin-top:34px;font-size:${o.headSize ?? 74}px;font-weight:800;line-height:1.3;max-width:1010px}
  .sub{margin-top:26px;font-size:29px;line-height:1.62;color:#cbd5e1;max-width:950px}
  .bar{margin-top:40px;display:flex;gap:13px}
  .bar span{padding:12px 24px;border:1px solid #2dd4bf4d;border-radius:9999px;font-size:23px;color:#99f6e4;background:#0d948814}
  .ecg{position:absolute;bottom:0;left:0;right:0;height:112px;opacity:.42}
</style></head><body>
  <div class="glow g1"></div><div class="glow g2"></div><div class="grid"></div>
  <div class="wrap">
    <div class="brand"><span class="dot"></span>TransplantBridge</div>
    <h1>${esc(o.heading)}</h1>
    <p class="sub">${esc(o.sub)}</p>
    <div class="bar">${o.chips.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
  </div>
  <svg class="ecg" viewBox="0 0 1200 112" preserveAspectRatio="none">
    <path d="M1200,56 L880,56 l-24,0 l-10,-9 l-8,9 l-14,0 l-9,-40 l-12,78 l-12,-60 l-10,22 l-16,0 l-120,0 l-24,0 l-10,-9 l-8,9 l-14,0 l-9,-40 l-12,78 l-12,-60 l-10,22 l-16,0 L0,56"
      fill="none" stroke="#2dd4bf" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</body></html>`;

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => { try { readFileSync(p); return true; } catch { return false; } });
if (!CHROME) throw new Error("لم يُعثر على Chrome أو Edge لالتقاط الصور");

/** يقرأ عنوان كل صفحة من البناء — مصدر واحد للحقيقة، فلا يتفرّع عن الموقع */
function pagesFromDist() {
  const dist = join(root, "dist");
  const out = [];
  for (const f of readdirSync(dist)) {
    if (!f.endsWith(".html") || f === "404.html") continue;
    const slug = f.slice(0, -5);
    const h = readFileSync(join(dist, f), "utf8");
    const h1 = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
    const desc = (h.match(/name="description" content="([^"]*)"/) || [])[1];
    const chip = (h.match(/class="chip[^"]*"[^>]*>([^<]{2,40})</) || [])[1];
    if (!h1 || !desc) continue;
    out.push({
      slug,
      // نزيل الوسوم ونقصّ عند النقطتين فيبقى الجزء الذي يحمل المعنى
      heading: h1.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      sub: desc.replace(/\s+/g, " ").trim(),
      chip: chip ? chip.trim() : null,
    });
  }
  return out;
}

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

async function shoot(html, outPath) {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(outPath, await page.screenshot({ type: "png" }));
}

mkdirSync(join(root, "public"), { recursive: true });
mkdirSync(join(root, "public", "og"), { recursive: true });

// ١) البطاقة العامة — للرئيسية وكاحتياط لأي صفحة بلا بطاقة خاصة
await shoot(
  card({
    heading: "زرع الكبد وزراعة الكلى\nنسير معك من أول خطوة".replace("\n", "<br>"),
    sub: "دليل عربي صريح: شروط المتبرع، والمخاطر، وما بعد العملية — بلا وعود وبلا أرقام مخترعة.",
    chips: ["زرع الكبد", "زراعة الكلى", "تنسيق العلاج في تركيا"],
  }),
  join(root, "public", "og.png"),
);
console.log("كُتبت: public/og.png");

if (!process.argv.includes("--brand")) {
  const pages = pagesFromDist();
  let n = 0;
  for (const p of pages) {
    // العناوين الطويلة تُصغَّر بدل أن تُقصّ، فلا تضيع كلمة من المعنى
    const len = p.heading.length;
    const headSize = len > 64 ? 46 : len > 46 ? 56 : len > 32 ? 64 : 72;
    // الوصف طويل للبطاقة: نكتفي بجملته الأولى
    const sub = p.sub.split("—")[0].split(":").slice(1).join(":").trim() || p.sub;
    await shoot(
      card({
        heading: p.heading,
        sub: sub.length > 150 ? sub.slice(0, 147).trim() + "…" : sub,
        chips: [p.chip || "دليل", "TransplantBridge"].filter(Boolean),
        headSize,
      }),
      join(root, "public", "og", `${p.slug}.png`),
    );
    n++;
  }
  console.log(`كُتبت ${n} بطاقة في public/og/`);
}

await browser.close();
