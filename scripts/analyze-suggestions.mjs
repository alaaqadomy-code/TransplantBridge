import { readFileSync } from "node:fs";
const flat = JSON.parse(readFileSync(new URL("../TransplantBridge-Keyword-Research/raw/autocomplete-flat.json", import.meta.url)));
const IN = /كلى|كلي|كبد/;
const OUT = /نخاع|شعر|أسنان|قرنية|رئة|قلب|بنكرياس|وجه|يد |ذراع/;
const m = new Map();
for (const r of flat) {
  const s = r.suggestion.trim();
  if (!IN.test(s) || OUT.test(s)) continue;
  if (!m.has(s)) m.set(s, { s, countries: new Set(), seeds: new Set() });
  m.get(s).countries.add(r.country); m.get(s).seeds.add(r.seed);
}
const rows = [...m.values()].map(x => ({ s: x.s, c: [...x.countries].sort().join(","), n: x.countries.size }))
  .sort((a,b) => b.n - a.n || a.s.localeCompare(b.s,"ar"));
console.log(`in-scope unique suggestions: ${rows.length}\n`);
const turkey = rows.filter(r => /تركيا|اسطنبول|إسطنبول|انطاليا|أنطاليا/.test(r.s));
const generic = rows.filter(r => !/تركيا|اسطنبول|إسطنبول|انطاليا|أنطاليا/.test(r.s));
console.log(`=== مرتبطة بتركيا (${turkey.length}) ===`);
for (const r of turkey) console.log(`${String(r.n).padStart(2)}/7 [${r.c}]  ${r.s}`);
console.log(`\n=== عامة بلا ذكر تركيا (${generic.length}) ===`);
for (const r of generic) console.log(`${String(r.n).padStart(2)}/7 [${r.c}]  ${r.s}`);
