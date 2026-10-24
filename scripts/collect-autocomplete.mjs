// جمع اقتراحات الإكمال التلقائي الحقيقية من Google (واجهة عامة، بلا تسجيل دخول).
// المخرجات: raw/autocomplete-raw.jsonl (للإثبات) + raw/autocomplete-flat.json
import { writeFileSync, appendFileSync } from "node:fs";

const ENDPOINT = "https://suggestqueries.google.com/complete/search";
const OUT_DIR = new URL("../TransplantBridge-Keyword-Research/raw/", import.meta.url);
const RAW = new URL("autocomplete-raw.jsonl", OUT_DIR);
const FLAT = new URL("autocomplete-flat.json", OUT_DIR);

const SEEDS = [
  "زراعة الكلى في تركيا","تكلفة زراعة الكلى في تركيا","شروط زراعة الكلى في تركيا","زراعة الكلى في إسطنبول",
  "زراعة الكبد في تركيا","تكلفة زراعة الكبد في تركيا","شروط زراعة الكبد في تركيا","زراعة الكبد في إسطنبول",
  "أفضل مستشفى لزراعة الكلى في تركيا","أفضل مستشفى لزراعة الكبد في تركيا",
  "طلب تقييم طبي لزراعة الكلى في تركيا","طلب تقييم طبي لزراعة الكبد في تركيا",
  "تنسيق علاج زراعة الكلى في تركيا","تنسيق علاج زراعة الكبد في تركيا",
  "تجهيز الملف الطبي لزراعة الكلى","تجهيز الملف الطبي لزراعة الكبد",
  // بذور إضافية للاستكشاف (ستُفحص ولن تُفترض)
  "زراعة الكلى","زراعة الكبد","زراعة كلى من متبرع حي","زراعة كبد من متبرع حي",
  "شروط المتبرع بالكلى","شروط المتبرع بالكبد","نسبة نجاح زراعة الكلى","نسبة نجاح زراعة الكبد",
  "زراعة الكبد للأطفال","الغسيل الكلوي أو زراعة الكلى","أدوية مثبطات المناعة بعد زراعة الكلى",
  "تأشيرة العلاج في تركيا","مستشفيات زراعة الأعضاء في تركيا","قانون زراعة الأعضاء في تركيا",
];

// توسيع بالأحرف للرؤوس الأساسية (تقنية قياسية لاكتشاف الذيل الطويل)
const HEADS = ["زراعة الكلى في تركيا","زراعة الكبد في تركيا","زراعة الكلى","زراعة الكبد"];
const AR_LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split("");

const COUNTRIES = ["jo","sa","ae","eg","kw","qa","iq"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSuggest(q, gl) {
  const url = `${ENDPOINT}?client=firefox&hl=ar&gl=${gl}&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return { q, gl, ok: false, status: res.status, suggestions: [] };
    const data = JSON.parse(await res.text());
    return { q, gl, ok: true, status: 200, suggestions: Array.isArray(data?.[1]) ? data[1] : [] };
  } catch (e) {
    return { q, gl, ok: false, status: String(e?.name || e), suggestions: [] };
  }
}

const jobs = [];
for (const gl of COUNTRIES) for (const q of SEEDS) jobs.push({ q, gl });
for (const h of HEADS) for (const L of AR_LETTERS) jobs.push({ q: `${h} ${L}`, gl: "jo" });

console.log(`jobs: ${jobs.length}`);
writeFileSync(RAW, "");
const flat = [];
let done = 0, failed = 0;
for (const j of jobs) {
  const r = await fetchSuggest(j.q, j.gl);
  const stamp = new Date().toISOString();
  appendFileSync(RAW, JSON.stringify({ ...r, retrieved_at: stamp, endpoint: ENDPOINT, hl: "ar" }) + "\n");
  if (!r.ok) failed++;
  for (const s of r.suggestions) flat.push({ suggestion: s, seed: j.q, country: j.gl, retrieved_at: stamp });
  if (++done % 40 === 0) console.log(`  ${done}/${jobs.length} (failed: ${failed})`);
  await sleep(120);
}
writeFileSync(FLAT, JSON.stringify(flat, null, 1));
const uniq = new Set(flat.map((f) => f.suggestion));
console.log(`DONE jobs=${done} failed=${failed} rows=${flat.length} unique_suggestions=${uniq.size}`);
