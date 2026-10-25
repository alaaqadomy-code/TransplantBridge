// scripts/indexnow.mjs — يُبلّغ Bing/Yandex وغيرها بكل روابط الموقع عبر IndexNow.
// يُشغَّل بعد كل نشر: node scripts/indexnow.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const HOST = "transplantbridge.com";
const KEY = readdirSync(join(root, "public"))
  .find((f) => /^[0-9a-f]{32}\.txt$/.test(f))
  ?.replace(/\.txt$/, "");
if (!KEY) throw new Error("لم يُعثر على ملف مفتاح IndexNow في public/");

// الروابط من sitemap المبني — فلا تُرسل صفحة غير موجودة فعلاً
const xml = readFileSync(join(root, "dist", "sitemap-0.xml"), "utf8");
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) throw new Error("sitemap فارغ — ابنِ المشروع أولاً");

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList,
};

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

console.log(`IndexNow: ${res.status} ${res.statusText} — أُرسل ${urlList.length} رابطاً`);
if (res.status !== 200 && res.status !== 202) {
  console.log(await res.text());
  process.exit(1);
}
