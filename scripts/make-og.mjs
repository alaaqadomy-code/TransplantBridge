// scripts/make-og.mjs — يولّد صورة المشاركة (1200×630) بنفس ثيم الموقع.
// تُشغَّل يدوياً عند تغيّر الهوية فقط: node scripts/make-og.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face{font-family:Kufi;src:url(data:font/woff2;base64,${fontB64()}) format('woff2');font-weight:400 800;font-display:block}
  *{margin:0;padding:0;box-sizing:border-box}
  html{overflow:hidden}body{width:1200px;height:630px;background:#06121D;font-family:Kufi,sans-serif;color:#fff;overflow:hidden;position:relative;contain:paint}
  .glow{position:absolute;border-radius:9999px;filter:blur(90px);opacity:.5}
  .g1{width:620px;height:620px;background:#0d9488;top:-220px;right:-140px}
  .g2{width:520px;height:520px;background:#115e59;bottom:-240px;left:-120px}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff0a 1px,transparent 1px),linear-gradient(90deg,#ffffff0a 1px,transparent 1px);background-size:56px 56px}
  .wrap{position:relative;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 84px 72px}
  .brand{display:flex;align-items:center;gap:14px;font-size:27px;font-weight:700;letter-spacing:.5px;color:#5eead4}
  .dot{width:13px;height:13px;border-radius:9999px;background:#2dd4bf;box-shadow:0 0 22px #2dd4bf}
  h1{margin-top:34px;font-size:74px;font-weight:800;line-height:1.26;max-width:1010px}
  .sub{margin-top:28px;font-size:31px;line-height:1.62;color:#cbd5e1;max-width:950px}
  .bar{margin-top:44px;display:flex;gap:13px}
  .bar span{padding:12px 24px;border:1px solid #2dd4bf4d;border-radius:9999px;font-size:23px;color:#99f6e4;background:#0d948814}
  .ecg{position:absolute;bottom:0;left:0;right:0;height:112px;opacity:.42}
</style></head><body>
  <div class="glow g1"></div><div class="glow g2"></div><div class="grid"></div>
  <div class="wrap">
    <div class="brand"><span class="dot"></span>TransplantBridge</div>
    <h1>زرع الكبد وزراعة الكلى<br>نسير معك من أول خطوة</h1>
    <p class="sub">دليل عربي صريح: شروط المتبرع، والمخاطر، وما بعد العملية — بلا وعود وبلا أرقام مخترعة.</p>
    <div class="bar"><span>زرع الكبد</span><span>زراعة الكلى</span><span>تنسيق العلاج في تركيا</span></div>
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
if (!CHROME) throw new Error("لم يُعثر على Chrome أو Edge لالتقاط الصورة");

// playwright-core يقود كروم المثبّت على الجهاز (بلا تنزيل متصفح)،
// ويضبط deviceScaleFactor بدقة فلا يتدخّل تكبير ويندوز في المقاس.
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

mkdirSync(join(root, "public"), { recursive: true });
const out = join(root, "public", "og.png");
writeFileSync(out, await page.screenshot({ type: "png" }));
await browser.close();
console.log("كُتبت:", out);
