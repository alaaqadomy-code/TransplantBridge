/**
 * يبني ملف معاينة واحداً مكتفياً بذاته من dist/:
 * يدمج CSS داخل <style>، ويحوّل الخطوط إلى base64، ويحوّل الروابط الداخلية
 * إلى مراسٍ داخل الصفحة. الغرض: عرض الشكل بلا خادم وبلا أي رفع خارجي.
 *
 * التشغيل: npm run build ثم node scripts/make-preview.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const OUT_DIR = join(ROOT, "preview");

if (!existsSync(join(DIST, "index.html"))) {
  console.error("dist/index.html غير موجود — شغّل npm run build أولاً.");
  process.exit(1);
}

let html = readFileSync(join(DIST, "index.html"), "utf8");

// 1) دمج ملفات CSS داخل الصفحة
let cssInlined = 0;
html = html.replace(
  /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g,
  (_m, href) => {
    const p = join(DIST, href.replace(/^\//, ""));
    if (!existsSync(p)) return "";
    cssInlined++;
    return `<style>${readFileSync(p, "utf8")}</style>`;
  }
);

// 2) تحويل الخطوط إلى base64 داخل CSS المدمج
let fontsInlined = 0;
html = html.replace(/url\(["']?(\/_astro\/fonts\/[^"')]+)["']?\)/g, (m, href) => {
  const p = join(DIST, href.replace(/^\//, ""));
  if (!existsSync(p)) return m;
  const b64 = readFileSync(p).toString("base64");
  fontsInlined++;
  return `url("data:font/woff2;base64,${b64}")`;
});

// 3) إزالة preload الخطوط (صارت مدمجة) وأي preload لملفات لم تعد موجودة
html = html.replace(/<link[^>]+rel="preload"[^>]*>/g, "");

// 3b) إزالة سكربت الـprefetch الخارجي (لا معنى له بلا خادم)
html = html.replace(/<script[^>]+src="\/_astro\/[^"]+"[^>]*><\/script>/g, "");

// 4) الروابط الداخلية: تُعطَّل كي لا تُظهر خطأ في المعاينة، مع إبقاء مظهرها
html = html.replace(/href="(\/[^"#][^"]*)"/g, 'data-local-href="$1" href="#"');

// 5) لافتة توضّح أن هذه معاينة شكلية
const banner = `<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#0F766E;color:#fff;
font:600 13px/1.6 system-ui,sans-serif;text-align:center;padding:7px 12px;direction:rtl">
معاينة شكلية للصفحة الرئيسية — الروابط معطّلة هنا. للتصفّح الكامل افتح http://localhost:4330
</div><div style="height:34px"></div>`;
html = html.replace(/<body([^>]*)>/, `<body$1>${banner}`);

mkdirSync(OUT_DIR, { recursive: true });
const out = join(OUT_DIR, "TransplantBridge-preview.html");
writeFileSync(out, html);

console.log(`CSS مدمج: ${cssInlined} | خطوط مدمجة: ${fontsInlined}`);
console.log(`الحجم: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
console.log(out);
