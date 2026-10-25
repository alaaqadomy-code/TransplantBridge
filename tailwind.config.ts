import type { Config } from "tailwindcss";

/**
 * هوية TransplantBridge البصرية: «التعافي يبدأ من هنا».
 * تركواز طبي هادئ (شفاء) + أبيض نظيف + لمسة ذهبية خفيفة (أمل).
 * لا ألوان صارخة ولا تخويف.
 */
const config: Config = {
  content: ["./src/**/*.{astro,ts,md}"],
  theme: {
    extend: {
      colors: {
        // التركواز الطبي — اللون الأساسي
        shifa: {
          50: "#ECFDFA",
          100: "#CFFAF1",
          200: "#9EF2E3",
          300: "#5EE7D0",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#042F2E",
        },
        // لمسة الأمل — للعناصر المهمة فقط، بخل شديد
        amal: { DEFAULT: "#E8B45A", light: "#F3D193", dark: "#C4913C" },
        // النص: رمادي مزرق دافئ، لا أسود قاسٍ
        ink: {
          900: "#0B1B2B",
          800: "#13293D",
          700: "#1E3A4C",
          600: "#345668",
          500: "#4A6572",
          400: "#6B8294",
          300: "#9DAFBC",
        },
        paper: { DEFAULT: "#F7FBFC", warm: "#FBFDFD" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.5rem" },
      boxShadow: {
        soft: "0 1px 2px rgba(11,27,43,.04), 0 8px 24px -12px rgba(11,27,43,.10)",
        lift: "0 2px 4px rgba(11,27,43,.05), 0 20px 40px -16px rgba(13,148,136,.22)",
        glow: "0 0 0 1px rgba(20,184,166,.12), 0 12px 32px -8px rgba(20,184,166,.28)",
      },
      keyframes: {
        // ظهور تدريجي عند التمرير — transform/opacity فقط
        rise: {
          from: { opacity: "0", transform: "translate3d(0,18px,0)" },
          to: { opacity: "1", transform: "none" },
        },
        // تدرّج Hero يتنفّس ببطء شديد
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-16px,0) scale(1.04)" },
        },
        // نبض خفيف جداً حول زر الواتساب
        halo: {
          "0%": { opacity: ".55", transform: "scale(1)" },
          "70%": { opacity: "0", transform: "scale(1.5)" },
          "100%": { opacity: "0", transform: "scale(1.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
      animation: {
        rise: "rise .7s cubic-bezier(.22,1,.36,1) both",
        drift: "drift 14s ease-in-out infinite",
        halo: "halo 2.8s cubic-bezier(.4,0,.6,1) infinite",
        shimmer: "shimmer 7s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
