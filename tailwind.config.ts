import type { Config } from "tailwindcss";

/**
 * هوية TransplantBridge: «التعافي يبدأ من هنا».
 * عمق داكن فاخر + تركواز حيّ + لمسة ذهبية. كل الأثر البصري من CSS وSVG مضمّنين،
 * فلا صور تُحمَّل ولا مكتبات، ولا أثر على السرعة.
 */
const config: Config = {
  content: ["./src/**/*.{astro,ts,md}"],
  theme: {
    extend: {
      colors: {
        // التركواز الحيّ — اللون الأساسي
        shifa: {
          50: "#ECFEFA",
          100: "#CFFBF1",
          200: "#9DF5E4",
          300: "#5FE9D0",
          400: "#2BD9BC",
          500: "#0FBFA4",
          600: "#099A85",
          700: "#0B7A6B",
          800: "#0D6157",
          900: "#0F4F48",
          950: "#042F2C",
        },
        // العمق الداكن — خلفيات الأقسام الفاخرة
        deep: {
          700: "#0D2235",
          800: "#091A29",
          900: "#06121D",
          950: "#030A12",
        },
        // لمسة الأمل — بخل شديد
        amal: { DEFAULT: "#E9B661", light: "#F6D9A4", dark: "#C38F3E" },
        ink: {
          900: "#07131F",
          800: "#102435",
          700: "#1F3B4D",
          600: "#365668",
          500: "#4E6B7B",
          400: "#6F8795",
          300: "#A0B2BD",
          200: "#C8D5DC",
        },
        paper: { DEFAULT: "#F6FBFB", warm: "#FCFDFD" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: { tightest: "-0.045em" },
      borderRadius: { "4xl": "2rem", "5xl": "2.75rem", "6xl": "3.5rem" },
      boxShadow: {
        soft: "0 1px 2px rgba(7,19,31,.04), 0 10px 30px -14px rgba(7,19,31,.14)",
        lift: "0 2px 6px rgba(7,19,31,.06), 0 26px 50px -20px rgba(9,154,133,.30)",
        glow: "0 0 0 1px rgba(15,191,164,.16), 0 18px 48px -12px rgba(15,191,164,.42)",
        ring: "0 0 0 1px rgba(255,255,255,.08) inset",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translate3d(0,22px,0)" },
          to: { opacity: "1", transform: "none" },
        },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-22px,0) scale(1.06)" },
        },
        halo: {
          "0%": { opacity: ".6", transform: "scale(1)" },
          "70%": { opacity: "0", transform: "scale(1.55)" },
          "100%": { opacity: "0", transform: "scale(1.55)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        // نبض الضوء خلف البطل
        breathe: {
          "0%,100%": { opacity: ".55" },
          "50%": { opacity: "1" },
        },
        // رسم الخط في الرسوم التوضيحية
        draw: {
          from: { strokeDashoffset: "1000" },
          to: { strokeDashoffset: "0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        rise: "rise .8s cubic-bezier(.22,1,.36,1) both",
        drift: "drift 18s ease-in-out infinite",
        halo: "halo 3s cubic-bezier(.4,0,.6,1) infinite",
        shimmer: "shimmer 9s linear infinite",
        breathe: "breathe 7s ease-in-out infinite",
        draw: "draw 2.4s cubic-bezier(.22,1,.36,1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
