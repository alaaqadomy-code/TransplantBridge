/**
 * خريطة الكلمات المُلزِمة — كل كلمة من KEYWORDS-MASTER.md وصفحتها.
 *
 * الفحص في index.ts يوقف البناء إن غابت أي كلمة عن نص صفحتها.
 * فالسيطرة هنا مفروضة آلياً لا موعودة في خطة.
 *
 * التطبيع: Google يطبّع الهمزات (أ/إ/آ ← ا) والألف المقصورة (ى ← ي)
 * والتاء المربوطة (ة ← ه). فنطبّع الطرفين في الفحص، وبذلك تكفي صيغة واحدة
 * لتغطية رسماتها المختلفة بدل حشو النص بكل الرسمات.
 */

/** يطبّع النص العربي كما يفعل محرك البحث تقريباً */
export const norm = (s: string): string =>
  s
    .replace(/[ؗ-ًؚ-ْٰـ]/g, "") // تشكيل وتطويل
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();

type Tier = 1 | 2;

/** [الكلمة, الصفحة, الفئة] */
export const KEYWORD_MAP: [string, string, Tier][] = [
  // ───────── الفئة الأولى (100+ شهرياً) ─────────
  ["زرع الكبد", "liver-transplant", 1],
  ["عملية زرع الكبد", "liver-transplant", 1],
  ["التبرع بالكبد", "liver-donation", 1],
  ["تبرع بالكبد", "liver-donation", 1],
  ["تبرع بكبد", "liver-donation", 1],
  ["شروط التبرع بالكبد", "liver-donor-requirements", 1],
  ["زراعة الكلى", "kidney-transplant", 1],
  ["عملية زراعة الكلى", "kidney-transplant", 1],
  ["عمليات زراعة الكلى", "kidney-transplant", 1],
  ["نسبة نجاح عملية زراعة الكلى", "kidney-transplant-success-rate", 1],
  ["التبرع بالكلى", "kidney-donation", 1],
  ["تبرع بالكلى", "kidney-donation", 1],
  ["شروط التبرع بالكلى", "kidney-donor-requirements", 1],
  ["أضرار التبرع بالكلى على المتبرع", "kidney-donor-risks", 1],
  ["فوائد التبرع بالكلى", "kidney-donor-risks", 1],
  ["فترة العزل بعد زراعة الكلى", "after-kidney-transplant", 1],
  ["أفضل دولة في زراعة الكلى", "best-country-kidney-transplant", 1],

  // ───────── الفئة الثانية — الكبد ─────────
  ["عملية نقل الكبد", "liver-transplant", 2],
  ["طريقة التبرع بالكبد", "liver-donation", 2],
  ["كيفية التبرع بالكبد", "liver-donation", 2],
  ["عملية تبرع بالكبد", "liver-donation", 2],
  ["شروط المتبرع بالكبد", "liver-donor-requirements", 2],
  ["شروط متبرع الكبد", "liver-donor-requirements", 2],
  ["شروط تبرع الكبد", "liver-donor-requirements", 2],
  ["شروط التبرع بجزء من الكبد", "liver-donor-requirements", 2],
  ["متبرع الكبد", "liver-donor-requirements", 2],
  ["متبرع بالكبد", "liver-donor-requirements", 2],
  ["خطورة التبرع بالكبد", "liver-donor-risks", 2],
  ["مخاطر التبرع بالكبد", "liver-donor-risks", 2],
  ["مضاعفات التبرع بالكبد", "liver-donor-risks", 2],
  ["أضرار التبرع بالكبد", "liver-donor-risks", 2],
  ["آثار التبرع بالكبد", "liver-donor-risks", 2],
  ["أضرار زراعة الكبد", "liver-donor-risks", 2],
  ["مخاطر زراعة الكبد على المتبرع", "liver-donor-risks", 2],
  ["زراعة الكبد من متبرع حي", "living-donor-liver-transplant", 2],
  ["عملية زراعة الكبد من متبرع حي", "living-donor-liver-transplant", 2],
  ["زراعة جزء من الكبد", "living-donor-liver-transplant", 2],
  ["نسبة نجاح زراعة الكبد", "liver-transplant-success-rate", 2],
  ["نسبة نجاح عملية زراعة الكبد في تركيا", "liver-transplant-success-rate", 2],

  // ───────── الفئة الثانية — الكلى ─────────
  ["طريقة زراعة الكلى", "kidney-transplant", 2],
  ["كيفية زراعة الكلى", "kidney-transplant", 2],
  ["إجراءات زراعة الكلى", "kidney-transplant", 2],
  ["عملية زرع كلية", "kidney-transplant", 2],
  ["عملية زراعة الكلية", "kidney-transplant", 2],
  ["عملية زراعة كلى", "kidney-transplant", 2],
  ["زراعة الكلية", "kidney-transplant", 2],
  ["زراعة الكلى كيف تتم", "kidney-transplant", 2],
  ["عملية زراعة الكلى كم تستغرق", "kidney-transplant", 2],
  ["زراعة الكلى بالروبوت", "kidney-transplant", 2],
  ["هل زراعة الكلى افضل من الغسيل", "kidney-transplant", 2],
  ["هل يمكن زراعة الكلى قبل الغسيل", "kidney-transplant", 2],
  ["طريقة التبرع بالكلى", "kidney-donation", 2],
  ["إجراءات التبرع بالكلى", "kidney-donation", 2],
  ["عملية تبرع بالكلى", "kidney-donation", 2],
  ["عملية تبرع كلى", "kidney-donation", 2],
  ["شروط المتبرع بالكلى", "kidney-donor-requirements", 2],
  ["ماهي شروط المتبرع بالكلى", "kidney-donor-requirements", 2],
  ["شروط تبرع بالكلى", "kidney-donor-requirements", 2],
  ["شروط نقل الكلى", "kidney-donor-requirements", 2],
  ["متبرع الكلى", "kidney-donor-requirements", 2],
  ["أضرار التبرع بالكلى", "kidney-donor-risks", 2],
  ["آثار التبرع بالكلى", "kidney-donor-risks", 2],
  ["أخطار التبرع بالكلى", "kidney-donor-risks", 2],
  ["خطورة التبرع بالكلى", "kidney-donor-risks", 2],
  ["مخاطر زراعة الكلى", "kidney-donor-risks", 2],
  ["مخاطر زراعة الكلى على المتبرع", "kidney-donor-risks", 2],
  ["نسبة نجاح زراعة الكلى", "kidney-transplant-success-rate", 2],
  ["عمر الكلية المزروعة", "kidney-transplant-success-rate", 2],
  ["عمر الكلى المزروعة", "kidney-transplant-success-rate", 2],
  ["عمر زراعة الكلى", "kidney-transplant-success-rate", 2],
  ["مدة الكلية المزروعة", "kidney-transplant-success-rate", 2],
  ["زراعة الكلى كم تدوم", "kidney-transplant-success-rate", 2],
  ["مضاعفات زرع الكلى", "kidney-transplant-success-rate", 2],
  ["أدوية زراعة الكلى", "after-kidney-transplant", 2],
  ["وقف أدوية مثبطات المناعة بعد زراعة الكلى", "after-kidney-transplant", 2],
  ["بعد زراعة الكلى", "after-kidney-transplant", 2],
  ["الحياة بعد زراعة الكلى", "after-kidney-transplant", 2],
  ["مدة العزل بعد زراعة الكلى", "after-kidney-transplant", 2],
  ["زراعة الكلى للمرة الثانية", "repeat-kidney-transplant", 2],
  ["هل يمكن زراعة الكلى مرتين", "repeat-kidney-transplant", 2],
  ["زراعة الكلى الاصطناعية", "repeat-kidney-transplant", 2],
  ["زراعة الكلى على حساب الدولة", "repeat-kidney-transplant", 2],

  // ───────── الفئة الثانية — القرار والوجهة ─────────
  ["أفضل مكان لزراعة الكلى في العالم", "best-country-kidney-transplant", 2],
  ["أفضل مكان لزراعة الكلى", "best-country-kidney-transplant", 2],
  ["زراعة الكلى في الخارج", "best-country-kidney-transplant", 2],
  ["زرع الكبد في تركيا", "liver-transplant-turkey", 2],
  ["زراعة الكبد في تركيا", "liver-transplant-turkey", 2],
  ["تكلفة زراعة الكبد في تركيا", "liver-transplant-turkey", 2],
  ["سعر زراعة الكبد في تركيا", "liver-transplant-turkey", 2],
  ["تكلفة زراعة الكبد", "liver-transplant-turkey", 2],
  ["زراعة الكلى في تركيا", "kidney-transplant-turkey", 2],
  ["تكلفة زراعة الكلى في تركيا", "kidney-transplant-turkey", 2],
  ["سعر زراعة الكلى في تركيا", "kidney-transplant-turkey", 2],
  ["تكلفة زراعة الكلى", "transplant-cost", 2],
  ["أسعار زراعة الكلى", "transplant-cost", 2],
  ["سعر زراعة الكلى", "transplant-cost", 2],
  ["مستشفيات زراعة الكلى في تركيا", "transplant-hospitals-turkey", 2],
  ["مستشفى زراعة الكلى في تركيا", "transplant-hospitals-turkey", 2],
  ["أفضل مستشفى لزراعة الكلى في تركيا", "transplant-hospitals-turkey", 2],
  ["أفضل مستشفى لزراعة الكلى", "transplant-hospitals-turkey", 2],
  ["مستشفى زراعة الكبد في تركيا", "transplant-hospitals-turkey", 2],
  ["مستشفيات زراعة الكبد في تركيا", "transplant-hospitals-turkey", 2],
  ["أفضل مستشفى لزراعة الكبد في تركيا", "transplant-hospitals-turkey", 2],
  ["دكتور زراعة كبد", "transplant-hospitals-turkey", 2],
  ["دكتور زراعة كلى", "transplant-hospitals-turkey", 2],
];

