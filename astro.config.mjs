// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

/**
 * حرس الدومين (PLAN.md §6):
 * ما دام PUBLIC_SITE_URL غير مضبوط، لا يُولَّد sitemap ولا يُطبع canonical،
 * ويُخرج robots.txt منع زحف كامل. فلا يدخل الموقع فهرسة Google بالخطأ،
 * ولا يوجد عنوان إنتاج وهمي في أي ملف. وبضبط المتغيّر ينقلب الثلاثة معاً.
 */
const RAW_SITE = (process.env.PUBLIC_SITE_URL || "").trim();
const SITE_URL = RAW_SITE ? RAW_SITE.replace(/\/+$/, "") : undefined;
const IS_LOCAL = !SITE_URL;

// نطاقات Unicode: نحمّل العربي والّلاتيني منفصلَين فلا يُنزّل ما لا يُستعمل.
const AR =
  "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC";
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

export default defineConfig({
  ...(SITE_URL ? { site: SITE_URL } : {}),
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "auto" },
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  // لا sitemap قبل اعتماد الدومين
  integrations: IS_LOCAL
    ? []
    : [sitemap({ filter: (page) => !page.includes("/404"), lastmod: new Date() })],

  /**
   * خطوط مستضافة ذاتياً — صفر طلبات لخوادم خارجية.
   * العناوين: Noto Kufi Arabic — كوفي هندسي له شخصية قوية وحضور بصري.
   * النص: Tajawal — عربي دافئ وعالي القراءة على الشاشة.
   */
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Noto Kufi Arabic",
      cssVariable: "--font-display",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/noto-kufi-arabic/files/noto-kufi-arabic-arabic-wght-normal.woff2"],
            weight: "400 800",
            style: "normal",
            unicodeRange: [AR],
          },
          {
            src: ["@fontsource-variable/noto-kufi-arabic/files/noto-kufi-arabic-latin-wght-normal.woff2"],
            weight: "400 800",
            style: "normal",
            unicodeRange: [LATIN],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Tajawal",
      cssVariable: "--font-body",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource/tajawal/files/tajawal-arabic-400-normal.woff2"],
            weight: 400,
            style: "normal",
            unicodeRange: [AR],
          },
          {
            src: ["@fontsource/tajawal/files/tajawal-arabic-500-normal.woff2"],
            weight: 500,
            style: "normal",
            unicodeRange: [AR],
          },
          {
            src: ["@fontsource/tajawal/files/tajawal-arabic-700-normal.woff2"],
            weight: 700,
            style: "normal",
            unicodeRange: [AR],
          },
          {
            src: ["@fontsource/tajawal/files/tajawal-latin-400-normal.woff2"],
            weight: 400,
            style: "normal",
            unicodeRange: [LATIN],
          },
        ],
      },
    },
  ],
});
