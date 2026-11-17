#!/usr/bin/env node
// Meldet neue und aktualisierte URLs nach dem Deploy per IndexNow (Bing, Yandex, Seznam, Naver …).
// Google nutzt IndexNow nicht – dort reicht die Sitemap (einmalig in der Search Console einreichen).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { site } from '../site.config.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const datei = JSON.parse(await readFile(path.join(ROOT, '.publish/neue-urls.json'), 'utf8').catch(() => '{"urls":[]}'));
const alterStunden = (Date.now() - new Date(datei.erstellt ?? 0)) / 36e5;

if (!datei.urls?.length || alterStunden > 24) {
  console.log('Keine frischen URLs (älter als 24 h oder leer) – nichts zu melden.');
  process.exit(0);
}

const urls = [...new Set([...datei.urls, `${site.url}/`, `${site.url}/llms.txt`])];
const host = new URL(site.url).host;
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: site.indexNowKey, keyLocation: `${site.url}/${site.indexNowKey}.txt`, urlList: urls }),
});
console.log(`IndexNow: HTTP ${res.status} für ${urls.length} URL(s)`);
if (res.status >= 400) process.exit(1);