/**
 * كلمات من البنك لا تُستهدف عمداً — موثّقة هنا كي لا يظنّ أحد أنها نُسيت.
 */
export const EXCLUDED: [string, string][] = [
  ["مواقع التبرع بالكلى", "نية بيع/شراء عضو — محظورة (KEYWORDS-MASTER §محظورة)"],
  ["صفحة التبرع بالكلى", "نية بيع/شراء عضو — محظورة"],
  ["عايز اتبرع بالكلى", "عرض بيع عضو — محظورة"],
  ["تبرع بالكلى بمقابل مادي", "بيع صريح — محظورة"],
  ["مركز التبرع بالكلى", "وساطة — محظورة"],
  ["وظائف للمتبرعين بالكلى", "بيع مقنّع — محظورة"],
  ["تجربتي مع التبرع بالكلى عالم حواء", "يجذب نية البيع + يتطلب شهادة موثقة"],
  ["تجربتي مع زراعة الكبد عالم حواء", "يتطلب موافقة موثقة من صاحب التجربة"],
  ["تجربتي مع زراعة الكلى عالم حواء", "يتطلب موافقة موثقة من صاحب التجربة"],
  ["تكلفة زراعة الحالب", "خارج نطاق الموقع (الكلى والكبد فقط)"],
  ["زراعة الكلى في مصر", "وجهة أخرى — بيانات سياق لا استهداف"],
  ["زراعة الكبد في مصر", "وجهة أخرى — بيانات سياق لا استهداف"],
  ["زراعة الكبد في الهند", "وجهة أخرى — بيانات سياق لا استهداف"],
  ["زراعة الكلى في الهند", "وجهة أخرى — بيانات سياق لا استهداف"],
  ["زراعة الكلى في باكستان", "وجهة أخرى + تقارير اتجار — لا تُستهدف"],
  ["عمليه الكبد", "صيغة مبهمة لا نية واضحة لها"],
];
