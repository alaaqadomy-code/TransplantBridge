/**
 * دومين TransplantBridge للفواحص المنقولة من القالب.
 *
 * نسخة القالب تقرأ `src/config/site.ts` وهو غير موجود هنا: الدومين في `PUBLIC_SITE_URL`
 * (`.env`، غير متتبَّع) ومنسوخ في `.claude/site.json` (`live`). نقرأ الأول ثم الثاني،
 * ونرمي خطأً إن غابا: فاحص يخمّن دوميناً يفحص موقعاً غير الذي أمامه.
 */
import { readFileSync, existsSync } from 'node:fs';

export function siteUrl() {
  const env = existsSync('.env') ? readFileSync('.env', 'utf8').match(/^PUBLIC_SITE_URL\s*=\s*["']?([^"'\s]+)/m)?.[1] : '';
  const json = existsSync('.claude/site.json') ? JSON.parse(readFileSync('.claude/site.json', 'utf8')).live : '';
  const url = (process.env.PUBLIC_SITE_URL || env || json || '').trim().replace(/\/+$/, '');
  if (!url) throw new Error('لا دومين: اضبط PUBLIC_SITE_URL في .env أو live في .claude/site.json');
  return url;
}
