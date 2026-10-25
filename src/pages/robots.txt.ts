import type { APIRoute } from "astro";

/**
 * حرس الدومين: ما دام PUBLIC_SITE_URL غير مضبوط، يُمنع الزحف كلياً
 * فلا يُفهرس الموقع بالخطأ أثناء التطوير المحلي. وبضبط الدومين يُسمح
 * بالزحف ويُعلَن مسار sitemap.
 */
const SITE_URL = (import.meta.env.PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");

export const GET: APIRoute = () => {
  const body = SITE_URL
    ? [
        "User-agent: *",
        "Allow: /",
        "",
        `Sitemap: ${SITE_URL}/sitemap-index.xml`,
        "",
      ].join("\n")
    : [
        "# وضع تطوير محلي — الدومين غير معتمد بعد.",
        "# لا يُسمح بأي زحف حتى يُضبط PUBLIC_SITE_URL.",
        "User-agent: *",
        "Disallow: /",
        "",
      ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
